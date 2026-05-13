## Context

The OdysseyAI frontend is a React + Vite SPA (`ui/`) whose components currently render hardcoded mock data. The backend is greenfield — no prior implementation exists. The product goal is autonomous IRCTC train booking: the user submits a booking request via the UI, an AI agent controls a real browser to complete the booking, and the payment URL is delivered by email while the user watches live progress on the dashboard.

Key constraints:
- **Playwright MCP only** — no Playwright Python library; the LLM drives the browser directly via the Microsoft `@playwright/mcp@latest` stdio server
- **Single-process** — no Redis, Celery, or external queues; asyncio background tasks + asyncio.Queue for SSE
- **SQLite** — zero-setup persistence for a single-machine demo deployment
- **Gemini 2.5 Flash** — free-tier LLM with tool-calling and vision (for CAPTCHA screenshots)
- **IRCTC password is never persisted** — accepted in the booking request body, passed to the agent's initial state, discarded when the session ends

## Goals / Non-Goals

**Goals:**
- Complete `backend/` package that the existing UI can connect to without changes to its component logic (only mock data is replaced)
- LangGraph ReAct agent with a stateful Playwright MCP session that persists browser context across all tool calls in a single booking
- SSE streaming of agent log events in real time; same events written to `job_logs` for history replay
- OTP pause/resume: agent suspends via `NodeInterrupt`, FastAPI endpoint delivers OTP, graph resumes on the same thread
- Gmail SMTP email on payment URL capture
- pydantic-settings config; all secrets in `.env`

**Non-Goals:**
- Multi-user authentication or session isolation
- WebSockets (SSE is sufficient and simpler)
- Cloud deployment or containerisation
- Payment processing (agent stops at URL extraction)
- Wiring fetch calls into the React UI (follow-on change)

## Decisions

### D1: LangGraph SqliteSaver as checkpointer
**Decision**: Use `SqliteSaver` (from `langgraph.checkpoint.sqlite.aio`) as the graph checkpointer, sharing the same SQLite file as `db.py`.  
**Why**: OTP interrupts (`NodeInterrupt`) require the interrupted graph thread to be serialisable and restorable across async await boundaries. `MemorySaver` would lose state if the event loop ticks. `SqliteSaver` persists state between the initial `ainvoke` call and the OTP-resume `ainvoke` call.  
**Alternative considered**: `MemorySaver` — rejected because OTP submission comes via a separate HTTP request after the first `ainvoke` has returned.

### D2: stateful `client.session()` — NOT `client.get_tools()`
**Decision**: Wrap the entire agent run inside `async with client.session("playwright") as session` and load tools once at session open.  
**Why**: Playwright MCP is stateful — the browser tab, cookies, and DOM live inside the MCP process started for that session. `get_tools()` opens a new session per call, closing the browser between every tool invocation, making multi-step navigation impossible.  
**Alternative considered**: `get_tools()` at startup once and reuse — rejected because it creates a single shared browser across concurrent jobs.

### D3: Per-job asyncio.Queue for SSE
**Decision**: A global `SSE_QUEUES: dict[str, asyncio.Queue]` registry. Job startup creates a queue; the SSE endpoint drains it; agent tools `put_nowait` into it. The queue is dropped when the SSE connection closes or the job finishes.  
**Why**: Keeps the agent and the HTTP layer fully decoupled. The agent doesn't import FastAPI; it only imports the queue registry.  
**Alternative considered**: Pushing SSE events via a direct response callback passed into the agent — rejected as it couples agent code to FastAPI's response protocol.

### D4: asyncio background task (not a thread pool)
**Decision**: `POST /api/jobs` launches the agent as `asyncio.create_task(run_booking_agent(...))`. The endpoint returns immediately with the job ID.  
**Why**: The entire stack (FastAPI, LangGraph, aiosqlite, Playwright MCP via stdio) is async-native. A background task avoids thread-safety issues.  
**Alternative considered**: `loop.run_in_executor` with a thread — unnecessary overhead given async-native stack.

### D5: `job_id` = LangGraph `thread_id`
**Decision**: The UUID generated for the job row in `jobs` is also passed as `{"configurable": {"thread_id": job_id}}` to LangGraph.  
**Why**: Allows `POST /api/jobs/{id}/otp` to resume the exact interrupted graph thread by calling `graph.ainvoke(otp_state, config={"configurable": {"thread_id": job_id}})`.

### D6: IRCTC password policy
**Decision**: `POST /api/jobs` accepts `irctc_password` in the request body. It is placed in `BookingAgentState` as a plain field (passed to the LLM only in the initial `HumanMessage`). It is never written to any DB column or log. `GET /api/settings` always returns `""` for any password field.  
**Why**: Regulatory and security baseline — passwords must not be persisted at rest.

## Risks / Trade-offs

- [CAPTCHA changes on IRCTC] → Gemini vision reads the screenshot; prompt instructs retry up to 3 times before emitting ERROR and stopping. No further mitigation possible without a dedicated OCR service.
- [Playwright MCP API drift] → Locked to `@playwright/mcp@latest`; pin to a specific version in the startup docs once stable.
- [SQLite write contention under concurrent jobs] → SQLite WAL mode (`PRAGMA journal_mode=WAL`) enabled on first connection; acceptable for single-machine demo with low concurrency.
- [LangGraph interrupt state size] → Full message history is checkpointed per step; for long bookings this grows. Acceptable at demo scale; production would need message trimming.
- [OTP timeout] → No automatic timeout on OTP wait. If the user never submits, the graph thread stays suspended in SQLite indefinitely. A periodic cleanup job is a follow-on concern.
- [SSE connection drop before job completes] → Queue is dropped when the client disconnects; log events continue to be written to `job_logs` so the History panel can replay them.

## Migration Plan

1. Create `backend/` directory with all files
2. `pip install -r backend/requirements.txt`
3. Copy `.env.example` → `.env`, fill in `GOOGLE_API_KEY`, `SMTP_EMAIL`, `SMTP_APP_PASSWORD`, `SECRET_KEY`
4. `cd backend && uvicorn main:app --reload --port 8000`
5. Start the UI dev server (`cd ui && npm run dev`) — it will proxy API calls to port 8000 once fetch calls are wired
6. Rollback: stop `uvicorn`; the SQLite file is the only persistent artefact — delete `backend/odysseyai.db` to reset
