## ADDED Requirements

### Requirement: GET /api/jobs/{id}/logs/stream — SSE endpoint
The endpoint SHALL return `Content-Type: text/event-stream` and `Cache-Control: no-cache` headers. It SHALL drain the job's `asyncio.Queue`, serialise each event as `data: <JSON>\n\n`, and flush immediately. When the queue yields a `{"type": "done"}` or `{"type": "error"}` event, the endpoint SHALL send it and then close the stream.

#### Scenario: Log event appears in stream within one tick
- **WHEN** the agent calls emit_sse
- **THEN** the SSE client receives the event as a `data:` line within one asyncio event loop tick

#### Scenario: Stream closes after done event
- **WHEN** save_payment_url emits a done event onto the queue
- **THEN** the SSE endpoint sends the done event and terminates the response

#### Scenario: 404 for unknown job
- **WHEN** GET /api/jobs/{id}/logs/stream is called with a non-existent job_id
- **THEN** the response is HTTP 404 (not a hanging stream)

### Requirement: Per-job asyncio.Queue registry
The `sse.py` module SHALL maintain a global `SSE_QUEUES: dict[str, asyncio.Queue]` registry. `create_queue(job_id)` SHALL create and register a queue. `get_queue(job_id)` SHALL return the queue or None. `drop_queue(job_id)` SHALL remove the queue silently if present.

#### Scenario: Queue is created before agent task starts
- **WHEN** POST /api/jobs processes a new booking request
- **THEN** create_queue is called before asyncio.create_task so the agent can enqueue events from its first tool call

#### Scenario: Queue is dropped when stream closes
- **WHEN** the SSE client disconnects or the stream ends
- **THEN** drop_queue is called for that job_id so memory is reclaimed

### Requirement: Log events written to job_logs table
Every event that the agent puts onto the SSE queue via `emit_sse` SHALL also be written as a row to the `job_logs` table (tag, message, ts, job_id). This allows the History screen to replay the full log for completed jobs even if the SSE connection was not open.

#### Scenario: History replay works without live SSE
- **WHEN** GET /api/jobs/{id} is called after a job has completed
- **THEN** the logs array contains all events that were emitted during the booking, regardless of whether an SSE client was connected
