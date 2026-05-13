## ADDED Requirements

### Requirement: Settings screen structure
The Settings screen SHALL render under the heading `OPERATOR SETTINGS` with breadcrumb `CONFIGURATION / SYSTEM_PARAMETERS`, and be structured into three distinct sections: IRCTC Credentials, System Notifications, and Master Passenger List.

#### Scenario: Settings page renders all sections
- **WHEN** user navigates to Settings
- **THEN** all three sections are visible on the page

### Requirement: IRCTC credentials section
The credentials section SHALL show an IRCTC username field and a masked password field, and a `TEST CONNECTION` button styled with an outlined teal style.

#### Scenario: Credentials fields render
- **WHEN** the Settings screen is displayed
- **THEN** username input, password input (masked), and TEST CONNECTION button are visible

### Requirement: System notifications toggles
The notifications section SHALL show three toggle switches labeled EMAIL_ALERTS, SMS_GATEWAY, and PUSH_SYNC, each with a short description beneath the label.

#### Scenario: Toggles render and are interactive
- **WHEN** the Settings screen loads
- **THEN** three labeled toggle switches are shown, and clicking a toggle changes its visual on/off state

### Requirement: Master passenger list table
The passenger list section SHALL show a table with columns: ID, NAME, AGE, GENDER, PREFERENCES (e.g. LOWER BERTH, WINDOW SEAT), STATUS chip, and ACTIONS (edit/delete icons). An `ADD_NEW_ENTITY` button SHALL appear in the section header.

#### Scenario: Passenger table renders with mock data
- **WHEN** the Settings screen is displayed
- **THEN** at least four mock passengers are shown (e.g. VIKRAM MALHOTRA, ANANYA VERMA, RAJESH GUPTA, SMRITI IYER) with their age, gender, preference, and status

#### Scenario: Add new passenger button renders
- **WHEN** the Master Passenger List section is shown
- **THEN** the ADD_NEW_ENTITY button is visible in the section header
