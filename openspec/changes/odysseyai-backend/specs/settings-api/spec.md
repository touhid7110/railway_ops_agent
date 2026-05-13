## ADDED Requirements

### Requirement: GET /api/settings — retrieve configuration
The endpoint SHALL return a JSON object with: `irctc_username` (string), `smtp_notify_email` (string), `email_alerts` (bool), `sms_gateway` (bool), `push_sync` (bool). Any password field MUST be returned as an empty string `""`. If a key has no row in the settings table, return its default value (empty string for strings, false for bools).

#### Scenario: Password field always empty on read
- **WHEN** GET /api/settings is called regardless of what was previously saved
- **THEN** any field with "password" in its key name is returned as empty string

#### Scenario: Default values returned for uninitialised settings
- **WHEN** the settings table has no rows
- **THEN** GET /api/settings returns all fields with empty string or false defaults, not an error

### Requirement: PUT /api/settings — update configuration
The endpoint SHALL accept a JSON body with the same shape as GET /api/settings (plus an optional `irctc_password` field). Each provided key SHALL be upserted into the settings table using `INSERT OR REPLACE`. `irctc_password` MAY be accepted and stored (it is the user's own credential stored at their request), but MUST NOT be returned by GET.

#### Scenario: Settings are persisted
- **WHEN** PUT /api/settings is called with irctc_username="AGENT_7"
- **THEN** a subsequent GET /api/settings returns irctc_username="AGENT_7"

### Requirement: Master passenger list endpoints
The API SHALL expose `GET /api/passengers` returning all rows from the passengers table, and `POST /api/passengers` to insert a new passenger. `DELETE /api/passengers/{id}` SHALL remove a row by primary key.

#### Scenario: Passenger added and retrieved
- **WHEN** POST /api/passengers is called with name, age, id_type, id_number
- **THEN** the passenger appears in the subsequent GET /api/passengers response

#### Scenario: Passenger deleted
- **WHEN** DELETE /api/passengers/{id} is called with a valid id
- **THEN** the row is removed and no longer appears in GET /api/passengers
