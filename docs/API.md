# InvoiceHub API Documentation

## Base URL

```
http://localhost:2020/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### Register

```http
POST /auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Inc."
}
```

**Response:** `201 Created`

```json
{
  "message": "Registration successful. Please check your email to set your password."
}
```

---

### Set Password

```http
POST /auth/set-password
```

**Request Body:**

```json
{
  "token": "verification_token_from_email",
  "password": "your_secure_password"
}
```

**Response:** `200 OK`

```json
{
  "message": "Password set successfully. You can now login."
}
```

---

### Login

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "your_password"
}
```

**Response:** `200 OK`

```json
{
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "company": "Acme Inc.",
      "isVerified": true
    },
    "token": "access_token",
    "accessToken": "access_token",
    "refreshToken": "refresh_token"
  }
}
```

---

### Refresh Token

```http
POST /auth/refresh-token
```

**Request Body:**

```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response:** `200 OK`

```json
{
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

### Logout

```http
POST /auth/logout
```

**Request Body:**

```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response:** `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

---

### Logout All Devices

```http
POST /auth/logout-all
```

_Requires Authentication_

**Response:** `200 OK`

```json
{
  "message": "Logged out from all devices successfully",
  "data": {
    "revokedSessions": 3
  }
}
```

---

### Get Profile

```http
GET /auth/me
```

_Requires Authentication_

**Response:** `200 OK`

```json
{
  "message": "Profile fetched successfully",
  "data": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "company": "Acme Inc."
  }
}
```

---

### Update Profile

```http
PUT /auth/me
```

_Requires Authentication_

**Request Body:**

```json
{
  "name": "John Updated",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

---

## Invoice Endpoints

### Create Invoice

```http
POST /invoices
```

_Requires Authentication_

**Request Body:**

```json
{
  "clientId": "client_uuid",
  "dueDate": "2025-02-01T00:00:00.000Z",
  "items": [
    {
      "description": "Web Development",
      "quantity": 10,
      "price": 150000,
      "productId": "optional_product_uuid"
    }
  ],
  "notes": "Thank you for your business",
  "isRecurring": false,
  "autoSendEmail": false
}
```

---

### List Invoices

```http
GET /invoices
```

_Requires Authentication_

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): DRAFT, SENT, PENDING, PAID, OVERDUE, CANCELLED
- `clientId` (optional): Filter by client
- `search` (optional): Search by invoice number

---

### Get Invoice

```http
GET /invoices/:id
```

_Requires Authentication_

---

### Update Invoice Status

```http
PATCH /invoices/:id/status
```

_Requires Authentication_

**Request Body:**

```json
{
  "status": "PAID"
}
```

---

### Send Invoice Email

```http
POST /invoices/:id/send
```

_Requires Authentication_

---

### Delete Invoice

```http
DELETE /invoices/:id
```

_Requires Authentication_

---

### Dashboard Stats

```http
GET /invoices/stats
```

_Requires Authentication_

---

### Chart Data

```http
GET /invoices/stats/chart
```

_Requires Authentication_

**Query Parameters:**

- `year` (optional): Year for chart data

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error message",
  "details": "Additional details if available"
}
```

**Common Status Codes:**

- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `500` - Internal Server Error

---

## Rate Limiting

Default limits:

- 100 requests per 15 minutes per IP

When exceeded:

```json
{
  "message": "Too many requests from this IP, please try again after 15 minutes"
}
```
