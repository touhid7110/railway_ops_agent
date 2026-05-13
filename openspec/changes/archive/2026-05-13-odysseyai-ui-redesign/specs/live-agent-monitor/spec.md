## ADDED Requirements

### Requirement: Agent running header
The Live Agent screen SHALL show an `AGENT RUNNING` title with a mission target subtitle (e.g. `TARGET: NDLS TO MCI | 2A | 24 OCT 2023`) and two action buttons: `ABORT MISSION` and `PAUSE EXECUTION`.

#### Scenario: Header renders with mission details
- **WHEN** user navigates to the Live Agent screen
- **THEN** the AGENT RUNNING header, target route, and both action buttons are visible

### Requirement: OTP intercept panel
The left column SHALL contain an OTP input panel explaining that IRCTC has sent an 8-digit verification code, a masked code entry field, and a `VALIDATE & RESUME` button.

#### Scenario: OTP panel is displayed
- **WHEN** the Live Agent screen loads
- **THEN** the OTP prompt message, entry field, and validate button are visible

### Requirement: Circular step progress tracker
Below the header, a horizontal step progress indicator SHALL display five steps: LOGIN, SEARCH, SELECTION, PROCESSING, CONFIRMED, shown as numbered circles connected by lines. Completed steps SHALL be highlighted in teal.

#### Scenario: Progress tracker shows steps
- **WHEN** the Live Agent screen is active
- **THEN** five labeled step circles are rendered horizontally with at least the first steps highlighted as complete

### Requirement: Split execution log and browser preview
The main content area SHALL be divided into: a scrolling terminal-style execution log panel on the left showing timestamped tagged entries, and a simulated browser preview panel on the right showing the IRCTC page URL and a placeholder content area with an `WRITING DATA...` indicator.

#### Scenario: Execution log streams entries
- **WHEN** the Live Agent screen is active and not paused
- **THEN** new log entries appear at the bottom of the log panel at intervals, auto-scrolling to the latest entry

#### Scenario: Browser preview panel renders
- **WHEN** the Live Agent screen is displayed
- **THEN** the right panel shows a URL bar and a dark placeholder area representing the browser view
