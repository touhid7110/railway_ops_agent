## 1. Project Scaffold

- [x] 1.1 Create `backend/` directory and all subdirectory structure: `backend/agent/`
- [x] 1.2 Create `backend/requirements.txt` with: `fastapi`, `uvicorn[standard]`, `aiosqlite`, `pydantic-settings`, `langchain-google-genai`, `langgraph`, `langchain-mcp-adapters`, `langchain-core`
- [x] 1.3 Create `.env.example` with empty values for `GOOGLE_API_KEY`, `SMTP_EMAIL`, `SMTP_APP_PASSWORD`, `SECRET_KEY`, `ENVIRONMENT`
- [x] 1.4 Create `backend/.gitignore` ensuring `.env` and `*.db` are excluded

## 2. Config (config.py)

- [x] 2.1 Create `backend/config.py` using `pydantic-settings` `BaseSettings`; load `GOOGLE_API_KEY`, `SMTP_EMAIL`, `SMTP_APP_PASSWORD`, `SECRET_KEY`, `ENVIRONMENT` from `.env`; expose a `get_settings()` cached function

## 3. Database (db.py)

- [x] 3.1 Create `backend/db.py` with `init_db()` async function that opens the SQLite connection, sets `PRAGMA journal_mode=WAL`, and runs `CREATE TABLE IF NOT EXISTS` for `jobs`, `job_logs`, `passengers`, `settings`
- [x] 3.2 Implement `jobs` table schema: `id TEXT PK`, `status TEXT DEFAULT 'queued'`, `source`, `destination`, `date`, `travel_class`, `booking_type`, `notify_email`, `payment_url TEXT`, `error_message TEXT`, `steps_total INT DEFAULT 9`, `steps_done INT DEFAULT 0`, `created_at TEXT`, `completed_at TEXT` (no password column)
- [x] 3.3 Implement `job_logs` table: `id INTEGER PK AUTOINCREMENT`, `job_id TEXT`, `tag TEXT`, `message TEXT`, `ts TEXT`
- [x] 3.4 Implement `passengers` table: `id INTEGER PK AUTOINCREMENT`, `name TEXT`, `age INTEGER`, `id_type TEXT`, `id_number TEXT`
- [x] 3.5 Implement `settings` table: `key TEXT PK`, `value TEXT`
- [x] 3.6 Add async CRUD helpers: `create_job`, `update_job_status`, `insert_log`, `get_job`, `list_jobs`, `upsert_setting`, `get_settings_map`, `list_passengers`, `insert_passenger`, `delete_passenger`

## 4. Pydantic Models (models.py)

- [x] 4.1 Create `backend/models.py` with `PassengerIn` (name, age, id_type, id_number), `BookingRequest` (source, destination, date, travel_class, booking_type, passengers: list[PassengerIn], contact_mobile, notify_email, irctc_username, irctc_password), `JobOut` (all jobs table fields + logs list), `SSEEvent` (type, tag, message, ts, payment_url — all optional), `SettingsIn` / `SettingsOut`

## 5. SSE Queue Registry (sse.py)

- [x] 5.1 Create `backend/sse.py` with `SSE_QUEUES: dict[str, asyncio.Queue]` global, and `create_queue(job_id)`, `get_queue(job_id)`, `drop_queue(job_id)` functions

## 6. Agent State (agent/state.py)

- [x] 6.1 Create `backend/agent/state.py` with `BookingAgentState` TypedDict as specified: `messages` with `add_messages` reducer, all booking context fields, `current_step: int`, `otp: str | None`, `payment_url: str | None`, `status: Literal[...]`, `error: str | None`

## 7. Agent Prompts (agent/prompts.py)

- [x] 7.1 Create `backend/agent/prompts.py` with `SYSTEM_PROMPT` string (full 9-step IRCTC booking flow, tool usage rules, CAPTCHA retry logic, password security rule) as specified in the proposal
- [x] 7.2 Add `TASK_PROMPT_TEMPLATE` with all journey/credentials/passenger placeholders; add `format_task_prompt(state)` helper that formats the template and returns a `HumanMessage`
- [x] 7.3 Add `build_initial_messages(state)` that returns `[SystemMessage(SYSTEM_PROMPT), format_task_prompt(state)]`

## 8. Custom Agent Tools (agent/tools.py)

- [x] 8.1 Create `backend/agent/tools.py`; implement `emit_sse` as an async `@tool`: gets queue via `get_queue(job_id)`, puts `{"type": "log", "tag": tag, "message": message, "ts": ...}` onto it, writes to `job_logs` via `insert_log`; wraps everything in try/except and silently ignores errors
- [x] 8.2 Implement `signal_otp_required` as an async `@tool`: calls `emit_sse` with type=otp_required, updates job status to `"waiting_otp"` in DB, raises `NodeInterrupt("otp_required")`
- [x] 8.3 Implement `save_payment_url` as an async `@tool`: validates URL starts with `https://`, writes to `jobs.payment_url`, calls `mailer.send_booking_email()`, emits `{"type": "done", "payment_url": url}`, updates job status to `"success"` and sets `completed_at`

## 9. LangGraph Graph (agent/graph.py)

- [x] 9.1 Create `backend/agent/graph.py`; define `agent_node(state, llm, tools)` that calls `llm.bind_tools(tools).ainvoke(state["messages"])` and returns `{"messages": [response]}`
- [x] 9.2 Define `tools_node` using LangGraph's `ToolNode(tools)`
- [x] 9.3 Define `otp_wait_node` that raises `NodeInterrupt("otp_required")` (the actual interrupt is raised in the tool; this node is the routing target)
- [x] 9.4 Define `route_from_agent(state)` conditional function: returns `"tools"` if last message has tool_calls for non-otp tools, `"otp_wait"` if tool call is `signal_otp_required`, `"end"` otherwise
- [x] 9.5 Build `StateGraph(BookingAgentState)`, add nodes (agent, tools, otp_wait), add edges with conditional routing from agent, compile with `SqliteSaver` checkpointer; expose as `build_booking_graph(tools, sse_queue, db_path) -> CompiledGraph`

## 10. Agent Runner (agent/runner.py)

- [x] 10.1 Create `backend/agent/runner.py`; define `MCP_CONFIG` dict for `@playwright/mcp@latest --browser=chrome --caps=vision` via stdio transport
- [x] 10.2 Implement `async def run_booking_agent(job_id, booking_input, sse_queue)`: create `MultiServerMCPClient(MCP_CONFIG)`, open `async with client.session("playwright") as session`, call `load_mcp_tools(session)`, combine with custom tools, call `build_booking_graph`, set `config = {"configurable": {"thread_id": job_id}}`, call `await graph.ainvoke(initial_state, config=config)`
- [x] 10.3 Add error handling: wrap the entire run in try/except; on exception update job status to `"failed"`, write `error_message` to DB, emit SSE `{"type": "error", "message": str(e)}`

## 11. Mailer (mailer.py)

- [x] 11.1 Create `backend/mailer.py`; implement `send_booking_email(notify_email, booking_summary, payment_url)` using `smtplib.SMTP_SSL` on port 465 with credentials from `config.get_settings()`
- [x] 11.2 Build HTML email body: journey summary table, "Complete Payment →" CTA button with `href=payment_url`, monospace URL snippet, footer text
- [x] 11.3 Wrap SMTP calls in try/except; on failure log via print (not emit_sse to avoid circular imports) and return without raising

## 12. FastAPI App (main.py)

- [x] 12.1 Create `backend/main.py`; define FastAPI app with `lifespan` context manager that calls `db.init_db()` on startup
- [x] 12.2 Add `CORSMiddleware` for `http://localhost:5173`, all methods, all headers
- [x] 12.3 Implement `POST /api/jobs`: validate body as `BookingRequest`, call `db.create_job`, call `sse.create_queue`, launch `asyncio.create_task(run_booking_agent(...))`, return `{"job_id": ..., "status": "queued"}` HTTP 201
- [x] 12.4 Implement `GET /api/jobs`: return `await db.list_jobs()` as JSON array
- [x] 12.5 Implement `GET /api/jobs/{id}`: return job + logs from `db.get_job(id)`; 404 if not found
- [x] 12.6 Implement `POST /api/jobs/{id}/otp`: check job status is `waiting_otp` (409 otherwise); inject OTP as `HumanMessage` and call `graph.ainvoke` with same thread_id to resume; return HTTP 200
- [x] 12.7 Implement `GET /api/jobs/{id}/logs/stream`: set SSE headers; drain `sse.get_queue(job_id)` via `asyncio.Queue.get()`; yield each event as `data: <json>\n\n`; close after done/error event or client disconnect; call `sse.drop_queue` on exit
- [x] 12.8 Implement `GET /api/stats`: query DB for total_bookings, successful_bookings, pending_bookings, avg_latency_ms, recent_jobs (last 4)
- [x] 12.9 Implement `GET /api/settings`: return settings map from DB; ensure password fields are empty string
- [x] 12.10 Implement `PUT /api/settings`: upsert all provided fields; accept irctc_password for storage but never return it
- [x] 12.11 Implement `GET /api/passengers`, `POST /api/passengers`, `DELETE /api/passengers/{id}`

## 13. README

- [x] 13.1 Create `backend/README.md` with prerequisites (Python 3.11+, Node.js for npx), setup steps (pip install, copy .env.example, fill keys), run instructions (`uvicorn main:app --reload --port 8000`), and a note that `npx @playwright/mcp@latest` is downloaded on first agent run
