## Why

The current RailOps UI is a functional prototype named "Mission Control" with generic screens (PNR Status, Booking Search) that don't match the polished "OdysseyAI" product vision. The screens need to be consolidated around the four core user workflows (booking, live agent monitoring, history, settings) and redesigned to match the high-fidelity reference designs with a consistent terminal/HUD aesthetic.

## What Changes

- **Rename** the application from "Mission Control" / "RailOps" to **OdysseyAI** across all branding, sidebar headers, and page titles
- **Remove** the standalone PNR Status screen and the duplicate Booking Search route from the sidebar and routing table
- **Redesign Dashboard** (below hero): replace the current stat cards + quick-actions with three wide stat blocks (TOTAL BOOKINGS, SUCCESSFUL BOOKINGS, PENDING BOOKINGS) and an `EXECUTION_LOGS.EXE` job table
- **Redesign New Booking screen**: dual-panel `INITIALIZE_BOOKING` layout — left panel for journey parameters (FROM, TO, DATE, CLASS, QUOTA), right panel for passenger roster + communication channels, with AI prediction engine widget and a `LAUNCH AGENT →` CTA
- **Redesign Live Agent screen**: `AGENT RUNNING` header with mission target, OTP intercept panel, circular step progress tracker (LOGIN → SEARCH → SELECTION → PROCESSING → CONFIRMED), split-view with scrolling execution logs + embedded browser preview pane
- **Add History screen**: `MISSION LOGS` table with MISSION_ID, TIMESTAMP, TRAIN_INTEL, ROUTE, STATUS columns, search + filter controls, and aggregate stats footer
- **Redesign Settings screen**: `OPERATOR SETTINGS` with IRCTC credentials, system notification toggles (EMAIL_ALERTS, SMS_GATEWAY, PUSH_SYNC), and a Master Passenger List CRUD table

## Capabilities

### New Capabilities

- `initialize-booking`: Dual-panel booking form with journey parameters, passenger roster, AI prediction engine, and LAUNCH AGENT action
- `live-agent-monitor`: Real-time agent execution view with OTP input, step progress tracker, and split log/browser-preview panel
- `mission-history`: Paginated mission log table with search/filter and aggregate stats
- `operator-settings`: Credentials management, notification toggles, and passenger list management

### Modified Capabilities

- `dashboard`: Dashboard stat section and job log table redesigned to match new visual spec (below-hero section only; PlanetHero animation unchanged)

## Impact

- `ui/src/App.jsx` — routing table, app name, sidebar pages list
- `ui/src/components/Sidebar.jsx` — nav items, branding
- `ui/src/components/Dashboard.jsx` — stat cards, execution log table (below PlanetHero)
- `ui/src/components/BookingSearch.jsx` — full rewrite to INITIALIZE_BOOKING layout
- `ui/src/components/AgentLogs.jsx` — full rewrite to AGENT RUNNING layout
- `ui/src/components/PNRStatus.jsx` — **BREAKING**: removed from routing (file can remain but is no longer referenced)
- New files: `ui/src/components/MissionHistory.jsx`, updated `ui/src/components/Settings.jsx` (currently inline in App.jsx)
