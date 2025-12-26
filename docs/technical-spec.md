# Technical Specification

## Project Structure

```
multi-tenant-saas/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection, Env vars
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, Error, Validation
│   │   ├── models/         # Sequelize/TypeORM models
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers
│   │   └── app.js          # App entry point
│   ├── migrations/         # DB Migrations
│   ├── seeds/              # Seed data
│   ├── tests/              # Unit/Integration tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context (Auth)
│   │   ├── pages/          # Full pages
│   │   ├── services/       # API calls
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docs/                   # Documentation
├── docker-compose.yml
└── README.md
```

## Development Setup Guide

### Prerequisites
- **Node.js**: v18+
- **Docker**: For containerization
- **PostgreSQL**: v15 (if running locally without Docker)

### Environment Variables
Create a `.env` file in `backend/`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=supersecret
PORT=5000
```

### Installation
1.  **Backend**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```
2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
3.  **Docker**:
    ```bash
    docker-compose up -d
    ```
