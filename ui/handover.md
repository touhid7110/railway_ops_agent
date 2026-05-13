# Handover: RailOps Mission Control Integration

This document provides the necessary context for backend agents to implement the API and logic for the RailOps Mission Control UI.

## Project Overview
RailOps Mission Control is a high-performance, AI-driven dashboard for IRCTC railway booking automation. The UI follows a "Mission Control" / "HUD" aesthetic with dark themes, glassmorphism, and technical typography.

## UI Tech Stack
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS v4 + Vanilla CSS
- **Icons**: Lucide-React
- **State Management**: React `useState`/`useEffect` (Ready for Context or Redux integration)

## Core Components & Data Requirements

### 1. Dashboard (`Dashboard.jsx`)
The centerpiece of the app. It requires real-time system stats.
- **Stats Required**:
  - `bookings_today`: Integer
  - `success_rate`: Percentage (Float)
  - `avg_latency`: Milliseconds (Integer)
  - `active_sessions`: Integer
- **Recent Bookings**: A list of objects containing `pnr`, `route`, `train`, `date`, `status` (AVAILABLE/WAITING/REGRET), and `amt`.
- **System Health**: Performance metrics for Booking Success, PNR Resolution, Tatkal Speed, and OTP Accuracy.

### 2. Booking Terminal (`BookingSearch.jsx`)
Handles train search and booking initialization.
- **Search Parameters**: `from_station`, `to_station`, `date`, `class`, `quota`.
- **Train Results Data**:
  - `id`: Train number (e.g., "12301")
  - `name`: Train name
  - `times`: Departure and Arrival times
  - `duration`: Travel time
  - `price`: Integer
  - `status`: Current availability status

### 3. PNR Enquiry (`PNRStatus.jsx`)
Requires a lookup endpoint for 10-digit PNR numbers.
- **Response Structure**:
  - `train_info`: Number and Name
  - `route`: From/To stations with times
  - `passengers`: Array of `{ name, age, sex, berth, status }`
  - `chart_status`: String (e.g., "CHART NOT PREPARED")

### 4. Agent Execution Logs (`AgentLogs.jsx`)
This component is designed for real-time updates.
- **Streaming Need**: WebSocket or Server-Sent Events (SSE) preferred.
- **Log Entry Structure**: `{ timestamp, tag (NAV/AUTH/FORM/INFO/ERR), message }`.

### 5. Configuration (`SettingsPage` in `App.jsx`)
Requires persistence for user credentials and default preferences.
- **Fields**: `irctc_username`, `api_timeout`, `otp_channel`, `default_class`, `default_quota`.

## Proposed API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/stats` | Dashboard statistics and recent bookings |
| `GET` | `/api/v1/trains` | Search trains based on query params |
| `POST` | `/api/v1/book` | Initiate the AI booking agent for a specific train |
| `GET` | `/api/v1/pnr/:id` | Fetch current PNR status and passenger details |
| `GET` | `/api/v1/logs/stream` | (WS/SSE) Stream real-time logs from active agents |
| `GET/PUT` | `/api/v1/settings` | Retrieve or update user configuration |

## Design Assets
- **Color Palette & Typography**: Detailed in `DESIGN.md`.
- **Hero Image**: `/public/dashboard_planet.avif`.

## How to Start and Use the UI
1.  **Navigate**: `cd ui`
2.  **Install**: `npm install`
3.  **Start Dev Server**: `npm run dev`
4.  **View**: The app runs at `http://localhost:5173`.

## Integration Notes
- The UI currently uses mock data in the components. Backend integration should involve replacing these mocks with `fetch` calls or an API client (like Axios).
- Ensure CORS is configured correctly if the backend runs on a different port.
- The `PlanetHero` in `Dashboard.jsx` is the primary visual centerpiece; ensure it remains "clean" as per the user's latest aesthetic preference.
