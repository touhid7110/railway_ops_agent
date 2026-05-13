# OdysseyAI Backend

FastAPI + LangGraph backend for autonomous IRCTC train booking.

## Prerequisites

- Python 3.11+
- Node.js 18+ (for `npx @playwright/mcp@latest`, downloaded automatically on first agent run)
- A Google AI Studio API key (free tier works)
- A Gmail account with an App Password configured

## Setup

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
```

Edit `.env` and fill in:

```
GOOGLE_API_KEY=your_google_ai_studio_key
SMTP_EMAIL=your_gmail@gmail.com
SMTP_APP_PASSWORD=your_16_char_app_password
SECRET_KEY=any_random_string
ENVIRONMENT=development
```

## Run

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API is now available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/jobs` | Create and launch a booking job |
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs/{id}` | Job detail + log replay |
| POST | `/api/jobs/{id}/otp` | Submit OTP to resume interrupted agent |
| GET | `/api/jobs/{id}/logs/stream` | SSE stream of real-time agent events |
| GET | `/api/stats` | Dashboard aggregate stats |
| GET/PUT | `/api/settings` | IRCTC credentials and notification prefs |
| GET/POST | `/api/passengers` | Master passenger list |
| DELETE | `/api/passengers/{id}` | Remove a passenger |

## Notes

- `npx @playwright/mcp@latest` is downloaded on first agent run — requires internet access
- The SQLite database (`odysseyai.db`) is created automatically in the `backend/` directory on first startup
- IRCTC passwords are never written to disk — they live only in the agent's in-memory state for the duration of a booking job
- To reset all data: `rm odysseyai.db`
