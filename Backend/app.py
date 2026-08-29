import os
import sqlite3
import smtplib
from email.mime.text import MIMEText
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

class BookingPayload(BaseModel):
    treatment: TreatmentPayload
    stylist: str
    date: str
    time_slot: str
    client_name: str
    client_email: str
    client_phone: str

class BookingConfirmation(BaseModel):
    booking_id: int
    treatment_name: str
    stylist: str
    date: str
    time_slot: str
    status: str

class ProviderPayload(BaseModel):
    full_name: str
    state: str
    lga: str
    city: str
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
    salon_skill: str
    email: str
    phone: str
    status: str

# --- 4. Email helper (requires SMTP env vars to actually send) ---
def send_welcome_email(to_email: str, full_name: str) -> bool:
    host = os.getenv("SMTP_HOST")
    port = os.getenv("SMTP_PORT")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    sender = os.getenv("SMTP_FROM", user)

    if not all([host, port, user, password]):
        print(f"EMAIL SKIPPED: missing SMTP env vars (host={bool(host)}, port={bool(port)}, user={bool(user)}, password={bool(password)})")
        
        return False

    try:
        msg = MIMEText(
            f"Hi {full_name},\n\nYour online shop has been opened on Terra Studio. "
            f"You can now be booked by customers through our platform.\n\n— Terra Studio Team"
        )
        msg["Subject"] = "Your online shop has been opened on Terra Studio"
        msg["From"] = sender
        msg["To"] = to_email

        with smtplib.SMTP(host, int(port)) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(sender, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"EMAIL FAILED: {type(e).__name__}: {e}")
        return False

# --- 5. API Endpoints ---
@app.post("/api/bookings", response_model=BookingConfirmation, status_code=201)
def reserve_appointment(payload: BookingPayload):
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
               (treatment_name, stylist, date, time_slot, client_name, client_email, client_phone, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (payload.treatment.name, payload.stylist, payload.date, payload.time_slot,
             payload.client_name, payload.client_email, payload.client_phone, "Confirmed & Saved")
        )
        conn.commit()
        return {
            "booking_id": cur.lastrowid,
            "treatment_name": payload.treatment.name,
            "stylist": payload.stylist,
            "date": payload.date,
            "time_slot": payload.time_slot,
            "status": "Confirmed & Saved"
        }

@app.get("/api/bookings", response_model=List[BookingConfirmation])
def view_all_bookings():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM bookings").fetchall()
        return [dict(r) for r in rows]

@app.post("/api/providers", response_model=ProviderRecord, status_code=201)
def register_provider(payload: ProviderPayload):
    with get_conn() as conn:
        cur = conn.execute(
            """INSERT INTO providers
               (full_name, state, lga, city, salon_skill, email, phone, passport_photo, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (payload.full_name, payload.state, payload.lga, payload.city,
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
        "salon_skill": payload.salon_skill,
        "email": payload.email,
        "phone": payload.phone,
        "status": "Active" if email_sent else "Active (email not sent — SMTP not configured)"
    }

@app.get("/api/providers", response_model=List[ProviderRecord])
def list_providers():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT provider_id, full_name, state, lga, city, salon_skill, email, phone, status FROM providers"
        ).fetchall()
        return [dict(r) for r in rows]
    
# --- 6. Launch the server when running `python app.py` directly ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)