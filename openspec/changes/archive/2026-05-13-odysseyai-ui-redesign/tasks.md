## 1. Branding and Routing Cleanup

- [x] 1.1 In `App.jsx`: update `PAGES` object — remove `pnr` and standalone `search` keys; add `history` → `MissionHistory`, update `settings` to use extracted `Settings` component
- [x] 1.2 In `App.jsx`: import `MissionHistory` and `Settings` components (to be created/extracted)
- [x] 1.3 In `Sidebar.jsx`: rename header branding from "MISSION CONTROL" / operator label to "OdysseyAI"; trim nav items to exactly five: Dashboard, New Booking, Live Agent, History, Settings

## 2. Extract Settings Component

- [x] 2.1 Create `ui/src/components/Settings.jsx` — move the existing `SettingsPage` inline function out of `App.jsx` into this new file
- [x] 2.2 Redesign `Settings.jsx` to match Image #4: add breadcrumb `CONFIGURATION / SYSTEM_PARAMETERS`, section for IRCTC credentials (username + masked password + TEST CONNECTION button)
- [x] 2.3 Add System Notifications section with three toggle switches: EMAIL_ALERTS, SMS_GATEWAY, PUSH_SYNC
- [x] 2.4 Add Master Passenger List table with columns (ID, NAME, AGE, GENDER, PREFERENCES, STATUS, ACTIONS) and mock data (VIKRAM MALHOTRA, ANANYA VERMA, RAJESH GUPTA, SMRITI IYER)
- [x] 2.5 Add `ADD_NEW_ENTITY` button to the Master Passenger List section header

## 3. Dashboard Below-Hero Redesign

- [x] 3.1 In `Dashboard.jsx`: replace the existing 4-card stat grid with three wide stat blocks: TOTAL BOOKINGS (1,284 / "+12% vs last deployment"), SUCCESSFUL BOOKINGS (98.2% / "OPTIMAL Execution path confirmed"), PENDING BOOKINGS (14 / "QUEUEING Waiting for TATKAL window")
- [x] 3.2 Add `EXECUTION_LOGS.EXE` panel below stat blocks: terminal icon in header, three colored dots (red `#ff5555`, violet `#a855f7`, teal `#00f2ff`) top-right, table with columns JOB ID, ROUTE, STATUS, TIMESTAMP; mock rows: #MC-8902 DEL→MUM SUCCESS, #MC-8903 BLR→HYD IN_PROGRESS, #MC-8904 MAA→KOL SUCCESS, #MC-8905 PUN→GYW WAITING
- [x] 3.3 Add `VIEW FULL SYSTEM LOGS [F12]` text link below the table that calls `onNavigate('history')`
- [x] 3.4 Add `New Booking →` button in bottom-right of the dashboard section that calls `onNavigate('booking')`
- [x] 3.5 Remove the old quick-actions button grid and the Agent Performance progress bar panel

## 4. New Booking Screen (INITIALIZE_BOOKING)

- [x] 4.1 Rewrite `BookingSearch.jsx`: add page heading `INITIALIZE_BOOKING` with mission ID subtitle (`OPERATIONAL PARAMETERS FOR MISSION: #MX-4029`)
- [x] 4.2 Build left panel `JOURNEY_PARAMETERS`: FROM_STATION input (pre-filled "NDLS - NEW DELHI"), TO_STATION search input, DATE picker, CLASS dropdown with options (1A, 2A, 3A, SL, CC, EC), QUOTA pill toggle (GENERAL / TATKAL / PREMIUM_TATKAL)
- [x] 4.3 Build AI prediction engine widget at the bottom of the left panel: label `AI_PREDICTION_ENGINE`, probability percentage (87.4%), and confidence text
- [x] 4.4 Build right panel `PERSONNEL_ROSTER`: two mock passenger rows (VIKRAM SHARMA age 28, PRIYA MEHTA) each with edit/remove icons; `ADD_NEW_PERSONNEL` button
- [x] 4.5 Add COMMUNICATION_CHANNELS sub-section in right panel with an email input field
- [x] 4.6 Add footer row with total fare (₹2,480.00) and `LAUNCH AGENT →` primary CTA button (teal glow style)

## 5. Live Agent Screen (AGENT RUNNING)

- [x] 5.1 Rewrite `AgentLogs.jsx` header section: title `AGENT RUNNING`, subtitle `TARGET: NDLS TO MCI | 2A | 24 OCT 2023`, `ABORT MISSION` button (error/red style), `PAUSE EXECUTION` button
- [x] 5.2 Add circular step progress tracker below the header: five steps (LOGIN, SEARCH, SELECTION, PROCESSING, CONFIRMED) as numbered circles connected by horizontal lines; steps 1–3 highlighted teal as complete
- [x] 5.3 Build OTP intercept left panel: explanatory message ("IRCTC has sent an 8-digit verification code to your registered mobile ending in ****7602"), masked OTP entry field, `VALIDATE & RESUME` button
- [x] 5.4 Build split-view content area: left side keeps the existing scrolling log panel (SEED_LOGS + LIVE_ENTRIES setTimeout simulation); right side adds a browser preview panel with URL bar (`https://www.irctc.co.in/nget/booking/passenger-details`) and a dark placeholder area with `WRITING DATA...` centered text
- [x] 5.5 Retain PAUSE / CLEAR controls for the log panel

## 6. History Screen (MISSION LOGS)

- [x] 6.1 Create `ui/src/components/MissionHistory.jsx` with heading `MISSION LOGS`, breadcrumb `ARCHIVE_SYSTEM_V.4.2`
- [x] 6.2 Add top tab navigation: TERMINAL, ARCHIVES (active/highlighted), NETWORK
- [x] 6.3 Add search bar (`SEARCH MISSIONS...`) and DATE / STATUS filter buttons in the table header area
- [x] 6.4 Build mission log table with columns: MISSION_ID (teal), TIMESTAMP, TRAIN_INTEL (number + name + class), ROUTE (FROM → TO arrow), STATUS chip, ACTION chevron; mock rows from Image #3
- [x] 6.5 Add aggregate stats footer with four tiles: TOTAL_EXECUTIONS (1,248), SUCCESS_RATE (98.4%), AVG_LATENCY (42ms), CREDITS_USED (4.2k)
