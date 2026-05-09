# Draft System - Comprehensive Implementation Plan

This document provides the complete technical specification for implementing the live fantasy draft on the frontend. It covers real-time Socket.IO communication, REST API integration, and the Pre-draft/Auto Pick logic.

---

## 1. Socket.IO Specification

### A. Connection & Authentication
1.  Connect to the socket server.
2.  **Emit `register`**: Notify the server of your `userId` to link your session.
    - **Payload**: `userId: string`
    - **Example**: `socket.emit("register", "user_abcd_123");`

### B. Room Management
- **Emit `join_draft`**: Join a specific league's draft room.
    - **Payload**: `{ "leagueId": string }`
    - **Example**: `socket.emit("join_draft", { leagueId: "league_555" });`
    - **Effect**: Server will respond with a `draft:sync` event containing the initial state.
- **Emit `leave_draft`**: Leave the room.
    - **Payload**: `{ "leagueId": string }`
    - **Example**: `socket.emit("leave_draft", { leagueId: "league_555" });`

### C. Listeners (Server -> Client)
| Event | Payload Type | Description |
| :--- | :--- | :--- |
| `draft:sync` | `IDraftSession` | Full draft state sent immediately upon joining. |
| `draft:pick` | `IPickEvent` | Broadcasted when any user makes a successful manual pick. |
| `draft:autopick`| `IAutoPickEvent`| Broadcasted when the system makes a pick (Timer or Auto-toggle). |
| `draft:refresh_fighters` | `{ leagueId: string }` | **New**: Broadcasted to all users when a fighter is picked to trigger a refetch of the available fighters list API. |
| `draft:error` | `IErrorEvent` | Sent only to the user who attempted an invalid pick. |
| `draft:completed`| `{ leagueId: string }` | Broadcasted when the final roster spot is filled. |

### D. Emits (Client -> Server)
| Event | Payload Type | Description |
| :--- | :--- | :--- |
| `make_pick` | `{ leagueId: string, fighterId: string }` | Request to pick a fighter. The server validates if it's your turn. |

---

## 2. REST API Specification

All responses follow the standard wrapper: `{ success: boolean, message: string, data: T }`.

### A. Get Draft Session State
Fetch the full draft structure, including pick history and the specific "Snake Order" slots.
- **URL**: `GET /draft/:leagueId`
- **Response Data**: `IDraftSession`
```json
{
  "success": true,
  "message": "Draft session retrieved",
  "data": {
    "id": "draft_001",
    "leagueId": "league_555",
    "status": "DRAFTING",
    "currentRound": 1,
    "currentPickIndex": 5,
    "secondsPerPick": 60,
    "turnStartedAt": "2026-05-09T22:15:00Z",
    "draftOrder": [...],
    "draftPicks": [...]
  }
}
```

### B. Get Available Fighters
A paginated, filterable list of fighters **not yet picked** in this draft.
- **URL**: `GET /draft/:leagueId/fighters`
- **Query Params**: `searchTerm`, `divisionId`, `page`, `limit`
- **Response Data**:
```json
{
  "success": true,
  "message": "Available fighters retrieved",
  "data": {
    "fighters": [
      {
        "id": "fighter_1",
        "name": "Israel Adesanya",
        "rank": 2,
        "division": "Middleweight",
        "imageUrl": "..."
      }
    ],
    "meta": { "total": 45, "page": 1, "limit": 10 }
  }
}
```

### C. Pre-draft Management (Queue)
Manage your priority list before or during the draft.
- **GET** `/league/:id/pre-draft`
    - **Response Data**: `{ "orderedFighterIds": ["uuid1", "uuid2"] }`
- **POST** `/league/:id/pre-draft`
    - **Body**: `{ "orderedFighterIds": ["uuid1", "uuid2", ...] }`
    - **Response Data**: `{ "success": true }`

### D. Auto Pick Toggle
Toggle whether the system should pick for you instantly.
- **PATCH** `/league/:id/auto-pick`
    - **Body**: `{ "enabled": true | false }`
    - **Response Data**: `{ "enabled": true }`

---

## 3. Data Structures & Examples

### `IDraftSession`
```json
{
  "id": "cmos...",
  "leagueId": "league_uuid",
  "status": "DRAFTING",
  "currentRound": 1,
  "currentPickIndex": 5,
  "secondsPerPick": 60,
  "turnStartedAt": "2026-05-06T03:30:00Z",
  "draftOrder": [
    {
      "overallPick": 0,
      "round": 1,
      "team": {
        "id": "team_1",
        "name": "Tokyo Warriors",
        "owner": { "name": "Anar", "avatarUrl": "..." }
      }
    }
  ],
  "draftPicks": [
    {
      "pickNumber": 0,
      "round": 1,
      "fighter": { "id": "f_1", "name": "Conor McGregor", "rank": 1 },
      "team": { "id": "team_1", "name": "Tokyo Warriors" }
    }
  ]
}
```

### `IPickEvent` / `IAutoPickEvent`
```json
{
  "leagueId": "uuid",
  "teamId": "team_uuid",
  "fighter": { 
    "id": "f_1", 
    "name": "Jon Jones",
    "imageUrl": "...",
    "rank": 1
  },
  "pickIndex": 4,
  "nextPickIndex": 5,
  "isDraftComplete": false,
  "turnStartedAt": "2026-05-06T03:31:00Z"
}
```

### `IErrorEvent`
```json
{
  "message": "It is not your turn",
  "code": "NOT_YOUR_TURN",
  "leagueId": "uuid"
}
```

---

## 4. Logic Flow: Pre-draft & Auto Pick

The system synchronizes your manual settings with the live draft engine:

1.  **Preparation**: Users use the **Pre-draft** UI to "wishlist" players and order them by priority (Drag & Drop).
2.  **Instant Pick**: If a user has the **Auto Pick Toggle** turned **ON**, the server processes their turn exactly **1 second** after it begins.
3.  **Engine Logic**:
    *   **Priority 1**: The engine checks the user's **Pre-draft** list and picks the highest-priority fighter that is still available.
    *   **Priority 2**: If the Pre-draft list is empty or exhausted, the engine picks the **Highest Ranked** fighter from the general available pool.
4.  **Pick Broadcast & Refresh**:
    *   Once a pick is finalized (Manual or Auto), the server broadcasts `draft:pick` or `draft:autopick`.
    *   **CRITICAL**: The server also broadcasts **`draft:refresh_fighters`**. 
    *   **Frontend Action**: Upon receiving `draft:refresh_fighters`, all clients must re-trigger the `GET /draft/:leagueId/fighters` API to update their "Available Fighters" view.
5.  **Timer Fallback**: If a user has Auto Pick **OFF** but the `secondsPerPick` timer expires:
    *   The engine performs an Auto Pick (following the priority above).
    *   The engine automatically sets the user's **Auto Pick Toggle to ON** for future rounds to prevent stalling.
    *   The user can manually toggle it back to **OFF** if they return to the draft.
