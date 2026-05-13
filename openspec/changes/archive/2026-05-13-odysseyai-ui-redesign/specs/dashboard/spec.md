## MODIFIED Requirements

### Requirement: Below-hero stat section
The Dashboard below-hero section SHALL display three wide stat blocks side by side: TOTAL BOOKINGS (large number + "+X% vs last deployment" sub-text), SUCCESSFUL BOOKINGS (percentage + "OPTIMAL Execution path confirmed"), and PENDING BOOKINGS (count + "QUEUEING Waiting for TATKAL window"). Each block SHALL occupy roughly one-third of the full content width.

#### Scenario: Three stat blocks render below hero
- **WHEN** the Dashboard is displayed
- **THEN** three stat blocks labeled TOTAL BOOKINGS, SUCCESSFUL BOOKINGS, and PENDING BOOKINGS appear immediately below the PlanetHero section

### Requirement: Execution logs table
Below the stat blocks, the Dashboard SHALL display an `EXECUTION_LOGS.EXE` panel with a terminal-icon header, three colored dots (red, violet, teal) in the top-right, and a table of recent jobs with columns: JOB ID, ROUTE (FROM → TO), STATUS chip (SUCCESS / IN_PROGRESS / WAITING), and TIMESTAMP.

#### Scenario: Execution logs table renders with mock data
- **WHEN** the Dashboard page is shown
- **THEN** at least four job rows are displayed (e.g. #MC-8902 DEL→MUM SUCCESS, #MC-8903 BLR→HYD IN_PROGRESS) with correct status chip colors

### Requirement: View full system logs link and New Booking CTA
Below the execution logs table, a `VIEW FULL SYSTEM LOGS [F12]` text link SHALL navigate to the History screen, and a `New Booking →` button in the bottom-right SHALL navigate to the New Booking screen.

#### Scenario: New Booking CTA navigates correctly
- **WHEN** user clicks the New Booking button on the Dashboard
- **THEN** the app navigates to the New Booking (initialize-booking) screen

#### Scenario: View logs link is present
- **WHEN** the Dashboard is displayed
- **THEN** the VIEW FULL SYSTEM LOGS text link is visible below the job table
