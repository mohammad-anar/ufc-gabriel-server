# Draft System - Implementation Plan

This document provides a comprehensive guide for implementing the live drafting system on the frontend. The draft uses a "Snake Order" logic and real-time Socket.IO communication.

## Core Concepts

1.  **Snake Order**: Rounds alternate order. Round 1 is 1-8, Round 2 is 8-1, Round 3 is 1-8, and so on.
2.  **On the Clock**: Only one team can pick at a time. A timer is associated with each pick.
3.  **Auto-Pick**: If a user's timer expires, the system picks the best available fighter.
4.  **Optimistic Locking**: The `version` field in the draft session prevents race conditions (e.g., two people picking the same fighter simultaneously).

---

## 1. Socket.IO Events

### Client -> Server (Emits)
- `register`: `userId: string` — Link socket to user.
- `join_draft`: `leagueId: string` — Join the draft room.
- `make_pick`: `{ leagueId: string, fighterId: string }` — Submit a pick.

### Server -> Client (Listeners)
- `draft:sync`: `IDraftSession` — Full state on join.
- `draft:started`: Emitted when the draft begins.
- `draft:pick`: Emitted on successful pick (Manual or Auto).
- `draft:completed`: Emitted when all roster spots are filled.
- `draft:error`: Emitted on validation failure.

---

## 2. API Endpoints (REST)

### Get Draft State
- **URL**: `GET /draft/:leagueId`
- **Response**: `IDraftSession`

### Get Available Fighters
- **URL**: `GET /draft/:leagueId/fighters`
- **Params**: `searchTerm`, `divisionId`, `page`, `limit`.
- **Note**: Only returns fighters not already picked in this session.

### Start Draft (Manager)
- **URL**: `POST /draft/:leagueId/start`

---

## 3. Data Structures

```typescript
export type DraftStatus = 'WAITING' | 'DRAFTING' | 'COMPLETED';

export interface IDraftSession {
  id: string;
  leagueId: string;
  status: DraftStatus;
  currentRound: number;
  currentPickIndex: number;
  secondsPerPick: number;
  totalRounds: number;
  turnStartedAt: string | null; // ISO string to sync timer
  draftOrder: IDraftOrder[];
  draftPicks: IDraftPick[];
}

export interface IDraftOrder {
  teamId: string;
  round: number;
  pickPosition: number;
  overallPick: number;
  team: {
    name: string;
    owner: { name: string; avatarUrl: string };
  };
}

export interface IDraftPick {
  fighter: any;
  team: { name: string };
  round: number;
  pickNumber: number;
}
```

---

## 4. Frontend Integration Workflow

1.  **Initialize Socket**: Connect and emit `register` followed by `join_draft`.
2.  **Timer Sync**: Use `turnStartedAt` and `secondsPerPick` to create a local countdown.
3.  **Active Turn**: If the `currentPick.team.ownerId` matches the logged-in user, enable the fighter selection UI.
4.  **Pick Submission**: Emit `make_pick`. The server will validate the turn and availability.
5.  **Snake Logic**: Note that the "Next Team" in the UI will follow the `overallPick` sequence in `draftOrder`.
