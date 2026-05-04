# Fighter Module API Specification

Base URL: `http://localhost:5000/api/v1`

---

## 1. Data Models (TypeScript)

```typescript
export interface IFighter {
  id: string;
  name: string;
  nickname: string;
  nationality: string;
  divisionId: string;
  rank: number | null;
  wins: number;
  losses: number;
  draws: number;
  avgL5: number;      // Average points in last 5 fights
  bio: string | null;
  avatarUrl: string | null;
  age: number | null;
  height: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  division?: {
    id: string;
    name: string;
  };
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface IFighterResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IFighter;
}

export interface IFighterListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    meta: IPaginationMeta;
    data: IFighter[];
  };
}
```

---

## 2. API Endpoints

### A. List Fighters
`GET /fighter`

**Query Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `searchTerm` | string | Search by name, nickname, or nationality |
| `divisionId` | string | Filter by Division ID |
| `isActive` | boolean | Filter by active/inactive status |
| `nationality` | string | Filter by specific country |
| `minRank` | number | Minimum rank (e.g., 1) |
| `maxRank` | number | Maximum rank (e.g., 15) |
| `page` | number | Page number (Default: 1) |
| `limit` | number | Items per page (Default: 10) |
| `sortBy` | string | Field to sort by (Default: `rank`) |
| `sortOrder` | `asc` \| `desc`| Sort direction (Default: `asc`) |

---

### B. Create Fighter
`POST /fighter` (Admin Only)

**Request Type:** `multipart/form-data`

**Body Fields:**
- `data`: (Stringified JSON)
  ```json
  {
    "name": "Israel Adesanya",
    "nickname": "The Last Stylebender",
    "nationality": "Nigeria",
    "divisionId": "clxyz...",
    "rank": 2,
    "wins": 24,
    "losses": 3,
    "draws": 0,
    "avgL5": 82,
    "bio": "Middleweight elite fighter.",
    "age": 34,
    "height": "6'4\"",
    "isActive": true
  }
  ```
- `image`: (File) Avatar image upload.

---

### C. Update Fighter
`PATCH /fighter/:id` (Admin Only)

**Request Type:** `multipart/form-data`

**Body Fields:**
- `data`: (Stringified JSON) Any partial fields from the Create payload.
- `image`: (File) New avatar image upload.

---

### D. Get Fighter Details
`GET /fighter/:id`

**Response:**
Returns `IFighterResponse`. Includes `division` and `boutFighters` (bout history).

---

### E. Deactivate Fighter
`DELETE /fighter/:id` (Admin Only)

**Description:**
Performs a soft delete by setting `isActive` to `false`.

---

## 3. Error Codes

| Status | Description |
| :--- | :--- |
| `400` | Validation Error (Check message for field details) |
| `401` | Unauthorized (Missing or invalid token) |
| `403` | Forbidden (User is not an Admin) |
| `404` | Fighter Not Found |
