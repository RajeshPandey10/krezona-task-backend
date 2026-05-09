# Krezona Task Server

NestJS + PostgreSQL backend for civil engineering project management.

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file:

   ```env
   # Use Supabase connection URLs (Session Pooler for runtime)
   DATABASE_URL="<SUPABASE_SESSION_POOLER_URL>"
   # Use Direct URL for migrations if required
   DIRECT_URL="<SUPABASE_DIRECT_URL>"
   JWT_SECRET="your-secret-key"
   JWT_EXPIRATION="7d"
   PORT=3000
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-app-password"
   ```

3. **Initialize database (Supabase + Prisma)**

   Steps to connect and run migrations with Supabase:

   - Create a Supabase project and copy the **Session Pooler** (connection-pooling) URL and the **Direct URL** from Project → Settings → Database.
   - Paste the Session Pooler URL into `DATABASE_URL` and the Direct URL into `DIRECT_URL` in `.env`.

   Recommended commands:

   ```bash
   # generate Prisma client after installing dependencies
   npx prisma generate

  

   # if you must run interactive dev migrations locally against Supabase, use the Direct URL
   # (replace <DIRECT_URL> with your DIRECT_URL)
   DIRECT_URL="<DIRECT_URL>" npx prisma migrate dev --name init

   # seed the database if seed script exists
   npm run seed
   ```

4. **Start the server**
   ```bash
   npm run start:dev
   ```

Server runs on `http://localhost:3000`

## Available Commands

- `npm run start:dev` — Run in development mode (hot reload)
- `npm run start` — Run once
- `npm run build` — Build for production
- `npm run seed` — Seed database with default roles
- `npm run test` — Run tests
- `npm run lint` — Lint and fix code

## Run & Build

### Development

Open two terminals:

Terminal 1 — Backend

```bash
cd krezona-task-server
npm install
npx prisma generate
npx prisma migrate dev --name init   # optional for local dev if using DIRECT_URL
npm run start:dev
```

Terminal 2 — Frontend

```bash
cd ../krezona-task-client
npm install
npm run dev
```



## Database Description (Supabase)

This project uses Supabase (Postgres) as the primary data store and Prisma as the ORM. Key models include `User`, `Role`, `Project`, `Subscription`, and `LoginLog`. Prisma migrations are tracked in `prisma/migrations/`.

Key notes:
- Use the Supabase Session Pooler URL for `DATABASE_URL` during runtime to benefit from connection pooling.
- Use the Direct URL (`DIRECT_URL`) when running migrations if Supabase's permissions prevent shadow DB creation.

## Troubleshooting

- If you see `Module '@prisma/client' has no exported member 'PrismaClient'`:
   - Run `npx prisma generate` and ensure `node_modules/@prisma/client` exists, then rebuild.
- If `prisma migrate dev` errors due to shadow DB permissions, prefer `npx prisma migrate deploy` in CI or run `migrate dev` with `DIRECT_URL`.
- If connection issues occur, verify Supabase project allowed network settings and that the URLs are correct.

## API Endpoints

### Authentication

- `POST /auth/register` — Create new user account
- `POST /auth/verify-otp` — Verify OTP code sent to email
- `POST /auth/login` — Login with email and password
- `POST /auth/logout` — Logout user

### Users

- `GET /users` — List all users
- `GET /users/:id` — Get user details
- `PATCH /users/:id` — Update user
- `DELETE /users/:id` — Delete user
- `GET /users/me` — Get current authenticated user's profile

Note: most of the `/users` CRUD routes are admin-only (see `/admin/*`); `GET /users/me` is available to any authenticated user.

### Projects

- `GET /projects` — List projects
- `POST /projects` — Create project
- `GET /projects/:id` — Get project details
- `PATCH /projects/:id` — Update project
- `DELETE /projects/:id` — Delete project

### Subscriptions

- `GET /subscriptions` — List subscriptions
- `PATCH /subscriptions/:userId` — Update subscription by user

### Admin

- `GET /admin/dashboard` — Dashboard summary
- `GET /admin/users` — List users
- `GET /admin/users/:id` — Get single user
- `POST /admin/users` — Create user
- `PATCH /admin/users/:id` — Update user
- `PATCH /admin/users/:id/role` — Change user role
- `DELETE /admin/users/:id` — Delete user
- `GET /admin/roles` — List roles
- `POST /admin/roles` — Create role
- `PATCH /admin/roles/:id` — Update role
- `DELETE /admin/roles/:id` — Delete role
- `GET /admin/subscriptions` — List subscriptions
- `GET /admin/subscriptions/:userId` — Get user subscription
- `PATCH /admin/subscriptions/:userId` — Update user subscription
- `PATCH /admin/subscriptions/:userId/activate` — Activate subscription
- `PATCH /admin/subscriptions/:userId/deactivate` — Deactivate subscription
- `GET /admin/logs` — View all login logs
- `GET /admin/logs/:userId` — View logs by user

### Logs

- `GET /logs` — Login history
 

## Architecture

**Modules:**

- `auth` — Registration, login, JWT
- `users` — User CRUD
- `roles` — Role management
- `projects` — Project CRUD
- `subscriptions` — Plan management
- `admin` — Admin APIs
- `logs` — Login history
- `common` — Shared guards, decorators, utilities

**Database:**

- PostgreSQL with Prisma ORM
- Connection pooling via @prisma/adapter-pg
- Migrations in `prisma/migrations/`

**Security:**

- Password hashing with bcryptjs
- JWT tokens with expiration
- Role-based access control (RBAC) via guards and decorators
- Subscription enforcement via guard

## Default Roles

Seeded on first migration:

- `ADMIN` — Full access, including admin management APIs
- `ENGINEER` — Can create/update/delete own projects, and view all projects
- `VIEWER` — Read-only role, can view all projects


