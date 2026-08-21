import os
import sqlite3
from typing import List
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel  # Assuming you are using Pydantic for your models

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
# Note: Ensure you define TreatmentPayload, BookingPayload, and BookingConfirmation here
# Example placeholders:
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

# --- 4. API Endpoints ---
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
