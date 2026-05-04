# System Module API Documentation

This document provides the endpoint specifications and data types for the System Management and System Scoring modules.

## 1. System Lockdown

### Get Lockdown Status
Returns the current lockdown state of the system.

- **Endpoint:** `/system/lockdown`
- **Method:** `GET`
- **Access:** Public
- **Response Type:** `TSystemLockdownResponse`

**Example Response:**
```json
{
  "success": true,
  "message": "Lockdown status retrieved",
  "data": {
    "isLocked": false,
    "lastResultUpdate": "2024-05-04T12:00:00.000Z"
  }
}
```

### Enable Lockdown
Blocks all roster and trade mutations.

- **Endpoint:** `/system/lockdown/enable`
- **Method:** `POST`
- **Access:** Admin
- **Response Type:** `TSystemStateResponse`

**Example Response:**
```json
{
  "success": true,
  "message": "Saturday Lockdown ENABLED",
  "data": {
    "id": 1,
    "isLocked": true,
    "lastResultUpdate": "2024-05-04T12:00:00.000Z"
  }
}
```

### Disable Lockdown
Re-opens the system for mutations.

- **Endpoint:** `/system/lockdown/disable`
- **Method:** `POST`
- **Access:** Admin
- **Response Type:** `TSystemStateResponse`

---

## 2. System Scoring

### Get Scoring Settings
Retrieves global default scoring settings.

- **Endpoint:** `/system-score`
- **Method:** `GET`
- **Access:** Admin
- **Response Type:** `TSystemScoringResponse`

**Example Response:**
```json
{
  "success": true,
  "message": "System scoring settings retrieved",
  "data": {
    "id": "cuid_123",
    "winPoint": 10,
    "finishBonus": 5,
    "winningChampionshipBout": 15,
    "championVsChampionWin": 20,
    "winningAgainstRankedOpponent": 5,
    "winningFiveRoundFight": 2,
    "createdAt": "2024-05-04T10:00:00.000Z",
    "updatedAt": "2024-05-04T10:00:00.000Z"
  }
}
```

### Upsert Scoring Settings
Updates or creates global scoring settings.

- **Endpoint:** `/system-score/upsert`
- **Method:** `POST`
- **Access:** Admin
- **Payload:** `Partial<TSystemScoringSetting>`
- **Response Type:** `TSystemScoringResponse`

---

## 3. TypeScript Definitions

```typescript
export type TSystemLockdownData = {
  isLocked: boolean;
  lastResultUpdate: string | null;
};

export type TSystemState = {
  id: number;
  isLocked: boolean;
  lastResultUpdate: string;
};

export type TSystemScoringSetting = {
  id: string;
  winPoint: number;
  finishBonus: number;
  winningChampionshipBout: number;
  championVsChampionWin: number;
  winningAgainstRankedOpponent: number;
  winningFiveRoundFight: number;
  createdAt: string;
  updatedAt: string;
};

// Generic API Response Wrapper
export type TApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type TSystemLockdownResponse = TApiResponse<TSystemLockdownData>;
export type TSystemStateResponse = TApiResponse<TSystemState>;
export type TSystemScoringResponse = TApiResponse<TSystemScoringSetting>;
```
