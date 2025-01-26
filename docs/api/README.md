# BuscAdis API Documentation

## Base URL
- Development: `http://localhost:3001`
- Production: `https://api.buscadis.com`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

Response: Same as register

#### Social Login - Google
```http
GET /auth/google
```
Redirects to Google OAuth2 flow

#### Social Login - Facebook
```http
GET /auth/facebook
```
Redirects to Facebook OAuth2 flow

#### Phone Verification
```http
POST /auth/phone/send-code
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

```http
POST /auth/phone/verify
Content-Type: application/json

{
  "phone": "+1234567890",
  "code": "123456"
}
```

## User Management

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "isActive": true,
  "createdAt": "2024-01-26T12:00:00Z"
}
```

### Update User
```http
PATCH /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

### Search Users (Admin only)
```http
GET /users/search?query=john&role=user&page=1&limit=10
Authorization: Bearer <token>
```

Response:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "pages": 10
}
```

## Category Management

### Create Category (Admin only)
```http
POST /categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "icon": "fa-microchip",
  "parentId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Get Category Tree
```http
GET /categories/tree
```

Response:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Electronics",
    "slug": "electronics",
    "children": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Smartphones",
        "slug": "smartphones",
        "children": []
      }
    ]
  }
]
```

### Search Categories
```http
GET /categories/search?query=electronics
```

Response:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Electronics",
    "slug": "electronics",
    "path": "electronics",
    "score": 1.0
  }
]
```

### Move Category (Admin only)
```http
PATCH /categories/:id/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "newParentId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

Error Response Format:
```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

## Rate Limiting

API requests are limited to:
- Authenticated: 100 requests per minute
- Unauthenticated: 20 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1706277600
```

## Pagination

Endpoints that return lists support pagination:

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response format:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "pages": 10
}
```

## Filtering and Sorting

### Filtering
Use query parameters for filtering:
```
GET /endpoint?field=value&field2=value2
```

### Sorting
Use `sort` and `order` parameters:
```
GET /endpoint?sort=createdAt&order=desc
```

## WebSocket Events (Coming Soon)

Real-time updates will be available through WebSocket connections:
```typescript
// Connect to WebSocket
const socket = io('ws://localhost:3001');

// Listen for events
socket.on('category.updated', (data) => {
  console.log('Category updated:', data);
});
``` 