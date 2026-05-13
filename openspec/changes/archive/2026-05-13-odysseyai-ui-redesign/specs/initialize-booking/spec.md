## ADDED Requirements

### Requirement: Dual-panel booking form layout
The New Booking screen SHALL render as two side-by-side panels under the heading `INITIALIZE_BOOKING` with a mission ID subtitle (e.g. `OPERATIONAL PARAMETERS FOR MISSION: #MX-4029`).

#### Scenario: Page loads with dual-panel layout
- **WHEN** user navigates to the New Booking screen
- **THEN** the left panel shows JOURNEY_PARAMETERS and the right panel shows PERSONNEL_ROSTER

### Requirement: Journey parameters panel
The left panel SHALL contain: FROM_STATION input (pre-filled with station code + city name), TO_STATION search input, DATE picker (DD/MM/YYYY format), CLASS dropdown (e.g. AC FIRST CLASS 1A), and QUOTA selector with three pill-style toggle buttons: GENERAL, TATKAL, PREMIUM_TATKAL.

#### Scenario: Quota pill selection
- **WHEN** user clicks a QUOTA pill (GENERAL / TATKAL / PREMIUM_TATKAL)
- **THEN** the selected pill becomes visually active (teal highlight) and the others become inactive

#### Scenario: Station swap
- **WHEN** user swaps FROM and TO stations
- **THEN** the field values exchange without clearing other form fields

### Requirement: AI prediction engine widget
The left panel SHALL include an `AI_PREDICTION_ENGINE` info box showing a probability percentage and a confidence message (e.g. "Probability of seat confirmation for the selected route is 87.4% based on historical mission data.").

#### Scenario: Prediction widget renders
- **WHEN** the New Booking screen is displayed
- **THEN** the AI prediction box is visible with a percentage value and explanatory text

### Requirement: Personnel roster panel
The right panel SHALL list added passengers with name, age, and a status badge, an `ADD_NEW_PERSONNEL` button to append a passenger row, and a COMMUNICATION_CHANNELS section with an email field.

#### Scenario: Passenger list renders
- **WHEN** the booking screen loads
- **THEN** at least two mock passengers are shown (e.g. VIKRAM SHARMA, PRIYA MEHTA) with edit/remove affordances

### Requirement: Price and launch action
The bottom of the screen SHALL show the total fare (e.g. ₹2,480.00) and a prominent `LAUNCH AGENT →` button.

#### Scenario: Launch Agent button is visible
- **WHEN** the booking form is displayed
- **THEN** the LAUNCH AGENT button is visible and styled with the primary teal glow style
