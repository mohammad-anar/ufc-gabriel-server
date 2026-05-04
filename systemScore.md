# System Scoring Implementation Plan

This document outlines the implementation for the System Scoring System, which allows administrators to manage global scoring rules that can be synchronized with individual leagues.

## Backend Architecture

### 1. Database Model (Prisma)
- **Model Name**: `SystemScoringSetting`
- **Fields**:
  - `id`: String (CUID)
  - `winPoint`: Int (Default: 1)
  - `finishBonus`: Int (Default: 1)
  - `winningChampionshipBout`: Int (Default: 1)
  - `championVsChampionWin`: Int (Default: 1)
  - `winningAgainstRankedOpponent`: Int (Default: 1)
  - `winningFiveRoundFight`: Int (Default: 1)
- **Relation**: Linked to `LeagueScoringSettings` via `systemScoringSettingId`.

### 2. API Endpoints

#### Get System Scoring Settings
- **Endpoint**: `GET /api/v1/system-score`
- **Description**: Retrieves the current global scoring settings.
- **Response Type**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    id: string;
    winPoint: number;
    finishBonus: number;
    winningChampionshipBout: number;
    championVsChampionWin: number;
    winningAgainstRankedOpponent: number;
    winningFiveRoundFight: number;
    createdAt: string;
    updatedAt: string;
  } | null;
}
```

#### Upsert System Scoring Settings
- **Endpoint**: `POST /api/v1/system-score/upsert`
- **Description**: Creates or updates the global scoring settings.
- **Payload**:
```typescript
{
  winPoint?: number;
  finishBonus?: number;
  winningChampionshipBout?: number;
  championVsChampionWin?: number;
  winningAgainstRankedOpponent?: number;
  winningFiveRoundFight?: number;
}
```
- **Response Type**: Same as GET, returns the updated object.

---

## Frontend Implementation

### 1. Admin Dashboard Page
- **Route**: `/admin/settings/scoring`
- **Components**:
  - **Scoring Cards**: Individual cards for each point type (as shown in the provided image).
    - `Win Point`: Base points for a victory.
    - `Finish Bonus`: Extra points for KO/TKO/SUB/DQ.
    - `Winning Championship Bout`: Extra points for title fights.
    - `Champion vs Champion Win`: Bonus for champ-champ victories.
    - `Winning Against Ranked Opponent`: Bonus for defeating ranked fighters.
    - `Winning a 5 Round Fight`: Bonus for 5-round bout victories.
  - **Live Scoring Preview**: A side panel that shows how points accumulate in different scenarios (e.g., "Stoppage Victory", "Champion vs Champion").
  - **Action Buttons**:
    - `Reset to Default`: Resets values to system defaults.
    - `Save Settings`: Triggers the `/upsert` API call.

### 2. Scenario Preview Logic
Implement a local state that calculates the `Total Fantasy Points` for each scenario dynamically as the user modifies the input fields.

**Example Calculation**:
- **Scenario: Ranked 5-Round Win**
  - Base Win (`winPoint`)
  - Ranked Opponent Bonus (`winningAgainstRankedOpponent`)
  - 5 Round Win Bonus (`winningFiveRoundFight`)
  - **Total** = sum of above.

### 3. Integration with Leagues
When an admin completes a bout or selects a winner:
1. The system can fetch the `SystemScoringSetting`.
2. Apply these points to the `LeagueScoringSettings` of the affected leagues.
3. Use the `bout.scoring.ts` logic to calculate and save scores for all teams involved.

## Response Example (JSON)
```json
{
  "success": true,
  "message": "System scoring settings updated successfully",
  "data": {
    "id": "cm0w1x2y3z4a5b6c7d8e9f",
    "winPoint": 1,
    "finishBonus": 1,
    "winningChampionshipBout": 1,
    "championVsChampionWin": 1,
    "winningAgainstRankedOpponent": 1,
    "winningFiveRoundFight": 1,
    "createdAt": "2026-05-05T00:46:40.000Z",
    "updatedAt": "2026-05-05T00:48:40.000Z"
  }
}
```
