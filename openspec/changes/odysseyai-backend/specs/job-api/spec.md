## ADDED Requirements

### Requirement: POST /api/jobs — create and launch a booking job
The endpoint SHALL accept a JSON body with: `source`, `destination`, `date`, `travel_class`, `booking_type`, `passengers` (list), `contact_mobile`, `notify_email`, `irctc_username`, `irctc_password`. It SHALL create a row in the `jobs` table, launch the agent as an `asyncio.create_task`, and return `{"job_id": "<uuid>", "status": "queued"}` with HTTP 201. `irctc_password` MUST NOT be written to the database.

#### Scenario: Job is created and agent starts
- **WHEN** a POST /api/jobs request is received with valid fields
- **THEN** a new job row is written to SQLite, the agent background task is created, and the response returns the job_id within 200ms

#### Scenario: irctc_password is not persisted
- **WHEN** a POST /api/jobs request is processed
- **THEN** the jobs table row has no password column and no log entry contains the password value

### Requirement: GET /api/jobs — list all jobs
The endpoint SHALL return a JSON array of job objects, ordered by `created_at` descending. Each object SHALL include: `id`, `status`, `source`, `destination`, `date`, `travel_class`, `booking_type`, `notify_email`, `payment_url`, `steps_done`, `steps_total`, `created_at`, `completed_at`.

#### Scenario: Empty list when no jobs exist
- **WHEN** GET /api/jobs is called with no jobs in the database
- **THEN** the response is `[]` with HTTP 200

#### Scenario: Jobs returned newest first
- **WHEN** multiple jobs exist
- **THEN** the response array is ordered by created_at descending

### Requirement: GET /api/jobs/{id} — job detail with log replay
The endpoint SHALL return the job object plus a `logs` array of `{tag, message, ts}` entries from `job_logs`, ordered by `ts` ascending. Returns HTTP 404 if the job_id does not exist.

#### Scenario: Completed job returns full log
- **WHEN** GET /api/jobs/{id} is called for a completed job
- **THEN** the response includes all log entries written during the booking in chronological order

### Requirement: POST /api/jobs/{id}/otp — submit OTP to resume agent
The endpoint SHALL accept `{"otp": "<digits>"}`, inject the OTP as a `HumanMessage` into the graph state, and call `graph.ainvoke` with the same `thread_id` (job_id) to resume the interrupted LangGraph thread. Returns HTTP 200 on success, HTTP 404 if job not found, HTTP 409 if job is not in `waiting_otp` status.

#### Scenario: OTP resumes the agent
- **WHEN** POST /api/jobs/{id}/otp is called while the job status is waiting_otp
- **THEN** the LangGraph thread resumes, the OTP is typed into the IRCTC OTP field, and the job status transitions away from waiting_otp

#### Scenario: OTP rejected if job not waiting
- **WHEN** POST /api/jobs/{id}/otp is called on a job with status "running" or "success"
- **THEN** the response is HTTP 409 with an explanatory error message

### Requirement: GET /api/stats — dashboard aggregate statistics
The endpoint SHALL return: `total_bookings` (int), `successful_bookings` (int), `pending_bookings` (int — count of jobs with status running or waiting_otp), `avg_latency_ms` (float — average seconds between created_at and completed_at for successful jobs, expressed in ms), and a `recent_jobs` array (last 4 jobs with id, source, destination, status, created_at).

#### Scenario: Stats reflect current database state
- **WHEN** GET /api/stats is called after several jobs have completed
- **THEN** total_bookings equals the total row count in jobs, successful_bookings equals rows with status=success

### Requirement: CORS for UI dev server
The FastAPI app SHALL include `CORSMiddleware` allowing origin `http://localhost:5173`, all methods, and all headers.

#### Scenario: Preflight request succeeds
- **WHEN** the browser sends an OPTIONS preflight to any /api endpoint from localhost:5173
- **THEN** the response includes the correct CORS headers and HTTP 200
