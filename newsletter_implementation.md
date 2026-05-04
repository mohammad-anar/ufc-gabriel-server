# Newsletter Module - Frontend Implementation Plan

This document outlines the API integration for the Newsletter module. This module uses `multipart/form-data` for creating and updating newsletters with images.

## Base URL
`/newsletter`

## Data Types

```typescript
export interface INewsletter {
  id: string;
  title: string;
  description: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface INewsletterResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: INewsletter;
}

export interface INewsletterListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    meta: IMeta;
    data: INewsletter[];
  };
}
```

## Endpoints

### 1. Create Newsletter (Admin Only)
Creates a new newsletter with an optional header image. Use `FormData` to send the request.

- **URL:** `/newsletter`
- **Method:** `POST`
- **Auth Required:** Yes (Role: `ADMIN`)
- **Content-Type:** `multipart/form-data`
- **Request Body (FormData):**
  - `data`: A JSON stringified object containing `title` and `description`.
  - `image`: File object (optional).

```javascript
// Example Frontend Implementation
const formData = new FormData();
formData.append('data', JSON.stringify({
  title: 'UFC 300: Main Event Confirmed',
  description: 'Alex Pereira will defend his title against Jamahal Hill...'
}));
if (imageFile) {
  formData.append('image', imageFile);
}

const response = await axios.post('/newsletter', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

- **Success Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Newsletter created successfully",
  "data": {
    "id": "cm3a1b2c3d4e5f6g7h8i9j0",
    "title": "UFC 300: Main Event Confirmed",
    "description": "...",
    "image": "/uploads/newsletter-1712345678.jpg",
    "createdAt": "2024-05-04T12:00:00Z",
    "updatedAt": "2024-05-04T12:00:00Z"
  }
}
```

---

### 2. Get All Newsletters
Fetches a paginated list of newsletters. Supports searching by title or description.

- **URL:** `/newsletter`
- **Method:** `GET`
- **Auth Required:** No
- **Query Parameters:**
  - `searchTerm` (string): Search in title/description.
  - `page` (number): Default 1.
  - `limit` (number): Default 10.
  - `sortBy` (string): Default `createdAt`.
  - `sortOrder` (string): `asc` or `desc` (default `desc`).

- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Newsletters retrieved successfully",
  "data": {
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPage": 5
    },
    "data": [
      {
        "id": "...",
        "title": "...",
        "description": "...",
        "image": "...",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

### 3. Get Newsletter By ID
Fetches details of a specific newsletter.

- **URL:** `/newsletter/:id`
- **Method:** `GET`
- **Auth Required:** No

- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Newsletter retrieved successfully",
  "data": {
    "id": "...",
    "title": "...",
    "description": "...",
    "image": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 4. Update Newsletter (Admin Only)
Updates an existing newsletter. Use `FormData` for partial updates.

- **URL:** `/newsletter/:id`
- **Method:** `PATCH`
- **Auth Required:** Yes (Role: `ADMIN`)
- **Content-Type:** `multipart/form-data`
- **Request Body (FormData):**
  - `data`: A JSON stringified object (partial updates allowed).
  - `image`: New file object (optional).

- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Newsletter updated successfully",
  "data": {
    "id": "...",
    "title": "Updated Title",
    "description": "...",
    "image": "...",
    "updatedAt": "..."
  }
}
```

---

### 5. Delete Newsletter (Admin Only)
Removes a newsletter from the system.

- **URL:** `/newsletter/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes (Role: `ADMIN`)

- **Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Newsletter deleted successfully",
  "data": {
    "id": "...",
    "title": "...",
    "deletedAt": "..."
  }
}
```
