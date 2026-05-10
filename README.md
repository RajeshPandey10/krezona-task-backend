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
   # Database Configuration
   DATABASE_URL="<SUPABASE_SESSION_POOLER_URL>"
   DIRECT_URL="<SUPABASE_DIRECT_URL>"

   # JWT Configuration
   JWT_SECRET="your-secret-key"
   JWT_EXPIRATION="7d"

   # Server Configuration
   PORT=3000

   # Email Service Configuration (Brevo recommended, SMTP fallback)
   # For Brevo (recommended for production):
   BREVO_API_KEY="your-brevo-api-key"
   EMAIL_USER="no-reply@yourdomain.com"

   # For SMTP fallback (used if BREVO_API_KEY is not set):
   # EMAIL_USER="your-email@gmail.com"
   # EMAIL_PASS="your-app-password"
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

## Email Service & OTP Configuration

### Mail Service (MailService)

The mail service supports two email delivery methods:

1. **Brevo API (Recommended for Production)**
   - More reliable and scalable
   - Set `BREVO_API_KEY` environment variable
   - Configure `EMAIL_USER` as your sender email
   - Automatic retry logic and delivery tracking

2. **SMTP Fallback (Development)**
   - Used when `BREVO_API_KEY` is not set
   - Falls back to Gmail SMTP
   - Requires `EMAIL_USER` and `EMAIL_PASS`
   - Limited to 500 emails per day (Gmail limits)

### OTP Service

OTP (One-Time Password) is used for email verification during registration:

- **OTP Length:** 6 digits (generated randomly)
- **OTP Expiry:** 10 minutes
- **Resend:** OTP is regenerated and sent to email on each registration attempt
- **Verification:** OTP is validated in the `POST /auth/verify-otp` endpoint

Implementation uses `OtpUtil` which provides:

- `generateOtp(length)` — Generates random OTP (default 6 digits)
- `generateExpiry(minutes)` — Sets expiry timestamp (default 10 minutes)
- `isExpired(date)` — Checks if OTP has expired

## Troubleshooting

- If you see `Module '@prisma/client' has no exported member 'PrismaClient'`:
  - Run `npx prisma generate` and ensure `node_modules/@prisma/client` exists, then rebuild.
- If `prisma migrate dev` errors due to shadow DB permissions, prefer `npx prisma migrate deploy` in CI or run `migrate dev` with `DIRECT_URL`.
- If connection issues occur, verify Supabase project allowed network settings and that the URLs are correct.

### Email & OTP Troubleshooting

- **OTP email not received:**
  - Verify `BREVO_API_KEY` is correctly set in `.env`
  - If using SMTP fallback, ensure `EMAIL_USER` and `EMAIL_PASS` are valid Gmail credentials
  - Gmail requires app-specific passwords (not regular account password) for SMTP
  - Check spam folder
  - Verify OTP expiry hasn't passed (10 minutes default)

- **Brevo API errors:**
  - Check API key is valid in [Brevo Dashboard](https://app.brevo.com/)
  - Ensure sender email matches your Brevo account
  - Check rate limits and daily quota in Brevo dashboard

- **No mail transporter configured:**
  - Either set `BREVO_API_KEY` for Brevo, or
  - Set both `EMAIL_USER` and `EMAIL_PASS` for SMTP fallback
  - Cannot use both methods simultaneously (Brevo is prioritized if both are set)

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

### Architecture Diagram

```mermaid
flowchart LR
   F[Frontend (Next.js)] -->|API requests| A[Backend API (NestJS)]
   A --> P[Prisma Client]
   P --> DB[(PostgreSQL / Supabase)]
   A -->|Emails / OTP| MS[Mail Service]
   MS -->|Brevo API| BREVO[Brevo Mail Service]
   MS -->|SMTP Fallback| SMTP[Gmail SMTP]
   A -->|Auth| JWT[(JWT + JwtUtil)]
   note right of A: Guards: JwtAuthGuard, RolesGuard, SubscriptionGuard
```

### Security & Secrets Handling (Recommendations)

- **Environment variables:** Keep all secrets (e.g. `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `BREVO_API_KEY`, SMTP credentials) out of source control. Use `.env` for local development and a secrets manager in production.
- **Production secret stores:** Use a secrets manager such as HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, or Supabase project secrets. Avoid storing long-lived secrets directly in CI logs or repo settings.
- **Email credentials:**
  - For Brevo, use an API key scoped to email sending only (create a restricted API key in Brevo)
  - For SMTP, use app-specific passwords (not account passwords) and rotate them regularly
  - Never log or expose `BREVO_API_KEY` or email credentials
- **JWT handling & expiration:** `JWT_SECRET` protects tokens. Use short access token TTLs (e.g., 15m) and refresh tokens if long sessions are required. Rotate `JWT_SECRET` periodically and provide a token revocation mechanism if needed.
- **Token storage:** For web frontends prefer `HttpOnly`, `Secure`, `SameSite` cookies for access/refresh tokens. For desktop apps (Electron/Tauri) store tokens in the OS secure store (Keychain, Windows Credential Manager) rather than localStorage.
- **CORS policy rationale:** Restrict `CORS` to known origins (frontend app origin(s)). In `src/main.ts` CORS is configured to allow specific origins and credentials. This prevents unwanted cross-origin access while allowing the frontend to send cookies when credentials are enabled.
- **Input validation & sanitization:** Use `ValidationPipe` and DTO validation to protect against malformed input and basic injection attacks.
- **Rate limiting:** Use global throttling (`@nestjs/throttler`) plus per-route `@Throttle` on sensitive admin endpoints to mitigate brute-force and abusive requests.

### Common operational notes

- Never commit `.env` or `secrets.*` files. Add them to `.gitignore`.
- Use database connection pooling (Supabase Session Pooler) for production workloads.
- For email sending in production, use Brevo API (`BREVO_API_KEY`) instead of SMTP for better reliability and deliverability:
  - Sign up at [Brevo](https://www.brevo.com/) and get your API key
  - Configure your sender email in Brevo dashboard
  - Set `BREVO_API_KEY` in production environment
- OTP emails expire after 10 minutes; users should verify quickly after registration
- Rate limit OTP requests to prevent abuse (currently no per-request rate limiting; consider adding if needed)

### API docs & examples

- A Postman documentation and collection is available here: https://documenter.getpostman.com/view/39660157/2sBXqNkdRo

Example `curl` (login) and protected request:

```bash
# Login
curl -X POST 'http://localhost:3000/auth/login' \
   -H 'Content-Type: application/json' \
   -d '{"email":"alice@example.com","password":"password123"}'

# Response contains `accessToken` in JSON. Use it in Authorization header for protected endpoints:
curl 'http://localhost:3000/users/me' \
   -H "Authorization: Bearer <ACCESS_TOKEN>"
```

If you prefer Postman, import the collection from the Postman documentation link above and set an `access_token` environment variable to test protected routes.
