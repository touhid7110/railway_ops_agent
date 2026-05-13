Build a completely autonomous IRCTC booking backend for OdysseyAI. The frontend already
exists in ui/. This is a greenfield backend — nothing from any previous backend attempt
is being reused.

---

## WHAT THIS IS

A LangGraph ReAct agent that autonomously controls a real headed Chrome browser via the
Playwright MCP server to complete an IRCTC train booking end-to-end. The agent receives
a booking task, reasons about what to do next, selects the right Playwright tool, acts
on the browser, observes the result, and loops — until the payment URL is extracted and
emailed to the user.

The LLM is Google Gemini 2.5 Flash. The browser tools come from the official Microsoft
Playwright MCP server (@playwright/mcp@latest), exposed to the agent at runtime via
langchain-mcp-adapters. The agent loop is a LangGraph StateGraph with a persistent
stateful MCP session so the browser context — cookies, login state, page DOM — survives
across every tool call in the session.

---

## ARCHITECTURE OVERVIEW

```
FastAPI (main.py)
  └── POST /api/jobs  ──► asyncio background task
                              └── MCP session context manager (stateful)
                                    └── Playwright MCP server (npx @playwright/mcp@latest --browser=chrome)
                                          └── LangGraph ReAct agent
                                                ├── LLM: gemini-2.5-flash (via langchain-google-genai)
                                                ├── Tools: all Playwright MCP tools loaded from session
                                                └── State: BookingAgentState (TypedDict)
```

All SSE log events are pushed from inside the agent's node callbacks via an asyncio.Queue
that the FastAPI SSE endpoint drains.

---

## TECH STACK — NON-NEGOTIABLE

| Component            | Choice                                  | Why |
|----------------------|-----------------------------------------|-----|
| Agent framework      | LangGraph (StateGraph + ReAct)          | Stateful loops, conditional edges, interrupt support |
| LLM                  | gemini-2.5-flash via langchain-google-genai | Free tier, fast, tool-calling capable |
| Browser tools        | @playwright/mcp@latest (Microsoft)      | Accessibility-tree-based, no vision model needed |
| MCP ↔ LangGraph      | langchain-mcp-adapters MultiServerMCPClient stateful session | Persistent browser context across tool calls |
| Browser              | Headed Chrome (--browser=chrome)        | Visible for demo; cookie persistence |
| Backend API          | FastAPI + uvicorn                       | Async, SSE streaming, lightweight |
| Database             | SQLite via aiosqlite                    | Zero-setup, persists job history |
| Email                | smtplib SMTP SSL port 465               | Gmail App Password |
| Config               | pydantic-settings from .env             | |

---

## PROJECT STRUCTURE TO CREATE

```
├── backend/
│   ├── main.py                  # FastAPI app + SSE endpoint + job router
│   ├── db.py                    # aiosqlite schema + CRUD helpers
│   ├── models.py                # Pydantic models (BookingRequest, Job, SSEEvent)
│   ├── config.py                # pydantic-settings (.env loader)
│   ├── mailer.py                # smtplib HTML email sender
│   ├── sse.py                   # SSE queue registry (job_id → asyncio.Queue)
│   └── agent/
│       ├── graph.py             # LangGraph StateGraph definition (THE CORE)
│       ├── state.py             # BookingAgentState TypedDict
│       ├── prompts.py           # All system prompts and task prompts
│       ├── nodes.py             # LangGraph node functions
│       ├── tools.py             # Custom @tool wrappers (OTP wait, emit SSE, save result)
│       └── runner.py            # Entry point: builds MCP session → runs graph → cleans up
├── .env
├── .env.example
├── requirements.txt
└── ui/                          # Already exists. Read it. Do not touch it.
```

---

## SECTION 1 — READ THE UI BEFORE WRITING ANYTHING

Before generating a single file, read every file under ui/src/. Extract:
- All fetch/API calls: URL, method, request body shape, expected response shape
- All TypeScript types and interfaces in ui/src/types/
- SSE event types consumed in ui/src/hooks/useSSE.ts
- Status string literals used in StatusPill (success, running, waiting_otp, failed, cancelled)
- All form fields in BookingForm, PassengerInlineForm, Settings

The backend API contract is derived entirely from what the UI already expects.
Do not invent new field names or response shapes.

---

## SECTION 2 — LANGGRAPH AGENT (graph.py) — MOST IMPORTANT FILE

### 2.1 State definition (state.py)

```python
from typing import TypedDict, Annotated, Literal
from langgraph.graph.message import add_messages

class BookingAgentState(TypedDict):
    # LangGraph message history (required for ReAct)
    messages: Annotated[list, add_messages]

    # Booking context — injected once at graph entry, never modified
    job_id: str
    source: str
    destination: str
    date: str
    travel_class: str
    booking_type: str
    passengers: list[dict]       # [{name, age, id_type, id_number}]
    contact_mobile: str
    notify_email: str
    irctc_username: str
    irctc_password: str          # never logged, never persisted

    # Mutable agent state
    current_step: int            # 1–9, incremented by the agent
    otp: str | None              # populated when user submits OTP via API
    payment_url: str | None      # populated when agent reaches payment page
    status: Literal["running", "waiting_otp", "success", "failed"]
    error: str | None
```

### 2.2 Graph structure (graph.py)

Build a StateGraph with these nodes and edges:

```
START
  └─► agent_node          # LLM reasons, selects Playwright tool, or calls custom tool
        ├─► tools_node     # ToolNode executes Playwright MCP tool or custom tool
        │     └─► agent_node  (loop back)
        ├─► otp_wait_node  # suspends graph until OTP submitted (LangGraph interrupt)
        │     └─► agent_node  (resume after OTP)
        └─► END            # when agent emits final_answer with payment_url or error
```

**agent_node**: Calls `llm.bind_tools(tools).ainvoke(state["messages"])`. Returns updated messages.

**tools_node**: Standard LangGraph `ToolNode(tools)`. Executes whatever tool the LLM called. All Playwright MCP tools + custom tools are in the same `tools` list.

**otp_wait_node**: Uses `NodeInterrupt` to pause the graph. The FastAPI `POST /api/jobs/{id}/otp` endpoint writes the OTP to the state store, then resumes the graph thread.

**Conditional edge from agent_node**:
- If last message is `AIMessage` with `tool_calls` → go to `tools_node`
- If last message contains `tool_calls` for `wait_for_otp` → go to `otp_wait_node`
- If last message is `AIMessage` with no `tool_calls` (final answer) → go to `END`

Use `SqliteSaver` as the LangGraph checkpointer so interrupted graph state (OTP wait) is
persisted and can be resumed across async calls.

### 2.3 MCP session management (runner.py)

**CRITICAL**: Playwright MCP is stateful — the browser tab, cookies, and DOM persist only
within a single MCP session. Use the stateful `client.session()` context manager pattern,
NOT `client.get_tools()` which creates a fresh session per call.

```python
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools

MCP_CONFIG = {
    "playwright": {
        "command": "npx",
        "args": [
            "@playwright/mcp@latest",
            "--browser=chrome",     # headed real Chrome
            "--caps=vision",        # enable vision mode for CAPTCHA screenshots
        ],
        "transport": "stdio",
    }
}

async def run_booking_agent(job_id: str, booking_input: dict, sse_queue: asyncio.Queue):
    client = MultiServerMCPClient(MCP_CONFIG)

    async with client.session("playwright") as session:
        # Load all Playwright MCP tools from the persistent session
        playwright_tools = await load_mcp_tools(session)

        # Add custom tools (OTP wait signal, SSE emit, save payment URL)
        from agent.tools import emit_sse, save_payment_url, signal_otp_required
        all_tools = playwright_tools + [emit_sse, signal_otp_required, save_payment_url]

        # Build and run the graph within this session scope
        graph = build_booking_graph(all_tools, sse_queue)
        config = {"configurable": {"thread_id": job_id}}

        initial_state = build_initial_state(job_id, booking_input)
        await graph.ainvoke(initial_state, config=config)
    # Session closes here → browser closes
```

---

## SECTION 3 — CUSTOM TOOLS (tools.py)

These three tools are NOT from Playwright MCP. They are `@tool` decorated Python async
functions that the LLM can call alongside Playwright tools.

**emit_sse(tag: str, message: str)**
```
Emits a log line to the user's live dashboard.
Call this tool after completing each major step so the user can see progress.
tag must be one of: NAV, AUTH, FORM, INFO, ERROR
```
Implementation: puts `{"type": "log", "tag": tag, "message": message}` on the job's
asyncio.Queue. Never raises — if queue is gone, silently ignore.

**signal_otp_required(reason: str)**
```
Call this tool when IRCTC shows an OTP input screen.
This pauses the booking and notifies the user to enter their OTP in the dashboard.
Only call it once per OTP screen. Wait — the graph will resume automatically when the
user submits their OTP.
```
Implementation: emits `{"type": "otp_required", "message": reason}` to SSE queue, then
raises `NodeInterrupt("otp_required")` to pause the LangGraph thread.

**save_payment_url(url: str)**
```
Call this tool exactly once when you have successfully reached the payment gateway page
and confirmed the URL contains a payment domain.
url must start with https:// 
This tool saves the URL, sends the confirmation email, and marks the booking as complete.
```
Implementation: validates URL, writes to DB, calls `mailer.send_booking_email()`,
emits `{"type": "done", "payment_url": url}` to SSE queue.

---

## SECTION 4 — SYSTEM PROMPT (prompts.py)

This is the most important section. The system prompt defines the agent's persona,
decision-making process, and critical rules. Get this right.

```
SYSTEM_PROMPT = """
You are OdysseyAI, an autonomous AI booking agent. Your job is to complete an IRCTC train
ticket booking from start to finish using the browser tools available to you.

You control a real Chrome browser. Use the browser tools to navigate IRCTC, log in,
search for trains, fill passenger details, and reach the payment gateway.

## YOUR TOOLS
You have access to:
1. Playwright browser tools — use these to control the browser (navigate, click, type,
   take screenshots, read page snapshots)
2. emit_sse — use this to send progress updates to the user after each major action
3. signal_otp_required — use this ONLY when you see an OTP input screen
4. save_payment_url — use this ONLY when you have reached the payment gateway page

## HOW TO READ A PAGE
When you need to understand what's on screen, call browser_snapshot first.
The snapshot returns the accessibility tree — a structured list of every interactive
element with a ref ID. Use ref IDs (like e5, e12) to click and type, not CSS selectors.
If an element is not in the snapshot, use browser_take_screenshot and look at the image.

## BOOKING FLOW — FOLLOW THIS EXACTLY

Step 1: Navigate to https://www.irctc.co.in/nget/train-search
  → emit_sse(tag="NAV", message="Navigating to IRCTC")

Step 2: Find and click the LOGIN button. Fill in username and password fields.
  → emit_sse(tag="AUTH", message="Entering credentials")

Step 3: Find the CAPTCHA image. Take a screenshot of just that element.
  Look carefully at the distorted characters in the screenshot.
  Type them into the CAPTCHA input field. Submit the login form.
  → emit_sse(tag="AUTH", message="Solving CAPTCHA")
  If CAPTCHA is wrong: the page will show an error. Take a new screenshot and try again.
  Retry up to 3 times before calling emit_sse with tag=ERROR and stopping.

Step 4: Check if the page now shows an OTP input screen.
  If yes: call signal_otp_required("Enter the OTP sent to your IRCTC-registered mobile")
  The graph will pause. When it resumes, the OTP will be in your next message as a
  HumanMessage. Type it into the OTP field and submit.
  → emit_sse(tag="AUTH", message="Login successful")

Step 5: Navigate to the train search. Fill in From station, To station, Date, Class.
  Click the Search button.
  → emit_sse(tag="NAV", message="Searching trains: {source} → {destination} on {date}")

Step 6: The results page shows a list of trains. Find one that has availability in
  {travel_class} class. Click Book Now for that train.
  → emit_sse(tag="FORM", message="Selected train: [train name] — [departure time]")

Step 7: The passenger form appears. Fill in each passenger's details:
  Name, Age, ID Type (from dropdown), ID Number.
  Fill the contact mobile number. Select berth preference if shown.
  → emit_sse(tag="FORM", message="Filled passenger details for [N] passenger(s)")

Step 8: Review the booking summary. Click the Proceed to Pay / Continue button.
  → emit_sse(tag="NAV", message="Proceeding to payment gateway")

Step 9: You are now on or being redirected to the payment gateway.
  Read the current page URL using browser_evaluate with script: "window.location.href" and
  call save_payment_url(url) immediately.
  If the page is still on IRCTC, wait 2 seconds and check again. Retry up to 3 times.
  → save_payment_url triggers the email and marks the job done.

## CRITICAL RULES
- NEVER proceed to pay. Your job ends the moment you have the payment URL.
- NEVER store, log, or repeat the IRCTC password in any tool call or message.
- If you are unsure what element to click, take a screenshot first.
- If a page load takes too long, call browser_wait_for_load_state before proceeding.
- If you encounter an unexpected error or block (CAPTCHA failure after 3 retries,
  train not available, session timeout), call emit_sse with tag=ERROR and a clear
  description, then stop. Do not hallucinate success.
- After every browser action that changes the page, call browser_snapshot to confirm
  what is now visible before deciding the next action.
- One tool call at a time. Think, then act, then observe, then think again.

## PASSENGER DATA
The passengers you must book for are provided in your first HumanMessage.
Use exactly the names, ages, ID types, and ID numbers provided. Do not invent data.

## OUTPUT FORMAT
You do not need to produce a final text answer. The job is complete when you call
save_payment_url. If you cannot complete the booking, call emit_sse with tag=ERROR
explaining why, then stop.
"""
```

### Task prompt injected as the first HumanMessage:

```python
TASK_PROMPT_TEMPLATE = """
Complete an IRCTC train booking with the following details:

JOURNEY:
  From: {source}
  To: {destination}
  Date: {date}
  Class: {travel_class}
  Booking type: {booking_type}

IRCTC CREDENTIALS:
  Username: {irctc_username}
  Password: {irctc_password}

PASSENGERS:
{passengers_block}

CONTACT MOBILE: {contact_mobile}

Begin now. Navigate to IRCTC and complete the booking.
"""
```

Format `passengers_block` as a numbered list: `1. Name: X, Age: Y, ID Type: Z, ID No: W`

---

## SECTION 5 — FASTAPI BACKEND (main.py)

### Endpoints (derive exact request/response shapes from what ui/ expects)


### SSE queue registry (sse.py)

```python
# Global registry: job_id → asyncio.Queue
SSE_QUEUES: dict[str, asyncio.Queue] = {}

def create_queue(job_id: str) -> asyncio.Queue:
    q = asyncio.Queue()
    SSE_QUEUES[job_id] = q
    return q

def get_queue(job_id: str) -> asyncio.Queue | None:
    return SSE_QUEUES.get(job_id)

def drop_queue(job_id: str):
    SSE_QUEUES.pop(job_id, None)
```

### CORS
Allow http://localhost:5173 in development. Use CORSMiddleware.

### Credentials policy
Never persist irctc_password. Accept in BookingRequest, pass to agent runner, discard.
GET /api/settings must always return empty string for any password field.

---

## SECTION 6 — DATABASE SCHEMA (db.py)

Run CREATE TABLE IF NOT EXISTS on startup via FastAPI lifespan.

**jobs**: id TEXT PK, status TEXT DEFAULT 'queued', source, destination, date,
travel_class, booking_type, notify_email, payment_url TEXT, error_message TEXT,
steps_total INT DEFAULT 9, steps_done INT DEFAULT 0, created_at TEXT, completed_at TEXT

**job_logs**: id INTEGER PK AUTOINCREMENT, job_id TEXT FK, tag TEXT, message TEXT, ts TEXT

**passengers**: id INTEGER PK AUTOINCREMENT, name, age INT, id_type, id_number

**settings**: key TEXT PK, value TEXT

Every SSE log event must also be written to job_logs so the History detail panel can
show the full log for past completed jobs.

---

## SECTION 7 — MAILER (mailer.py)

Gmail SMTP SSL on port 465. Use smtplib.SMTP_SSL. Send an HTML email with:
- Journey summary table (train, from, to, date, class, passengers)
- A large CTA button "Complete Payment →" linking to the payment URL
- Monospace truncated URL below the button
- Footer: "Sent by OdysseyAI Agent. Complete payment before your IRCTC session expires."

Triggered by save_payment_url tool only — never called directly from the API.

---

## SECTION 8 — CONFIG (.env and config.py)

Required env vars (create .env.example with empty values, never commit .env):
```
GOOGLE_API_KEY=         # from aistudio.google.com — free
SMTP_EMAIL=             # your Gmail address
SMTP_APP_PASSWORD=      # Gmail App Password (not main password)
SECRET_KEY=             # random 32-char string
ENVIRONMENT=development
```

Load via pydantic-settings BaseSettings in config.py. Never access os.environ directly
elsewhere.

---

## SECTION 9 — REQUIREMENTS.TXT

```
fastapi
uvicorn[standard]
aiosqlite
pydantic-settings
langchain-google-genai
langgraph
langchain-mcp-adapters
langchain-core
```

Node.js must be installed for `npx @playwright/mcp@latest` to work. Document this in
README.md.

---

## SECTION 10 — STARTUP INSTRUCTIONS (generate in README.md)


---

## ERROR PREVENTION RULES — VERIFY BEFORE EACH FILE IS MARKED DONE

**Agent / graph:**
- [ ] MCP session is opened with client.session("playwright"), NOT client.get_tools()
      (get_tools() creates a new session per call — the browser will close between tools)
- [ ] The graph checkpointer is SqliteSaver so OTP interrupts survive across awaits
- [ ] emit_sse tool never raises — wrap in try/except and silently ignore queue errors
- [ ] signal_otp_required raises NodeInterrupt, not a regular exception
- [ ] save_payment_url validates URL starts with https:// before writing to DB
- [ ] irctc_password is never referenced in any string that gets added to messages
      (pass it in the initial HumanMessage only, never repeat it in tool results or logs)
- [ ] The agent's system prompt is injected as SystemMessage, not HumanMessage

**FastAPI:**
- [ ] All path functions are async def
- [ ] All DB calls use await with aiosqlite
- [ ] SSE endpoint sets Content-Type: text/event-stream and Cache-Control: no-cache
- [ ] POST /api/jobs/{id}/otp resumes the LangGraph thread within the same thread_id
      used to start it (the job_id must be the thread_id)
- [ ] CORS is configured for http://localhost:5173
- [ ] GET /api/settings never returns a non-empty password field

**General:**
- [ ] npx availability is documented as a prerequisite in README.md
- [ ] .env is in .gitignore
- [ ] No hardcoded API keys anywhere in source

---

## WHAT NOT TO BUILD

- No Playwright Python library (use Playwright MCP server only)
- No manual CAPTCHA OCR pipeline (the LLM reads the screenshot directly)  
- No Redis, Celery, or external queues
- No multi-user auth
- No cloud deployment config
- No WebSocket (SSE only)
- No payment processing (agent stops at URL extraction)