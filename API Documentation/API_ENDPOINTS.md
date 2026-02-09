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

---

## Technologies

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **CORS:** Enabled for http://localhost:3000

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

