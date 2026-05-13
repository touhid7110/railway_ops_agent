## ADDED Requirements

### Requirement: SQLite schema initialised on startup
The `db.py` module SHALL run `CREATE TABLE IF NOT EXISTS` for all four tables during FastAPI's lifespan startup event using `aiosqlite`. WAL journal mode (`PRAGMA journal_mode=WAL`) MUST be set on every new connection to allow concurrent readers during writes.

#### Scenario: Tables exist after first startup
- **WHEN** the FastAPI application starts for the first time with no existing database file
- **THEN** all four tables (jobs, job_logs, passengers, settings) are created and the app starts successfully

### Requirement: jobs table schema
The `jobs` table SHALL have columns: `id TEXT PRIMARY KEY`, `status TEXT DEFAULT 'queued'`, `source TEXT`, `destination TEXT`, `date TEXT`, `travel_class TEXT`, `booking_type TEXT`, `notify_email TEXT`, `payment_url TEXT`, `error_message TEXT`, `steps_total INTEGER DEFAULT 9`, `steps_done INTEGER DEFAULT 0`, `created_at TEXT`, `completed_at TEXT`. There SHALL be no `irctc_password` column.

#### Scenario: Job row created on POST /api/jobs
- **WHEN** a new booking is accepted
- **THEN** a row is inserted with status="queued", created_at set to current UTC ISO timestamp, and all journey fields populated

### Requirement: job_logs table schema
The `job_logs` table SHALL have columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `job_id TEXT NOT NULL`, `tag TEXT`, `message TEXT`, `ts TEXT`. Every `emit_sse` call MUST insert a row here in addition to queueing the SSE event.

#### Scenario: Log row inserted on emit_sse
- **WHEN** the agent calls emit_sse(tag="NAV", message="Navigating...")
- **THEN** a row is inserted into job_logs with the correct job_id, tag, message, and current timestamp

### Requirement: passengers table schema
The `passengers` table SHALL have columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `name TEXT`, `age INTEGER`, `id_type TEXT`, `id_number TEXT`. Passenger rows are inserted when a job is created and referenced by job_id via the settings-managed master list.

#### Scenario: Passengers persisted on job creation
- **WHEN** POST /api/jobs includes a passengers array
- **THEN** each passenger is inserted into the passengers table

### Requirement: settings table schema
The `settings` table SHALL have columns: `key TEXT PRIMARY KEY`, `value TEXT`. Default keys include `irctc_username`, `smtp_notify_email`, `email_alerts`, `sms_gateway`, `push_sync`. The `PUT /api/settings` endpoint SHALL upsert rows using `INSERT OR REPLACE`.

#### Scenario: Settings survive restart
- **WHEN** settings are saved via PUT /api/settings and the server is restarted
- **THEN** GET /api/settings returns the same values after restart
