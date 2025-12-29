# Multi-Tenant SaaS Platform

A production-ready, multi-tenant SaaS application for project and task management. Built with Node.js, React, PostgreSQL, and Docker.

## Features
- **Multi-Tenancy**: Complete data isolation using shared database with tenant_id.
- **Role-Based Access Control (RBAC)**: Super Admin, Tenant Admin, User roles.
- **Subscription Management**: Free, Pro, Enterprise plans with limits.
- **Project & Task Management**: CRUD operations with proper scoping.
- **Authentication**: JWT-based stateless authentication with 24h expiry.
- **Security**: Password hashing, input validation, audit logging.
- **Responsive UI**: Modern dashboard built with React and Tailwind CSS.
- **Dockerized**: Full containerization for Database, Backend, and Frontend.

## Architecture
(See `docs/architecture.md` for diagram)
- **Frontend**: React, Vite, Tailwind CSS (Port 3000)
- **Backend**: Node.js, Express, pg (Port 5000)
- **Database**: PostgreSQL 15 (Port 5432)

## Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Axios, Lucide React.
- **Backend**: Node.js 18, Express 4, node-postgres, bcrypt, jsonwebtoken.
- **Database**: PostgreSQL 15.
- **DevOps**: Docker, Docker Compose.

## Installation & Setup

### Prerequisites
- Docker and Docker Compose installed.

### Quick Start (Production/Evaluation)
1. Clone the repository.
2. Run the application:
   ```bash
   docker-compose up -d
   ```
3. Wait for services to be healthy (approx 30s).
4. Access the frontend at [http://localhost:3000](http://localhost:3000).

### Environment Variables
See `backend/.env.example`.
- `DB_HOST`: Database host (default: database in Docker).
- `JWT_SECRET`: Secret for token signing.
- `FRONTEND_URL`: URL for CORS.

## Database Initialization
The `docker-compose up` command automatically runs migrations and seeds the database with initial data (Super Admin, Demo Tenant, etc.).

## Login Credentials (Seed Data)
- **Super Admin**: `superadmin@system.com` / `Admin@123` (No tenant login)
- **Tenant Admin**: `admin@demo.com` / `Demo@123` (Tenant: `demo`)
- **User**: `user2@demo.com` / `User@123` (Tenant: `demo`)

## API Documentation
See `docs/API.md` for detailed endpoint documentation.
All API responses follow `{ success: boolean, data: any, message: string }`.

## Demo Video
[Link to YouTube Demo](https://youtube.com/...)



