## Context

The current codebase is a React + Vite SPA (`ui/`) with a manual page-switching pattern in `App.jsx` — a `PAGES` object maps string keys to components. There is no router library. All data is mock/hardcoded inline. The design system lives in `src/index.css` as CSS custom properties + utility classes (`.glass`, `.hud-border`, etc.) alongside Tailwind CSS v4.

Five screens are affected. The PlanetHero animation in Dashboard must be preserved unchanged. The Settings component is currently inlined in `App.jsx` and needs to be extracted to its own file.

## Goals / Non-Goals

**Goals:**
- Rename branding to OdysseyAI (sidebar header, page titles, any `MISSION CONTROL` labels visible in non-hero UI)
- Reduce sidebar to exactly 5 nav items: Dashboard, New Booking, Live Agent, History, Settings
- Redesign Dashboard below-hero section to match Image #5 (3 stat blocks + EXECUTION_LOGS.EXE table)
- Fully redesign New Booking (Image #1), Live Agent (Image #2), History (Image #3), Settings (Image #4) screens
- Extract `SettingsPage` from `App.jsx` into `ui/src/components/Settings.jsx`
- Create `ui/src/components/MissionHistory.jsx` as a new file

**Non-Goals:**
- Real backend API integration (all data remains mocked)
- Routing library migration
- PlanetHero animation changes
- Mobile responsiveness beyond current state
- TypeScript migration

## Decisions

### D1: Keep manual page-switching pattern
The existing `PAGES` object in `App.jsx` is simple and works. Introducing React Router for 5 screens would be over-engineering. The routing table will be trimmed (remove `pnr` and standalone `search` keys).

### D2: Extract Settings into its own file
Currently `SettingsPage` is inline in `App.jsx`. The new Settings screen is complex (credentials, toggles, passenger table) and warrants its own component file at `ui/src/components/Settings.jsx`.

### D3: Create MissionHistory as a new file
`MissionHistory.jsx` is a net-new screen with no prior equivalent. It replaces the `PNRStatus` slot conceptually but has entirely different content.

### D4: Repurpose AgentLogs → LiveAgent
`AgentLogs.jsx` will be rewritten in-place to become the new Live Agent (AGENT RUNNING) screen. The filename can stay `AgentLogs.jsx` or be renamed — for minimal churn, rewrite in-place and update the import in `App.jsx`.

### D5: Mock data for new screens
- History: hardcoded mission log array (matching Image #3 rows)
- New Booking: static form with AI prediction widget showing static probability
- Live Agent: simulated step progress + existing setTimeout log simulation retained
- Settings: static passenger list array (matching Image #4 rows)

## Risks / Trade-offs

- [Rewriting AgentLogs in-place may lose the existing log simulation] → Retain the SEED_LOGS + LIVE_ENTRIES + setTimeout loop; wrap it inside the new AGENT RUNNING layout
- [SettingsPage extraction touches App.jsx] → Minimal change: just remove the inline function and add an import
- [PNRStatus.jsx becomes orphaned] → Leave the file; simply remove the route from `PAGES` — no deletion needed
