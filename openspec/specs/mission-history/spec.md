## ADDED Requirements

### Requirement: Mission logs table
The History screen SHALL render under the heading `MISSION LOGS` with breadcrumb `ARCHIVE_SYSTEM_V.4.2` and a data table with columns: MISSION_ID (teal link style), TIMESTAMP, TRAIN_INTEL (train number + name + class), ROUTE (FROM → TO), STATUS chip (AVAILABLE / WAITING / REGRET), and an ACTION chevron.

#### Scenario: Table renders with mock mission rows
- **WHEN** user navigates to the History screen
- **THEN** at least four mission rows are displayed matching the reference data (e.g. #B-8829-X, #B-8830-Y, #B-8831-Z, #B-8842-A)

### Requirement: Search and filter controls
The screen SHALL include a search input (`SEARCH MISSIONS...`) and two filter buttons: DATE and STATUS, rendered in the top-right of the table header area.

#### Scenario: Controls render
- **WHEN** the History screen is displayed
- **THEN** the search bar and DATE / STATUS filter buttons are visible

### Requirement: Aggregate stats footer
Below the table, four stat tiles SHALL display: TOTAL_EXECUTIONS (e.g. 1,248), SUCCESS_RATE (e.g. 98.4%), AVG_LATENCY (e.g. 42ms), and CREDITS_USED (e.g. 4.2k).

#### Scenario: Stats footer renders
- **WHEN** the Mission Logs page is shown
- **THEN** all four stat values are displayed below the table in monospace font

### Requirement: Top navigation tabs
The screen SHALL include three top navigation tabs: TERMINAL, ARCHIVES (active), NETWORK, rendered as a secondary tab bar.

#### Scenario: Archives tab is active by default
- **WHEN** user navigates to History
- **THEN** the ARCHIVES tab is highlighted as the active tab
