# Division Module: Frontend API Documentation

This document provides the technical specifications for integrating the Division module into the frontend.

## 1. Shared Types & Responses

All endpoints return a standardized response structure.

```typescript
export interface IApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: T;
}

export interface IDivision {
  id: string;
  name: string;
  _count?: {
    fighters: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. API Endpoints

### A. List Divisions (Management Page)
Used for the main division listing table with search and pagination.

- **Endpoint**: `GET /division`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `searchTerm`: Filter by name
- **Response Example**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Divisions retrieved successfully",
  "meta": { "page": 1, "limit": 10, "total": 12, "totalPage": 2 },
  "data": [
    {
      "id": "cl...",
      "name": "Lightweight",
      "_count": { "fighters": 15 }
    }
  ]
}
```

### B. Create Division
- **Endpoint**: `POST /division`
- **Method**: `POST`
- **Body**:
```json
{
  "name": "Flyweight"
}
```
- **Response Example**: `201 Created` with the new division object.

### C. Update Division
- **Endpoint**: `PATCH /division/:id`
- **Method**: `PATCH`
- **Body**:
```json
{
  "name": "New Name"
}
```
- **Response Example**: `200 OK` with the updated division object.

### D. Division Dropdown (Search/Filters)
To populate dropdowns, use the list endpoint with a higher limit or without search terms.

- **Endpoint**: `GET /division?limit=100`
- **Workflow**:
  1. Fetch all divisions.
  2. Map the `data` array to your select options: `{ label: d.name, value: d.id }`.

---

## 3. Workflow Implementation

### 1. Division List Page Workflow
1.  **Initial Load**: Fetch `GET /division?page=1&limit=10`.
2.  **Search**: When user types in search bar, update `searchTerm` query param (debounced).
3.  **Pagination**: When user clicks "Next/Prev", update `page` query param and re-fetch.
4.  **Display**: Show `name` and `_count.fighters` in the table.

### 2. Create/Edit Workflow (Modal)
1.  **Opening Modal**: If editing, fetch `GET /division/:id` or use data from the row.
2.  **Submission**: Call `POST` or `PATCH` endpoint.
3.  **Refresh**: On success (`statusCode: 200/201`), close modal and re-validate the list query (e.g., `queryClient.invalidateQueries(['divisions'])`).
4.  **Error Handling**: If `statusCode: 400` is returned (e.g., "Division already exists"), show a toast notification.

### 3. Delete Workflow
1.  **Confirmation**: Show a "Are you sure?" modal.
2.  **Constraint Check**: If the table shows `_count.fighters > 0`, disable the delete button or show a warning that divisions with fighters cannot be deleted.
3.  **Execution**: Call `DELETE /division/:id`.
4.  **Refresh**: On success, refresh the list.
