# Unified Event & Bout Management - Frontend Implementation Plan

This document provides a comprehensive guide for integrating the Event and Bout management system. The two modules are consolidated under a single `/event` API structure.

## Base URL
`/event`

---

## Data Types

### 1. Enums
- `EventStatus`: `'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'`

### 2. Core Interfaces
```typescript
export interface IEvent {
  id: string;
  name: string;
  location: string;
  date: string; // ISO String
  status: EventStatus;
  posterUrl: string | null;
  hasResults: boolean;
  bouts?: IBout[];
  _count?: { bouts: number };
}

export interface IBout {
  id: string;
  eventId: string;
  weightClass: string;
  rounds: number;
  isMainEvent: boolean;
  isCoMainEvent: boolean;
  boutFighters: { fighter: IFighter }[];
  outcome?: IBoutOutcome;
}

export interface IFighter {
  id: string;
  name: string;
  image?: string;
  // ... other fighter fields
}

export interface IBoutOutcome {
  id: string;
  winnerId: string;
  winPoint: boolean;
  finishBonus: boolean;
  winningChampionshipBout: boolean;
  championVsChampionWin: boolean;
  winningAgainstRankedOpponent: boolean;
  winningFiveRoundFight: boolean;
}
```

### 3. Request Payloads
```typescript
// For creating an event with an initial card
export interface ICreateEventPayload {
  name: string;
  location: string;
  date: string;
  bouts: {
    weightClass: string;
    rounds: number; // e.g., 3 or 5
    isMainEvent?: boolean;
    isCoMainEvent?: boolean;
    fighters: { fighterId: string }[];
  }[];
}

// For adding a single bout to an existing event
export interface ICreateBoutPayload {
  eventId: string;
  weightClass: string;
  rounds: number;
  isMainEvent?: boolean;
  isCoMainEvent?: boolean;
  fighters: { fighterId: string }[];
}

// For submitting a fight result
export interface IPostBoutResultPayload {
  winnerId: string;
  winPoint: boolean;
  finishBonus: boolean;
  winningChampionshipBout: boolean;
  championVsChampionWin: boolean;
  winningAgainstRankedOpponent: boolean;
  winningFiveRoundFight: boolean;
}
```

---

## Endpoints

### 1. Get All Events (Paginated)
- **URL:** `/event`
- **Method:** `GET`
- **Query Params:** `searchTerm`, `status`, `page`, `limit`, `sortBy`, `sortOrder`
- **Response Example:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "meta": { "page": 1, "limit": 10, "total": 1 },
    "data": [
      {
        "id": "event_id_123",
        "name": "UFC 300",
        "status": "UPCOMING",
        "_count": { "bouts": 12 }
      }
    ]
  }
}
```

### 2. Get Event Details
- **URL:** `/event/:id`
- **Method:** `GET`
- **Description:** Returns the full event details including all bouts, fighters, and outcomes (if available).
- **Note:** Bouts are returned ordered by their creation time.

### 3. Create Event (Admin)
- **URL:** `/event`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body (FormData):** 
  - `data`: JSON stringified `ICreateEventPayload`.
  - `image`: File (Event Poster).

### 4. Update Event (Admin)
- **URL:** `/event/:id`
- **Method:** `PATCH`
- **Body (FormData):** 
  - `data`: JSON stringified partial event fields.
  - `image`: Optional File update.

### 5. Add Bout to Event (Admin)
- **URL:** `/event/bout`
- **Method:** `POST`
- **Body:** `ICreateBoutPayload`

### 6. Post Bout Result (Admin)
- **URL:** `/event/bout/:id/result`
- **Method:** `PATCH`
- **Body:** `IPostBoutResultPayload`
- **Effect:** Calculates fantasy points for all applicable teams and automatically marks the Event as `COMPLETED` if this was the last result.

### 7. Delete Bout (Admin)
- **URL:** `/event/bout/:id`
- **Method:** `DELETE`

### 8. Delete Event (Admin)
- **URL:** `/event/:id`
- **Method:** `DELETE`

---

## Frontend Integration Tips

1.  **Ordering**: Bouts are ordered by `createdAt`. When creating an event, bouts are created sequentially, preserving your input order.
2.  **Scoring Control**: Use the 6 boolean toggles in your "Submit Result" modal. If a toggle is true, the system applies the league-specific point value for that category.
3.  **Automatic Status**: You don't need to manually mark an event as completed. Submitting the final bout result handles this automatically.
4.  **File Uploads**: Always use `FormData` for creating/updating events to handle the poster image.
