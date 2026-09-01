import os
import sqlite3
import secrets
import requests
from datetime import datetime, timedelta
from typing import List, Optional
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
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
        conn.execute("""
            CREATE TABLE IF NOT EXISTS complaints (
                complaint_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                admin_reply TEXT,
                status TEXT NOT NULL DEFAULT 'Open',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ratings (
                rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL UNIQUE,
                provider_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                stars INTEGER NOT NULL,
                comment TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
    avg_rating: Optional[float] = None
    rating_count: int = 0

class ComplaintPayload(BaseModel):
    name: str
    email: str
    role: str  # "customer" or "provider"
    message: str

class ComplaintRecord(BaseModel):
    complaint_id: int
    name: str
    email: str
    role: str
    message: str
    admin_reply: Optional[str] = None
    status: str
    created_at: str

class ComplaintReplyPayload(BaseModel):
    reply: str

class RatingPayload(BaseModel):
    booking_id: int
    provider_name: str
    customer_email: str
    stars: int
    comment: Optional[str] = None

class RatingSummary(BaseModel):
    provider_name: str
    avg_rating: float
    rating_count: int
    comments: List[str] = []

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
# --- 4c. Admin authentication (HTTP Basic, credentials set via env vars) ---
security = HTTPBasic()

def require_admin(credentials: HTTPBasicCredentials = Depends(security)):
    correct_user = os.getenv("ADMIN_USERNAME", "")
    correct_pass = os.getenv("ADMIN_PASSWORD", "")
    valid_user = secrets.compare_digest(credentials.username, correct_user)
    valid_pass = secrets.compare_digest(credentials.password, correct_pass)
    if not (correct_user and correct_pass and valid_user and valid_pass):
        raise HTTPException(status_code=401, detail="Invalid admin credentials", headers={"WWW-Authenticate": "Basic"})
    return credentials.username


def notify_complaint_reply(to_email: str, to_name: str, original_message: str, reply: str) -> bool:
    return send_email(
        to_email, to_name,
        "L'Aura Support has responded to your message",
        f"Hi {to_name},\n\nYou reported the following:\n\"{original_message}\"\n\n"
        f"L'Aura Support's response:\n{reply}\n\n— L'Aura Support Team"
    )


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
        providers = [dict(r) for r in rows]

        for p in providers:
            stats = conn.execute(
                "SELECT AVG(stars) as avg_r, COUNT(*) as cnt FROM ratings WHERE provider_name = ?",
                (p["full_name"],)
            ).fetchone()
            p["avg_rating"] = round(stats["avg_r"], 1) if stats["avg_r"] else None
            p["rating_count"] = stats["cnt"] or 0

        return providers


# --- Complaints / Admin ---
@app.post("/api/complaints", response_model=ComplaintRecord, status_code=201)
def submit_complaint(payload: ComplaintPayload):
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO complaints (name, email, role, message, status) VALUES (?, ?, ?, ?, 'Open')",
            (payload.name, payload.email, payload.role, payload.message)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM complaints WHERE complaint_id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)

@app.get("/api/admin/complaints", response_model=List[ComplaintRecord])
def list_complaints(admin: str = Depends(require_admin)):
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM complaints ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

@app.post("/api/admin/complaints/{complaint_id}/reply", response_model=ComplaintRecord)
def reply_to_complaint(complaint_id: int, payload: ComplaintReplyPayload, admin: str = Depends(require_admin)):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM complaints WHERE complaint_id = ?", (complaint_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Complaint not found")
        conn.execute(
            "UPDATE complaints SET admin_reply = ?, status = 'Resolved' WHERE complaint_id = ?",
            (payload.reply, complaint_id)
        )
        conn.commit()
        updated = conn.execute("SELECT * FROM complaints WHERE complaint_id = ?", (complaint_id,)).fetchone()

    notify_complaint_reply(row["email"], row["name"], row["message"], payload.reply)
    return dict(updated)


# --- Ratings ---
@app.post("/api/ratings", status_code=201)
def submit_rating(payload: RatingPayload):
    if not (1 <= payload.stars <= 5):
        raise HTTPException(status_code=400, detail="Stars must be between 1 and 5")

    with get_conn() as conn:
        booking = conn.execute(
            "SELECT * FROM bookings WHERE booking_id = ?", (payload.booking_id,)
        ).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking["client_email"].lower() != payload.customer_email.lower():
            raise HTTPException(status_code=403, detail="This booking does not belong to that email address")
        if booking["stylist"] != payload.provider_name:
            raise HTTPException(status_code=400, detail="Provider name does not match this booking")

        try:
            appointment_dt = datetime.strptime(f"{booking['date']} {booking['time_slot']}", "%Y-%m-%d %I:%M %p")
        except ValueError:
            raise HTTPException(status_code=500, detail="Could not parse appointment time for eligibility check")

        if datetime.now() < appointment_dt + timedelta(hours=2):
            raise HTTPException(
                status_code=403,
                detail="You can rate this provider once your scheduled appointment time has passed by at least 2 hours."
            )

        existing = conn.execute(
            "SELECT 1 FROM ratings WHERE booking_id = ?", (payload.booking_id,)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="You have already rated this booking")

        conn.execute(
            "INSERT INTO ratings (booking_id, provider_name, customer_email, stars, comment) VALUES (?, ?, ?, ?, ?)",
            (payload.booking_id, payload.provider_name, payload.customer_email, payload.stars, payload.comment)
        )
        conn.commit()

    return {"status": "Rating submitted, thank you!"}

@app.get("/api/ratings/{provider_name}", response_model=RatingSummary)
def get_provider_ratings(provider_name: str):
    with get_conn() as conn:
        stats = conn.execute(
            "SELECT AVG(stars) as avg_r, COUNT(*) as cnt FROM ratings WHERE provider_name = ?",
            (provider_name,)
        ).fetchone()
        comments = conn.execute(
            "SELECT comment FROM ratings WHERE provider_name = ? AND comment IS NOT NULL AND comment != '' ORDER BY created_at DESC LIMIT 10",
            (provider_name,)
        ).fetchall()
        return {
            "provider_name": provider_name,
            "avg_rating": round(stats["avg_r"], 1) if stats["avg_r"] else 0,
            "rating_count": stats["cnt"] or 0,
            "comments": [c["comment"] for c in comments]
        }
    
# --- 6. Launch the server when running `python app.py` directly ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)