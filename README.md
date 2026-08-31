# Terra Studio (The L'aura)

A full-stack wellness salon booking platform connecting customers with beauty and wellness service providers — with location-based matching, real-time payments, and automated email notifications.

**Live site:** https://joywuese74-web.github.io/The-L-aura/
**API:** https://the-l-aura.onrender.com/docs

---

## What it does

**For customers**
- Browse services (skincare, hair, massage, and more) with pricing
- Book an appointment with a specific provider, or "no preference"
- Providers are automatically sorted by distance from the customer's current location
- Pay securely online via Paystack (card, bank transfer, USSD)
- Receive instant booking confirmation

**For service providers**
- Register a shop with photo, address, and skill category
- Get discovered by nearby customers first
- Receive an email when a customer registers, and again when a booking is confirmed and paid — including the customer's name, phone, and email

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | SQLite |
| Payments | Paystack |
| Transactional email | Brevo (via HTTP API) |
| Frontend hosting | GitHub Pages (auto-deployed via GitHub Actions) |
| Backend hosting | Render |

---

## Project structure

```
The-L-aura/
├── Backend/
│   ├── app.py              # FastAPI app: bookings, providers, payments, email
│   ├── requirements.txt
│   └── runtime.txt         # pins Python version for Render
├── Frontend/
│   ├── src/
│   │   ├── App.jsx         # main application UI and logic
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── .github/workflows/
    └── deploy.yml          # builds and deploys Frontend to GitHub Pages on push
```

---

## Running locally

### Backend

```bash
cd Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Runs at `http://127.0.0.1:8000`. Interactive API docs at `/docs`.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

---

## Environment variables

### Backend (set in Render → Environment)

| Variable | Purpose |
|---|---|
| `ALLOWED_ORIGINS` | Comma-separated list of frontend URLs allowed to call the API (CORS) |
| `PYTHON_VERSION` | Pins the Python version (e.g. `3.11.9`) |
| `BREVO_API_KEY` | Brevo API key for sending transactional emails |
| `SMTP_FROM` | Verified sender email address for outgoing mail |
| `PAYSTACK_SECRET_KEY` | Paystack secret key, used to verify payments server-side |

### Frontend (`Frontend/.env`, or set in code)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL (defaults to the live Render URL if unset) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key used to open the checkout popup |

---

## Deployment

- **Frontend** deploys automatically to GitHub Pages whenever changes are pushed to `main` (see `.github/workflows/deploy.yml`).
- **Backend** deploys automatically on Render whenever changes are pushed to `main`.
- The database is SQLite on Render's ephemeral filesystem — data resets on every redeploy. For persistent data, migrate to Render's managed Postgres.

---

## Payments

Bookings require a successful, **server-verified** Paystack payment before being saved. The backend calls Paystack's `/transaction/verify/:reference` endpoint and confirms the amount paid matches the treatment price before writing anything to the database — the frontend is never trusted on its own.

Currently running with **test keys**. Switching to live payments requires completing Paystack's compliance/KYC process and swapping in live API keys.
