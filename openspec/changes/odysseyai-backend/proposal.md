## Why

The OdysseyAI frontend exists but has no backend — all data is mocked and the LAUNCH AGENT button does nothing. This change introduces the complete Python backend: a LangGraph ReAct agent that autonomously controls a real Chrome browser via Playwright MCP to complete IRCTC train bookings end-to-end, surfacing real-time progress to the dashboard via SSE and delivering the payment URL by email.

## What Changes

- **New** `backend/` Python package (FastAPI + LangGraph + SQLite) — greenfield, nothing reused
- **New** LangGraph `StateGraph` ReAct agent using Gemini 2.5 Flash as the LLM and the Microsoft Playwright MCP server (`@playwright/mcp@latest`) as browser tools
- **New** REST API replacing all UI mock data:
  - `POST /api/jobs` — create and launch a booking job in an asyncio background task
  - `GET /api/jobs` — list all jobs (populates History screen)
  - `GET /api/jobs/{id}` — job detail + log replay
  - `POST /api/jobs/{id}/otp` — submit OTP to resume a paused agent graph
  - `GET /api/jobs/{id}/logs/stream` — SSE stream of real-time agent log events
  - `GET /api/stats` — dashboard aggregate stats
  - `GET|PUT /api/settings` — IRCTC credentials + notification prefs (password never returned)
- **New** SQLite database (aiosqlite) with tables: `jobs`, `job_logs`, `passengers`, `settings`
- **New** Gmail SMTP mailer triggered once when the agent captures the payment URL
- **New** `.env` config loaded via pydantic-settings; `.env.example` committed; `.env` gitignored

## Capabilities

### New Capabilities

- `booking-agent`: LangGraph ReAct agent that autonomously completes IRCTC bookings — browser control via Playwright MCP, CAPTCHA reading via LLM vision, OTP pause/resume via LangGraph interrupt, payment URL extraction via custom tool
- `job-api`: FastAPI REST endpoints for creating, listing, and inspecting booking jobs; OTP submission endpoint that resumes an interrupted agent thread
- `sse-streaming`: Server-Sent Events endpoint draining per-job asyncio queues; log events simultaneously written to `job_logs` for history replay
- `job-persistence`: SQLite schema and aiosqlite CRUD helpers; `jobs`, `job_logs`, `passengers`, `settings` tables; schema applied via FastAPI lifespan on startup
- `email-notification`: Gmail SMTP SSL mailer sending an HTML confirmation email with payment CTA button, triggered only by the `save_payment_url` agent tool
- `settings-api`: Read/write IRCTC username, notification preferences, and master passenger list; password accepted on write but never returned on read

### Modified Capabilities

_(none — backend is greenfield; no existing spec-level behavior changes)_

## Impact

- New top-level `backend/` directory; `ui/` is read-only
- New `requirements.txt` and `.env.example` at repo root of `backend/`
- `ui/src/components/` will need its mock data replaced with real fetch calls once this backend is running — that wiring is a separate follow-on change
- Requires Node.js (`npx`) installed on the host for `@playwright/mcp@latest`
- Requires a Google AI Studio API key (free) and a Gmail App Password
