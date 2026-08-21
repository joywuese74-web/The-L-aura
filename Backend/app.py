from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List

app = FastAPI(title="Terra Studio Live API Engine")

# CORS middleware enables your browser-based React code to make requests smoothly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RECONCILED DATA SCHEMAS ---
class TreatmentItem(BaseModel):
    id: str
    name: str
    time: str
    price: int

class BookingPayload(BaseModel):
    treatment: TreatmentItem
    stylist: str
    date: str          # Format: YYYY-MM-DD
    time_slot: str     # Format: "10:30 AM"
    client_name: str
    client_email: EmailStr
    client_phone: str

class BookingConfirmation(BaseModel):
    booking_id: int
    treatment_name: str
    stylist: str
    date: str
    time_slot: str
    status: str

# Local ephemeral operational data tracking memory array
BOOKINGS_STORAGE = []
ID_GENERATOR = 1001

@app.get("/")
def health_check():
    return {"status": "Terra Studio engine is fully active and listening."}

@app.post("/api/bookings", response_model=BookingConfirmation, status_code=201)
def reserve_appointment(payload: BookingPayload):
    global ID_GENERATOR
    
    # Validation loop check: Ensure no duplicate times with the same stylist on a single date
    for booking in BOOKINGS_STORAGE:
        if (booking["date"] == payload.date and 
            booking["time_slot"] == payload.time_slot and 
            booking["stylist"] == payload.stylist and 
            payload.stylist != "No preference"):
            raise HTTPException(
                status_code=400, 
                detail=f"Scheduling conflict. {payload.stylist} is already booked at {payload.time_slot}."
            )
            
    # Process confirmation record
    confirmed_record = {
        "booking_id": ID_GENERATOR,
        "treatment_name": payload.treatment.name,
        "stylist": payload.stylist,
        "date": payload.date,
        "time_slot": payload.time_slot,
        "status": "Confirmed & Saved"
    }
    
    BOOKINGS_STORAGE.append(confirmed_record)
    ID_GENERATOR += 1
    return confirmed_record

@app.get("/api/bookings", response_model=List[BookingConfirmation])
def view_all_bookings():
    return BOOKINGS_STORAGE
