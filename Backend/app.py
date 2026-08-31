import os
import sqlite3
import requests
from typing import List, Optional
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- 1. App Initialization & CORS ---
app = FastAPI(title="Terra Studio Live API Engine")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# --- 2. Database Setup ---
DB_PATH = os.getenv("DB_PATH", "bookings.db")

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
                treatment_name TEXT NOT NULL,
                stylist TEXT NOT NULL,
                date TEXT NOT NULL,
                time_slot TEXT NOT NULL,
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                client_phone TEXT NOT NULL,
                amount INTEGER,
                payment_reference TEXT,
                status TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS providers (
                provider_id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                state TEXT NOT NULL,
                lga TEXT NOT NULL,
                city TEXT NOT NULL,
                address TEXT,
                latitude REAL,
                longitude REAL,
                salon_skill TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                passport_photo TEXT,
                status TEXT NOT NULL
            )
        """)

init_db()

@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# --- 3. Pydantic Schemas ---
class TreatmentPayload(BaseModel):
    name: str
    price: int

class BookingPayload(BaseModel):
    treatment: TreatmentPayload
    stylist: str
    date: str
    time_slot: str
    client_name: str
    client_email: str
    client_phone: str
    payment_reference: str

class BookingConfirmation(BaseModel):
    booking_id: int
    treatment_name: str
    stylist: str
    date: str
    time_slot: str
    status: str
    payment_status: str

class ProviderPayload(BaseModel):
    full_name: str
    state: str
    lga: str
    city: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    salon_skill: str
    email: str
    phone: str
    passport_photo: Optional[str] = None

class ProviderRecord(BaseModel):
    provider_id: int
    full_name: str
    state: str
    lga: str
    city: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    salon_skill: str
    email: str
    phone: str
    passport_photo: Optional[str] = None
    status: str

# --- 4. Email helper (uses Brevo's HTTP API — SMTP ports are blocked on Render's free tier) ---
def send_email(to_email: str, to_name: str, subject: str, text: str) -> bool:
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("SMTP_FROM")

    if not all([api_key, sender_email]):
        print(f"EMAIL SKIPPED: missing env vars (api_key={bool(api_key)}, sender_email={bool(sender_email)})")
        return False

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "sender": {"email": sender_email, "name": "Terra Studio"},
                "to": [{"email": to_email, "name": to_name}],
                "subject": subject,
                "textContent": text,
            },
            timeout=10,
        )
        if response.status_code in (200, 201):
            return True
        print(f"EMAIL FAILED: Brevo API returned {response.status_code}: {response.text}")
        return False
    except Exception as e:
        print(f"EMAIL FAILED: {type(e).__name__}: {e}")
        return False


def send_welcome_email(to_email: str, full_name: str) -> bool:
    return send_email(
        to_email, full_name,
        "Your online shop has been opened on Terra Studio",
        f"Hi {full_name},\n\nYour online shop has been opened on Terra Studio. "
        f"You can now be booked by customers through our platform.\n\n— Terra Studio Team"
    )


def notify_provider_of_booking(provider_email: str, provider_name: str, booking_id: int,
                                client_name: str, client_email: str, client_phone: str,
                                treatment_name: str, date: str, time_slot: str, amount: int) -> bool:
    return send_email(
        provider_email, provider_name,
        f"New booking confirmed — Booking #{booking_id}",
        f"Hi {provider_name},\n\n"
        f"You have a new confirmed and paid booking on Terra Studio.\n\n"
        f"Booking ID: {booking_id}\n"
        f"Treatment: {treatment_name}\n"
        f"Date & Time: {date} at {time_slot}\n"
        f"Amount Paid: ₦{amount:,}\n\n"
        f"Customer Details:\n"
        f"Name: {client_name}\n"
        f"Email: {client_email}\n"
        f"Phone: {client_phone}\n\n"
        f"— Terra Studio Team"
    )


# --- 4b. Payment verification (Paystack) ---
def verify_paystack_payment(reference: str, expected_amount_naira: int) -> tuple[bool, str]:
    secret_key = os.getenv("PAYSTACK_SECRET_KEY")
    if not secret_key:
        return False, "Payment system not configured (missing PAYSTACK_SECRET_KEY)"

    try:
        response = requests.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {secret_key}"},
            timeout=15,
        )
        data = response.json()
        if not data.get("status"):
            return False, data.get("message", "Verification request failed")

        tx = data["data"]
        if tx.get("status") != "success":
            return False, f"Payment not successful (status: {tx.get('status')})"

        expected_kobo = expected_amount_naira * 100
        if tx.get("amount") != expected_kobo:
            return False, "Amount paid does not match the treatment price"

        return True, "Verified"
    except Exception as e:
        print(f"PAYMENT VERIFY FAILED: {type(e).__name__}: {e}")
        return False, "Could not reach payment verification service"
# --- 5. API Endpoints ---
@app.post("/api/bookings", response_model=BookingConfirmation, status_code=201)
def reserve_appointment(payload: BookingPayload):
    verified, message = verify_paystack_payment(payload.payment_reference, payload.treatment.price)
    if not verified:
        raise HTTPException(status_code=402, detail=f"Payment could not be verified: {message}")

    with get_conn() as conn:
        existing = conn.execute(
            "SELECT 1 FROM bookings WHERE date=? AND time_slot=? AND stylist=? AND stylist != 'No preference'",
            (payload.date, payload.time_slot, payload.stylist)
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Scheduling conflict. {payload.stylist} is already booked at {payload.time_slot}."
            )

        cur = conn.execute(
            """INSERT INTO bookings
               (treatment_name, stylist, date, time_slot, client_name, client_email, client_phone,
                amount, payment_reference, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (payload.treatment.name, payload.stylist, payload.date, payload.time_slot,
             payload.client_name, payload.client_email, payload.client_phone,
             payload.treatment.price, payload.payment_reference, "Confirmed & Paid")
        )
        conn.commit()
        booking_id = cur.lastrowid

        provider_row = conn.execute(
            "SELECT email FROM providers WHERE full_name = ?", (payload.stylist,)
        ).fetchone()

    if provider_row and provider_row["email"]:
        notify_provider_of_booking(
            provider_row["email"], payload.stylist, booking_id,
            payload.client_name, payload.client_email, payload.client_phone,
            payload.treatment.name, payload.date, payload.time_slot, payload.treatment.price
        )
    else:
        print(f"PROVIDER EMAIL SKIPPED: no matching provider record for stylist '{payload.stylist}'")

    return {
        "booking_id": booking_id,
        "treatment_name": payload.treatment.name,
        "stylist": payload.stylist,
        "date": payload.date,
        "time_slot": payload.time_slot,
        "status": "Confirmed & Paid",
        "payment_status": "Paid"
    }

@app.get("/api/bookings", response_model=List[BookingConfirmation])
def view_all_bookings():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM bookings").fetchall()
        results = []
        for r in rows:
            d = dict(r)
            d["payment_status"] = "Paid" if d.get("payment_reference") else "Unpaid"
            results.append(d)
        return results

@app.post("/api/providers", response_model=ProviderRecord, status_code=201)
def register_provider(payload: ProviderPayload):
    with get_conn() as conn:
        cur = conn.execute(
            """INSERT INTO providers
               (full_name, state, lga, city, address, latitude, longitude, salon_skill, email, phone, passport_photo, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (payload.full_name, payload.state, payload.lga, payload.city,
             payload.address, payload.latitude, payload.longitude,
             payload.salon_skill, payload.email, payload.phone,
             payload.passport_photo, "Active")
        )
        conn.commit()
        provider_id = cur.lastrowid

    email_sent = send_welcome_email(payload.email, payload.full_name)

    return {
        "provider_id": provider_id,
        "full_name": payload.full_name,
        "state": payload.state,
        "lga": payload.lga,
        "city": payload.city,
        "address": payload.address,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "salon_skill": payload.salon_skill,
        "email": payload.email,
        "phone": payload.phone,
        "passport_photo": payload.passport_photo,
        "status": "Active" if email_sent else "Active (email not sent — SMTP not configured)"
    }

@app.get("/api/providers", response_model=List[ProviderRecord])
def list_providers():
    with get_conn() as conn:
        rows = conn.execute(
            """SELECT provider_id, full_name, state, lga, city, address, latitude, longitude,
                      salon_skill, email, phone, passport_photo, status FROM providers"""
        ).fetchall()
        return [dict(r) for r in rows]
    
# --- 6. Launch the server when running `python app.py` directly ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)