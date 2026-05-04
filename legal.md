# Legal Module - Frontend Implementation Guide

This document provides the necessary information for integrating the Legal module into the frontend. The module handles legal documents such as Privacy Policy and Terms and Conditions.

## Base URL
`/legal`

## Data Types

```typescript
export interface ILegalDocument {
  id: string;
  type: string; // e.g., 'PRIVACY_POLICY', 'TERMS_AND_CONDITIONS'
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILegalResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ILegalDocument;
}

export interface ILegalListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ILegalDocument[];
}
```

---

## Endpoints

### 1. Create or Update Legal Document
Allows an administrator to create a new legal document or update an existing one based on the `type`.

- **URL:** `/`
- **Method:** `POST`
- **Auth Required:** Yes (Role: `ADMIN`)
- **Request Body:**
```json
{
  "type": "PRIVACY_POLICY",
  "content": "<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>"
}
```

- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Legal document updated successfully",
  "data": {
    "id": "cm3a1b2c3d4e5f6g7h8i9j0",
    "type": "PRIVACY_POLICY",
    "content": "<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>",
    "createdAt": "2024-05-04T12:00:00.000Z",
    "updatedAt": "2024-05-04T12:30:00.000Z"
  }
}
```

---

### 2. Get Legal Document by Type
Fetches a specific legal document by its type.

- **URL:** `/:type`
- **Method:** `GET`
- **Auth Required:** No
- **URL Parameters:** `type` (e.g., `PRIVACY_POLICY`, `TERMS_AND_CONDITIONS`)

- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Legal document fetched successfully",
  "data": {
    "id": "cm3a1b2c3d4e5f6g7h8i9j0",
    "type": "PRIVACY_POLICY",
    "content": "<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>",
    "createdAt": "2024-05-04T12:00:00.000Z",
    "updatedAt": "2024-05-04T12:30:00.000Z"
  }
}
```

- **Error Response:**
  - **Code:** 404 NOT FOUND
  - **Content:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Document not found"
}
```

---

### 3. Get All Legal Documents
Fetches all existing legal documents.

- **URL:** `/`
- **Method:** `GET`
- **Auth Required:** No

- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "All legal documents fetched successfully",
  "data": [
    {
      "id": "cm3a1b2c3d4e5f6g7h8i9j0",
      "type": "PRIVACY_POLICY",
      "content": "...",
      "createdAt": "2024-05-04T12:00:00.000Z",
      "updatedAt": "2024-05-04T12:30:00.000Z"
    },
    {
      "id": "cm4a1b2c3d4e5f6g7h8i9j1",
      "type": "TERMS_AND_CONDITIONS",
      "content": "...",
      "createdAt": "2024-05-04T12:10:00.000Z",
      "updatedAt": "2024-05-04T12:40:00.000Z"
    }
  ]
}
```
