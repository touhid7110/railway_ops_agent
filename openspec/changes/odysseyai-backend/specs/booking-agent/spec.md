## ADDED Requirements

### Requirement: LangGraph ReAct agent with Playwright MCP tools
The system SHALL implement a LangGraph `StateGraph` ReAct agent that controls a real Chrome browser via the Microsoft `@playwright/mcp@latest` stdio MCP server. The LLM SHALL be `gemini-2.5-flash` via `langchain-google-genai`. The MCP session MUST be opened with `client.session("playwright")` (stateful), NOT `client.get_tools()`, so the browser tab and cookies persist across every tool call in the booking.

#### Scenario: Agent runs within a persistent MCP session
- **WHEN** a booking job is started
- **THEN** the agent opens exactly one MCP session for the entire job duration, and all Playwright tool calls share the same browser process and cookie jar

#### Scenario: Browser closes when job finishes
- **WHEN** the agent graph reaches END or an unrecoverable error
- **THEN** the MCP session context manager exits and the browser process is terminated

### Requirement: BookingAgentState TypedDict
The agent state SHALL be a `TypedDict` containing: `messages` (LangGraph message list with `add_messages` reducer), `job_id`, `source`, `destination`, `date`, `travel_class`, `booking_type`, `passengers` (list of dicts), `contact_mobile`, `notify_email`, `irctc_username`, `irctc_password`, `current_step` (int), `otp` (str or None), `payment_url` (str or None), `status` (Literal: running / waiting_otp / success / failed), `error` (str or None).

#### Scenario: irctc_password is never logged
- **WHEN** the agent emits any SSE log event or appends any tool result to messages
- **THEN** the content MUST NOT contain the literal value of `irctc_password`

### Requirement: Graph node structure
The graph SHALL contain: `agent_node` (calls `llm.bind_tools(tools).ainvoke`), `tools_node` (standard `ToolNode`), `otp_wait_node` (raises `NodeInterrupt`). A conditional edge from `agent_node` SHALL route to `tools_node` if the last message has tool calls, to `otp_wait_node` if the tool call is `signal_otp_required`, or to `END` if there are no tool calls.

#### Scenario: Conditional routing to tools
- **WHEN** the LLM returns an AIMessage with one or more tool_calls
- **THEN** the graph routes to tools_node, executes the tool, and loops back to agent_node

#### Scenario: Conditional routing to END
- **WHEN** the LLM returns an AIMessage with no tool_calls
- **THEN** the graph routes to END and the job is considered complete

### Requirement: SqliteSaver checkpointer for OTP resume
The graph MUST use `SqliteSaver` (aiosqlite-backed) as its checkpointer. The LangGraph `thread_id` in the config MUST equal the `job_id`. This allows a separate `POST /api/jobs/{id}/otp` HTTP call to resume the interrupted thread.

#### Scenario: Graph survives OTP pause across HTTP requests
- **WHEN** the agent calls `signal_otp_required` and the graph raises `NodeInterrupt`
- **THEN** the checkpointer persists the full graph state to SQLite, the `ainvoke` call returns without error, and a subsequent `ainvoke` with the same thread_id and OTP injected into messages resumes execution from the `otp_wait_node`

### Requirement: Custom tool — emit_sse
The `emit_sse(tag: str, message: str)` tool SHALL put `{"type": "log", "tag": tag, "message": message, "ts": ISO-timestamp}` onto the job's asyncio.Queue AND write the same event to the `job_logs` table. It MUST NEVER raise an exception — all errors MUST be silently swallowed.

#### Scenario: SSE event reaches the client
- **WHEN** the agent calls emit_sse with tag="NAV" and a message
- **THEN** the event appears in the SSE stream for that job within one event loop tick

### Requirement: Custom tool — signal_otp_required
The `signal_otp_required(reason: str)` tool SHALL emit an SSE event of type `"otp_required"` to the job queue and then raise `NodeInterrupt("otp_required")` to pause the LangGraph thread. It MUST be called at most once per OTP screen.

#### Scenario: Job status transitions to waiting_otp
- **WHEN** signal_otp_required is called
- **THEN** the job's status in the `jobs` table is updated to `"waiting_otp"` and the SSE stream emits `{"type": "otp_required"}`

### Requirement: Custom tool — save_payment_url
The `save_payment_url(url: str)` tool SHALL validate that `url` starts with `https://`, write it to the `jobs` table `payment_url` column, trigger `mailer.send_booking_email()`, emit `{"type": "done", "payment_url": url}` to the SSE queue, and update job status to `"success"`.

#### Scenario: Payment URL is saved and email sent
- **WHEN** the agent calls save_payment_url with a valid https:// URL
- **THEN** the URL is persisted to the jobs table, a confirmation email is sent, and the SSE stream emits a done event

#### Scenario: Invalid URL is rejected
- **WHEN** the agent calls save_payment_url with a URL that does not start with https://
- **THEN** the tool raises a ValueError and does NOT write to DB or send email

### Requirement: System prompt and task prompt
The agent's system prompt (injected as `SystemMessage`) SHALL describe the 9-step IRCTC booking flow, tool usage rules, CAPTCHA retry logic (max 3 attempts), and the critical rule that `irctc_password` must never appear in tool calls or messages. The task prompt (injected as the first `HumanMessage`) SHALL include all journey parameters, credentials, and a numbered passenger list.

#### Scenario: System prompt is a SystemMessage not HumanMessage
- **WHEN** the initial graph state messages are constructed
- **THEN** the system prompt is the first element as a `SystemMessage` instance, followed by the task `HumanMessage`
