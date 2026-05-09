# League Module - Frontend Implementation Plan

This document outlines the API integration for the League module. It covers league creation, joining, management, and participant settings (Pre-draft & Auto Pick).

## Base URL
`/league`

---

## 1. Participant Settings

### Auto Pick Toggle
Users can manually enable "Auto Pick" to let the system draft for them instantly (1-second delay) when they are on the clock.
- **URL**: `/league/:id/auto-pick`
- **Method**: `PATCH`
- **Body**: `{ "enabled": true | false }`

### Pre-draft Management
Users can curate an ordered list of fighters before the draft. The system will pick the first available fighter from this list.
- **GET** `/league/:id/pre-draft` — Retrieve your current priority list.
- **POST** `/league/:id/pre-draft` — Update your list (Send an ordered array).
    - **Body**: `{ "orderedFighterIds": ["uuid1", "uuid2", ...] }`

---

## 2. Core Endpoints

### A. Get All Leagues (Public Browse)
Fetches active, non-archived leagues. Passcodes are masked.
- **URL**: `/league`
- **Method**: `GET`
- **Searching**: `searchTerm` (Matches `name` or `code`)
- **Filtering**: `leagueType` (PUBLIC/PRIVATE), `status`.

### B. Join League
- **URL**: `/league/join`
- **Method**: `POST`
- **Body**: `{ code: string, teamName: string, passcode?: string }`

### C. Leave League / Delete Team
- **URL**: `/league/:id/leave`
- **Method**: `POST`
- **Note**: Dissolves the league if called by the Manager.

---

## 3. Roster Management (Post-Draft)

- **POST** `/league/:id/add-fighter` — `{ fighterId: string }`
- **POST** `/league/:id/remove-fighter` — `{ fighterId: string }`

---

## 4. Admin Dashboard: Get All Leagues

Comprehensive view of all leagues in the system.
- **URL**: `/league/admin/all`
- **Method**: `GET`
- **Auth Required**: Admin Role
- **Includes**: Full data for managers, scoring settings, teams, and draft sessions.

---

## 5. Technical Integration Notes

1.  **Auto Pick Synchronization**: If a user has `isAutoPickEnabled: true`, the [Draft Engine](file:///d:/Anar/WEB-STA/gabriel/garbiel-server/src/helpers/draftEngine.ts) will pick for them almost immediately.
2.  **Pre-draft Priority**: The system always checks the Pre-draft list in order (`priority: 1, 2, 3...`) before falling back to the highest-ranked fighter.
3.  **Snake Draft**: Real-time updates for active drafts should follow the [Drafting Implementation Plan](file:///d:/Anar/WEB-STA/gabriel/garbiel-server/drafting_implementation.md).
