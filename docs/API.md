# API Documentation

Base URL: `/api`

## Authentication

### Register Tenant
**POST** `/auth/register-tenant`
- Creates a new tenant and admin user.
- **Body**:
  ```json
  {
    "tenantName": "Example Corp",
    "subdomain": "example",
    "adminEmail": "admin@example.com",
    "adminPassword": "password123",
    "adminFullName": "Admin User"
  }
  ```
- **Response**: `201 Created`

### Login
**POST** `/auth/login`
- Logs in a user.
- **Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "password123",
    "tenantSubdomain": "example"
  }
  ```
- **Response**: `200 OK` (includes JWT token)

### Get Me
**GET** `/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (User details)

### Logout
**POST** `/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## Tenants

### Get Tenant Details
**GET** `/tenants/:tenantId`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### Update Tenant
**PUT** `/tenants/:tenantId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name": "New Name" }`
- **Response**: `200 OK`

### List Tenants (Super Admin)
**GET** `/tenants`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## Users

### Add User
**POST** `/tenants/:tenantId/users`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "role": "user"
  }
  ```
- **Response**: `201 Created`

### List Users
**GET** `/tenants/:tenantId/users`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### Update User
**PUT** `/users/:userId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "fullName": "New Name" }`
- **Response**: `200 OK`

### Delete User
**DELETE** `/users/:userId`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## Projects

### Create Project
**POST** `/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "New Project",
    "description": "Project description"
  }
  ```
- **Response**: `201 Created`

### List Projects
**GET** `/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### Update Project
**PUT** `/projects/:projectId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "status": "completed" }`
- **Response**: `200 OK`

### Delete Project
**DELETE** `/projects/:projectId`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## Tasks

### Create Task
**POST** `/projects/:projectId/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Fix Bug",
    "priority": "high",
    "dueDate": "2024-12-31"
  }
  ```
- **Response**: `201 Created`

### List Project Tasks
**GET** `/projects/:projectId/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### Update Task
**PUT** `/tasks/:taskId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "title": "New Title" }`
- **Response**: `200 OK`

### Update Task Status
**PATCH** `/tasks/:taskId/status`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "status": "in_progress" }`
- **Response**: `200 OK`

### Delete Task
**DELETE** `/tasks/:taskId`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
