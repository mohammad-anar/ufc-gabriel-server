# Frontend Implementation Guide: Full Auth API

This document provides a comprehensive guide for implementing the Authentication and User Management module in the frontend. It includes detailed API routes, request/response structures, and the complete authentication workflow.

## 1. General Configuration

- **Base URL:** `http://localhost:5000/api/v1`
- **Global Headers:**
  - `Accept: application/json`
  - `Authorization: <accessToken>` (Required for protected routes)

---

## 2. Authentication Workflow

### A. Registration & Verification Flow
1. **Register**: User submits the registration form (with optional avatar).
2. **OTP Sent**: Server saves user data and sends an OTP to the user's email.
3. **Verify**: User enters the OTP received in their email.
4. **Auto-Login**: On successful verification, the server returns JWT tokens.

### B. Login Flow
1. **Login**: User submits email and password.
2. **Tokens**: Server returns `accessToken`, `refreshToken`, and user details.
3. **Persistence**: Store `accessToken` in memory/state and `refreshToken` in an HTTP-only cookie (handled by the server).

### C. Forgot Password Flow
1. **Request Reset**: User submits their email via `/auth/forget-password`.
2. **Email Sent**: Server sends a password reset link containing a short-lived JWT.
3. **Frontend Landing**: The link points to `https://your-app.com/reset-password?token=<JWT>`.
4. **Reset**: Frontend extracts the token, puts it in the `Authorization` header, and submits the new password to `/auth/reset-password`.

---

## 3. API Route Details

### 1. Register User
- **Route:** `POST /auth/register`
- **Headers:** `Content-Type: multipart/form-data`
- **Body (FormData):**
  - `data`: JSON stringified object
    ```json
    {
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "password": "Password123!",
      "phone": "1234567890",
      "bio": "MMA Enthusiast"
    }
    ```
  - `image`: File (Binary, Optional)
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Registration successful! Please verify your email.",
    "data": { "id": "...", "email": "...", "isVerified": false, ... }
  }
  ```

### 2. Login
- **Route:** `POST /auth/login`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "user": { "id": "...", "name": "...", "role": "USER", ... }
    }
  }
  ```

### 3. Verify Email (OTP)
- **Route:** `POST /auth/verify-email`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "otp": "123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Email verified successfully",
    "data": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
  ```

### 4. Resend OTP
- **Route:** `POST /auth/resend-otp`
- **Body:** `{ "email": "john@example.com" }`
- **Response:** `{ "success": true, "message": "OTP resent successfully" }`

### 5. Forgot Password
- **Route:** `POST /auth/forget-password`
- **Body:** `{ "email": "john@example.com" }`
- **Response:** `{ "success": true, "message": "Password reset link sent to your email" }`

### 6. Reset Password
- **Route:** `POST /auth/reset-password`
- **Headers:** `Authorization: <Token from Email Link>`
- **Body:** `{ "password": "NewStrongPassword123!" }`
- **Response:** `{ "success": true, "message": "Password reset successfully" }`

### 7. Change Password (Authenticated)
- **Route:** `POST /auth/change-password`
- **Headers:** `Authorization: <accessToken>`
- **Body:**
  ```json
  {
    "oldPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **Response:** `{ "success": true, "message": "Password changed successfully" }`

### 8. Refresh Token
- **Route:** `POST /auth/refresh`
- **Headers:** `Authorization: <accessToken>` (Used to identify user)
- **Response:** Returns new `accessToken` and `refreshToken`.

### 9. Get My Profile
- **Route:** `GET /auth/me`
- **Headers:** `Authorization: <accessToken>`
- **Response:** Returns full `IUser` object in `data`.

### 10. Update Profile
- **Route:** `PATCH /auth/me`
- **Headers:** `Authorization: <accessToken>`, `Content-Type: multipart/form-data`
- **Body (FormData):**
  - `data`: JSON stringified object (any partial user fields)
  - `image`: File (Binary, Optional)

---

## 4. TypeScript Interfaces

```typescript
export interface IUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}
```

## 5. Implementation Tips

- **Axios Interceptors**: Use interceptors to automatically attach the `Authorization` header and handle 401 errors by calling `/auth/refresh`.
- **Form Data**: Remember that when using `multipart/form-data`, you must JSON stringify the `data` field.
- **Error Handling**: The server returns errors in the format `{ "success": false, "message": "Error description" }`.
