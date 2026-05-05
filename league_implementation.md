# League Module - Frontend Implementation Plan

This document outlines the API integration for the League module. It covers league creation, joining, management, and administrative dashboards.

## Base URL
`/league`

---

## 1. Shared Data Structures

### Response Wrapper (Paginated)
```typescript
export interface IPaginatedResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: T[];
}
```

### Core Interface: `ILeague`
```typescript
export interface ILeague {
  id: string;
  name: string;
  code: string;
  passcode: string | null;
  managerId: string;
  memberLimit: number;
  rosterSize: number;
  status: 'DRAFTING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  draftTime: string | null;
  isSystemGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations (Included in Admin/Detail views)
  manager?: { id: string; name: string; avatarUrl: string };
  scoringSettings?: IScoringSettings;
  teams?: ITeam[];
  _count?: { members: number; teams: number };
}
```

---

## 2. Endpoints

### A. Get All Leagues (Public Browse)
Fetches active, non-archived leagues. Passcodes are masked.
- **URL**: `/league`
- **Method**: `GET`
- **Searching**: `searchTerm` (Matches `name` or `code`)
- **Filtering**:
    - `leagueType`: `PUBLIC` | `PRIVATE`
    - `status`: `DRAFTING` | `ACTIVE`
- **Sorting**: `sortBy`, `sortOrder` (asc/desc)
- **Pagination**: `page`, `limit`

### B. Get My Leagues
Leagues the user is participating in.
- **URL**: `/league/my/leagues`
- **Method**: `GET`

### C. Admin: Full League List
Comprehensive dashboard for Admins. No masking.
- **URL**: `/league/admin/all`
- **Method**: `GET`
- **Searching**: `searchTerm` (Matches `name` or `code`)
- **Filtering**:
    - `leagueType`: `PUBLIC` | `PRIVATE`
    - `status`: `DRAFTING` | `ACTIVE` | `COMPLETED` | `ARCHIVED`
    - `managerId`: Filter by creator UUID
    - `isSystemGenerated`: `true` | `false`
    - `code`: Exact match for invite code
- **Sorting/Pagination**: Supported same as public list.

---

## 3. Roster & Team Actions

### Join League
- **URL**: `/league/join`
- **Method**: `POST`
- **Body**: `{ code: string, teamName: string, passcode?: string }`

### Leave League / Delete Team
- **URL**: `/league/:id/leave`
- **Method**: `POST`
- **Note**: Dissolves the league if called by the Manager.

### Add/Remove Fighters (Active Roster)
- **POST** `/league/:id/add-fighter` — `{ fighterId: string }`
- **POST** `/league/:id/remove-fighter` — `{ fighterId: string }`

---

## 4. Technical Integration Notes

1.  **Boolean Query Params**: When filtering by `isSystemGenerated`, the frontend should send strings `"true"` or `"false"`. The backend parses these into native booleans.
2.  **Archived State**: Standard users will **not** see leagues in `ARCHIVED` status. Admins can see all statuses.
3.  **Snake Draft**: Once a league status moves to `DRAFTING`, the Socket.IO events defined in `drafting_implementation.md` should be used.

---

## 5. Admin Dashboard: Get All Leagues

This endpoint provides the administrative view of all leagues with full relational data and no security masking (passcodes are visible).

### API Specification
- **URL**: `/league/admin/all`
- **Method**: `GET`
- **Auth Required**: Yes (Admin Role)

### Searching & Filtering Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `searchTerm` | `string` | Scans `name` and `code` (case-insensitive partial match). |
| `status` | `enum` | `DRAFTING`, `ACTIVE`, `COMPLETED`, `ARCHIVED`. |
| `leagueType` | `enum` | `PUBLIC` (no passcode) or `PRIVATE` (has passcode). |
| `managerId` | `string` | Filter by the UUID of the league manager. |
| `isSystemGenerated` | `boolean` | Filter by system-official vs user-created leagues. |
| `code` | `string` | Exact match for an invite code. |

### Sorting & Pagination
- `page`, `limit`: Standard pagination.
- `sortBy`, `sortOrder`: Supports any field in the `League` model.

### Response Type
```typescript
{
  "success": true,
  "statusCode": 200,
  "message": "Admin leagues retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPage": 5
  },
  "data": [
    {
      "id": "uuid",
      "name": "Japan Elite League",
      "code": "JPN-123",
      "passcode": "8888", // Visible to Admin
      "managerId": "user_uuid",
      "status": "DRAFTING",
      "isSystemGenerated": false,
      "manager": { "id": "...", "name": "...", "avatarUrl": "..." },
      "scoringSettings": { ... },
      "teams": [
        {
          "id": "...",
          "name": "Tokyo Tigers",
          "owner": { "id": "...", "name": "..." },
          "_count": { "teamFighters": 5 }
        }
      ],
      "draftSession": { "status": "WAITING", ... },
      "_count": { "members": 5, "teams": 5 },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

