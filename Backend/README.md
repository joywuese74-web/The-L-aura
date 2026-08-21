# The L'aura (Terra Studio)

Wellness salon booking site — React/Vite frontend, FastAPI backend.

## Backend

    cd Backend
    python -m venv venv && source venv/bin/activate
    pip install -r requirements.txt
    uvicorn app:app --reload --port 8000

## Frontend

    cd Frontend
    cp .env.example .env   # set VITE_API_URL if backend isn't on 127.0.0.1:8000
    npm install
    npm run dev

Frontend runs on http://localhost:5173, backend on http://127.0.0.1:8000.