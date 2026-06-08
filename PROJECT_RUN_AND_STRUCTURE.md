# Brilliant Archery Academy - Run Guide and Project Explanation

This document explains:
1. How to run the project from scratch
2. What each part of the project does
3. How frontend and backend connect together

## 1) Project Overview

The workspace has two main applications:

- `frontend/`: Angular website (public pages + admin UI)
- `backend/`: Node.js + Express API with PostgreSQL database

The frontend calls backend APIs at `http://localhost:3000/api`, and the backend reads/writes data in PostgreSQL.

## 2) Prerequisites

Install the following before running:

- Node.js 18+ (recommended 20 LTS)
- npm (comes with Node.js)
- PostgreSQL 14+

Verify versions:

```bash
node -v
npm -v
psql --version
```

## 3) Database Setup

1. Start PostgreSQL service.
2. Create database:

```sql
CREATE DATABASE brilliant_archery;
```

3. Ensure your PostgreSQL username/password match what you put in backend environment variables.

## 4) Backend Setup and Run

The backend now uses Sequelize ORM and automatically syncs the schema on startup.

- Missing tables are created automatically.
- Model changes are applied on startup using ORM sync (`alter: true`).
- This means you do not need to run separate manual CREATE TABLE scripts.

### A) Configure environment variables

In `backend/`, create a `.env` file (or copy from `.env.example`) and set values:

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:4200
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/brilliant_archery
PG_SSL=false
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=change-this-in-production
```

Notes:
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` are used to seed the initial admin account.
- You can use a bcrypt hash in `ADMIN_PASSWORD` if desired.

### B) Install and run backend

From `backend/`:

```bash
npm install
npm run dev
```

Expected output:
- `Backend running on http://localhost:3000`

Health check:
- Open `http://localhost:3000/api/health`

## 5) Frontend Setup and Run

From `frontend/`:

```bash
npm install
npm start
```

Then open:
- `http://localhost:4200`

## 6) Admin Login and Add Admins

1. Open login page: `http://localhost:4200/login`
2. Sign in with seeded account (default):
   - Username: `admin`
   - Password: `admin123`
3. After login, you will be redirected to admin users page:
   - `http://localhost:4200/admin/users`
4. Add new admins from the form.

All admin routes are protected by JWT auth.

## 7) How Each Part Works

## 7.1 Backend (`backend/src`)

- `server.js`
  - Starts Express server
  - Configures CORS and JSON middleware
  - Exposes APIs for content and admin operations
  - Handles login and token creation
  - Calls database initialization at startup (ORM sync + seed)

- `db.js`
  - Manages PostgreSQL connection through Sequelize ORM
  - Defines models for `rankings`, `tournaments`, `admins`
  - Automatically syncs schema at startup (`sequelize.sync({ alter: true })`)
  - Seeds initial data from `data/content.json`
  - Seeds initial admin from environment values
  - Provides DB helper functions for read/write operations

- `middleware/auth.js`
  - Verifies JWT from `Authorization: Bearer <token>`
  - Allows only admin users for protected endpoints

- `data/content.json`
  - Initial sample data for rankings and tournaments

## 7.2 Frontend (`frontend/src/app`)

- `app.routes.ts`
  - Defines website routes (home/about/ranking/branches/tournaments/login)
  - Protects `/admin` and `/admin/users` with `adminGuard`

- `services/content.service.ts`
  - Fetches public content
  - Sends protected updates for rankings/tournaments

- `services/auth.service.ts`
  - Handles login/logout token storage
  - Fetches admins and creates admins through protected API

- `guards/admin.guard.ts`
  - Blocks protected routes if token is missing

- `pages/admin/admin.component.*`
  - Main admin dashboard for editing rankings and tournaments

- `pages/admin-users/admin-users.component.*`
  - Admin management page to create additional admins
  - Shows current admin list

- `pages/login/login.component.*`
  - Admin login page
  - Redirects successful login to `/admin/users`

- `components/site-header/*`
  - Global top navigation with links and login/logout buttons

## 8) Important API Endpoints

Public:
- `GET /api/health`
- `GET /api/rankings`
- `GET /api/tournaments`
- `GET /api/content`
- `POST /api/auth/login`

Admin (token required):
- `PUT /api/admin/rankings`
- `PUT /api/admin/tournaments`
- `GET /api/admin/admins`
- `POST /api/admin/admins`

## 9) Typical Daily Run Flow

Open two terminals:

Terminal 1:
```bash
cd backend
npm run dev
```

Terminal 2:
```bash
cd frontend
npm start
```

Then use the app at `http://localhost:4200`.

## 10) Troubleshooting

- Login fails (401):
  - Check username/password
  - Verify backend `.env`
  - Restart backend after `.env` changes

- Frontend cannot reach backend:
  - Ensure backend is running on port 3000
  - Check `CLIENT_ORIGIN=http://localhost:4200`

- Database connection errors:
  - Verify `DATABASE_URL`
  - Ensure PostgreSQL is running and database exists

- Protected route sends back to login:
  - Token may be expired (8h default)
  - Login again
