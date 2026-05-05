# Contact Module - Frontend Implementation Plan

This document outlines the API integration for the Contact Form module, allowing users to send messages directly to the system administrators.

## Base URL
`/contact`

## Data Types

```typescript
export interface IContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface IContactResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    message: string;
  };
}
```

---

## Endpoints

### 1. Send Contact Message
Submits the contact form data to the backend, which then sends an email to the admin.

- **URL:** `/contact`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "subject": "Question about Fantasy Points",
  "message": "Hello, I have a question regarding how points are calculated for submission wins..."
}
```

- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Your message has been sent successfully!",
  "data": {
    "message": "Email sent successfully"
  }
}
```

---

## Frontend Integration Tips

- **Validation**: Ensure that all fields are filled and the email format is valid before sending the request.
- **Feedback**: Show a success toast or message after the response is received to let the user know their message is on its way.
- **Loading State**: Disable the "Submit" button while the request is in progress to prevent multiple submissions.
