# Signify API Documentation

## Overview
Signify is a full-stack web application with a React frontend and Node.js/Express backend. The backend provides authentication and user management services through RESTful API endpoints.

**Base URL:** `http://localhost:5000`

---

## Authentication

The API uses JWT (JSON Web Token) for authentication. Tokens are issued upon successful login and should be included in the `Authorization` header for protected endpoints.

**Token Format:** `Bearer <token>`
**Token Expiration:** 24 hours

---

## Endpoints

### 1. Health Check
**Endpoint:** `GET /`

**Description:** Verify that the backend server is running and operational.

**Response:**
```
Status: 200 OK
Body: "Signify backend is working"
```

---

### 2. User Registration
**Endpoint:** `POST /register`

**Description:** Register a new user account. Email must be unique.

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "address": "string",
  "email": "string (unique)",
  "password": "string"
}
```

**Success Response:**
```
Status: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "id": "ObjectId",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Email already registered
  ```json
  {
    "message": "Email already registered"
  }
  ```
- **500 Internal Server Error**
  ```json
  {
    "message": "Something went wrong",
    "error": "error message"
  }
  ```

---

### 3. User Login
**Endpoint:** `POST /login`

**Description:** Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response:**
```
Status: 200 OK
{
  "message": "Login successful",
  "token": "JWT token string",
  "user": {
    "id": "ObjectId",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
}
```

**Error Responses:**
- **401 Unauthorized** - Invalid credentials
  ```json
  {
    "message": "Invalid email or password"
  }
  ```
- **500 Internal Server Error**
  ```json
  {
    "message": "Something went wrong",
    "error": "error message"
  }
  ```

---

### 4. Save User Signature
**Endpoint:** `POST /api/users/signature`

**Description:** Save or update user's signature and initials. Creates new signature if user doesn't have one, updates existing signature otherwise.

**Authentication:** Required (Bearer token in Authorization header)

**Request Body:**
```json
{
  "signature": {
    "type": "drawn|premade",
    "signature": "base64 string or SVG data",
    "initials": "base64 string or SVG data"
  }
}
```

**Success Response:**
```
Status: 200 OK
{
  "message": "Signature saved successfully",
  "user": {
    "id": "ObjectId",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "signature": {
      "_id": "ObjectId",
      "userId": "ObjectId",
      "type": "drawn|premade",
      "signature": "data",
      "initials": "data",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request** - Missing or invalid signature data
- **401 Unauthorized** - Invalid or missing token
- **500 Internal Server Error**

---

### 5. Get Overview Statistics
**Endpoint:** `GET /api/overview/stats`

**Description:** Retrieve dashboard statistics including document counts, completion rates, and shared document information.

**Authentication:** Required (Bearer token in Authorization header)

**Query Parameters:** None

**Success Response:**
```
Status: 200 OK
{
  "message": "Overview statistics retrieved successfully",
  "data": {
    "totalDocuments": 15,
    "totalSignatures": 1,
    "sharedDocuments": 3,
    "completionRate": 60
  }
}
```

**Error Responses:**
- **401 Unauthorized** - Invalid or missing token
- **500 Internal Server Error**

---

### 6. Get Recent Documents
**Endpoint:** `GET /api/documents/recent`

**Description:** Retrieve user's most recently modified documents.

**Authentication:** Required (Bearer token in Authorization header)

**Query Parameters:**
- `limit` (optional): Number of documents to retrieve. Default: 5

**Success Response:**
```
Status: 200 OK
{
  "message": "Recent documents retrieved successfully",
  "data": [
    {
      "_id": "ObjectId",
      "name": "string",
      "fileName": "string",
      "status": "draft|pending|signed|rejected",
      "modifiedAt": "ISO date",
      "createdAt": "ISO date",
      "uploadedAt": "ISO date"
    }
  ]
}
```

**Error Responses:**
- **401 Unauthorized** - Invalid or missing token
- **500 Internal Server Error**

---

### 7. Get Activity Log
**Endpoint:** `GET /api/activity`

**Description:** Retrieve user's activity history and logs.

**Authentication:** Required (Bearer token in Authorization header)

**Query Parameters:**
- `limit` (optional): Number of activities to retrieve. Default: 10

**Success Response:**
```
Status: 200 OK
{
  "message": "Activity log retrieved successfully",
  "data": [
    {
      "_id": "ObjectId",
      "type": "document_uploaded|document_signed|signature_created|document_shared|action_required",
      "title": "string",
      "description": "string",
      "details": "string",
      "timestamp": "ISO date",
      "createdAt": "ISO date",
      "relatedDocumentId": "ObjectId"
    }
  ]
}
```

**Error Responses:**
- **401 Unauthorized** - Invalid or missing token
- **500 Internal Server Error**

---

### 8. Upload Document
**Endpoint:** `POST /api/documents/upload`

**Description:** Upload a new document to the system.

**Authentication:** Required (Bearer token in Authorization header)

**Request Body:**
```json
{
  "name": "string",
  "fileName": "string",
  "fileType": "string (optional, default: pdf)",
  "size": "number (optional)"
}
```

**Success Response:**
```
Status: 201 Created
{
  "message": "Document uploaded successfully",
  "data": {
    "_id": "ObjectId",
    "userId": "ObjectId",
    "name": "string",
    "fileName": "string",
    "fileType": "pdf",
    "size": 0,
    "status": "draft",
    "uploadedAt": "ISO date",
    "modifiedAt": "ISO date",
    "createdAt": "ISO date",
    "sharedWith": []
  }
}
```

**Error Responses:**
- **400 Bad Request** - Missing name or fileName
- **401 Unauthorized** - Invalid or missing token
- **500 Internal Server Error**

---

### 9. Share Document
**Endpoint:** `POST /api/documents/:documentId/share`

**Description:** Share a document with another user by their email address.

**Authentication:** Required (Bearer token in Authorization header)

**URL Parameters:**
- `documentId`: MongoDB ObjectId of the document

**Request Body:**
```json
{
  "shareWithEmail": "string (email of recipient)"
}
```

**Success Response:**
```
Status: 200 OK
{
  "message": "Document shared successfully",
  "data": {
    "_id": "ObjectId",
    "userId": "ObjectId",
    "name": "string",
    "fileName": "string",
    "status": "draft",
    "sharedWith": ["ObjectId", "ObjectId"]
  }
}
```

**Error Responses:**
- **400 Bad Request** - Missing email
- **401 Unauthorized** - Invalid or missing token
- **404 Not Found** - User with email not found
- **500 Internal Server Error**

---

### 10. Update Document Status
**Endpoint:** `PATCH /api/documents/:documentId/status`

**Description:** Update the status of a document.

**Authentication:** Required (Bearer token in Authorization header)

**URL Parameters:**
- `documentId`: MongoDB ObjectId of the document

**Request Body:**
```json
{
  "status": "draft|pending|signed|rejected"
}
```

**Success Response:**
```
Status: 200 OK
{
  "message": "Document status updated successfully",
  "data": {
    "_id": "ObjectId",
    "userId": "ObjectId",
    "name": "string",
    "fileName": "string",
    "status": "signed",
    "modifiedAt": "ISO date"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid status value
- **401 Unauthorized** - Invalid or missing token
- **500 Internal Server Error**

---

### 11. Update Document Metadata
**Endpoint:** `PATCH /api/documents/:documentId/update`

**Description:** Update document metadata including name, status, and description notes.

**Authentication:** Required (Bearer token in Authorization header)

**URL Parameters:**
- `documentId`: MongoDB ObjectId of the document

**Request Body:**
```json
{
  "name": "string (required)",
  "status": "draft|pending|signed|rejected (optional)",
  "description": "string (optional, max 500 chars)"
}
```

**Success Response:**
```
Status: 200 OK
{
  "message": "Document updated successfully",
  "data": {
    "_id": "ObjectId",
    "userId": "ObjectId",
    "name": "Updated Document Name",
    "fileName": "string",
    "status": "pending",
    "description": "Added notes here",
    "uploadedAt": "ISO date",
    "modifiedAt": "ISO date",
    "createdAt": "ISO date"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Missing document name
- **401 Unauthorized** - Invalid or missing token
- **404 Not Found** - Document not found
- **500 Internal Server Error**

---

## Data Models

### User Schema
```
{
  firstName: String (required),
  lastName: String (required),
  address: String (required),
  email: String (required, unique),
  password: String (required, hashed with bcryptjs),
  createdAt: Date (default: current timestamp)
}
```

### Signature Schema
```
{
  userId: ObjectId (required, ref: users, unique),
  type: String (enum: ['premade', 'drawn'], required),
  signature: Mixed (required),
  initials: Mixed (required),
  createdAt: Date (default: current timestamp),
  updatedAt: Date (default: current timestamp)
}
```

### Document Schema
```
{
  userId: ObjectId (required, ref: users),
  name: String (required),
  fileName: String (required),
  fileType: String (default: 'pdf'),
  size: Number,
  status: String (enum: ['pending', 'signed', 'rejected', 'draft'], default: 'draft'),
  description: String (optional, default: ''),
  uploadedAt: Date (default: current timestamp),
  modifiedAt: Date (default: current timestamp),
  createdAt: Date (default: current timestamp),
  sharedWith: [ObjectId] (ref: users)
}
```

### Activity Schema
```
{
  userId: ObjectId (required, ref: users),
  type: String (enum: ['document_uploaded', 'document_signed', 'signature_created', 'document_shared', 'action_required'], required),
  title: String (required),
  description: String,
  details: String,
  relatedDocumentId: ObjectId (ref: documents),
  timestamp: Date (default: current timestamp),
  createdAt: Date (default: current timestamp)
}
```

---

## Authentication Details

### JWT Token
- **Algorithm:** HS256
- **Expiration:** 24 hours
- **Header Format:** `Authorization: Bearer <token>`
- **Secret:** Uses `JWT_SECRET` environment variable (fallback: 'your-secret-key')

### Protected Endpoints
All endpoints prefixed with `/api/` require authentication token in the Authorization header.

---

## Error Handling

All error responses follow this format:
```json
{
  "message": "Error description",
  "error": "Additional error details (if applicable)"
}
```

Common HTTP Status Codes:
- **201 Created** - Resource successfully created
- **200 OK** - Request successful
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication failed or missing
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server-side error

---

## Technologies

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Environment Variables:** dotenv
- **CORS:** Enabled for http://localhost:3000

### Middleware
- **CORS:** Cross-Origin Resource Sharing
- **Body Parser:** Handles JSON and URL-encoded payloads up to 50MB
- **JWT Verification:** Verifies tokens for protected endpoints

### Frontend
- **Framework:** React
- **Port:** 3000

---

## Environment Configuration

The backend uses environment variables managed via `.env` file:

- `JWT_SECRET`: Secret key for signing JWT tokens (defaults to 'your-secret-key' if not set)

---

## Running the Application

### Backend Server
```bash
cd server
npm start          # Production mode
npm run dev        # Development mode with nodemon
```
Server runs on: `http://localhost:5000`

### Frontend Application
```bash
cd signify
npm start
```
Frontend runs on: `http://localhost:3000`

---

## Security Notes

1. **Password Security:** All passwords are hashed using bcryptjs with a salt round of 10 before being stored in the database.
2. **CORS:** Cross-Origin Resource Sharing is configured to allow requests from `http://localhost:3000` only.
3. **JWT Tokens:** Tokens expire after 24 hours for security purposes.
4. **Input Validation:** Basic validation is performed on registration and login endpoints.

---

## Error Handling

All endpoints return consistent error responses with appropriate HTTP status codes:
- **200** - OK
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **500** - Internal Server Error

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Feb 2026 | Initial API implementation with user registration and login endpoints |

