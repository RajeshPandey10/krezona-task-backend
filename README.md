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
   DATABASE_URL="postgresql://user:password@localhost:5432/krezona"
   DIRECT_URL="postgresql://user:password@localhost:5432/krezona"
   JWT_SECRET="your-secret-key"
   JWT_EXPIRATION="7d"
   PORT=3000
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-app-password"
   ```

3. **Initialize database**

   ```bash
   npx prisma migrate dev
   npx prisma db seed
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


