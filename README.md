## Gift of Time backend

Initial backend scaffolding for the IMA “Gift of Time” selection experience. It provides:

- Node.js + TypeScript + Express server with `/health` endpoint.
- Prisma ORM configured for SQLite (easy to swap to Postgres later).
- `Gift` data model and seed script for the six sessions.
- `Client` data model with token-based lookup for public access.

### Prerequisites

- pnpm (preferred)  
- Node.js 18+

### Environment

Copy `env.example` to `.env` and set values. Defaults include a SQLite connection:

```bash
cp env.example .env
```

Key vars:

- `DATABASE_URL` – defaults to `file:./dev.db`
- `PORT` – API port (defaults to 4000)
- `CORS_ORIGIN` – allowed origin for API calls (default `*`)
- `BASE_URL` – public microsite base URL (used for invite links)
- `ADMIN_API_KEY` – shared secret for admin endpoints
- AI/observability keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `NEON_DATABASE_URL`, `SENTRY_DSN`

### Install dependencies

```bash
pnpm install
```

> If the pnpm store location changes, run with `--store-dir <path>` or reinstall.

### Database

- Generate/refresh Prisma client: `pnpm prisma generate`
- Apply migrations (SQLite dev): `pnpm prisma:migrate`
- Seed gifts: `pnpm prisma:seed`

> After adding the `Client` model, run a migration (or `prisma db push` in dev) so the schema is applied before using the API.

The Prisma schema lives in `prisma/schema.prisma`. Seeds are in `prisma/seed.ts`.

### Run the API

```bash
pnpm dev        # watch mode API server on http://localhost:4000
pnpm start      # run compiled server from dist/
```

The Express app is bootstrapped in `src/index.ts`. Public routes mount from `src/routes/public.ts`.

### Frontend (existing Next.js app)

Frontend scripts are preserved:

- Dev: `pnpm dev:web`
- Build: `pnpm build:web`
- Start: `pnpm start:web`

### Health check

- `GET /health` → `{ "status": "ok" }`

### Public API

- `GET /api/client-and-gifts?t=<token>` → returns client details and active gifts, or `MISSING_TOKEN` / `NOT_FOUND`.
- `POST /api/select-gift` → body `{ token, giftId }`; errors: `INVALID_INPUT`, `NOT_FOUND`, `INVALID_GIFT`, `ALREADY_SELECTED`; success returns `selectedGiftId` and `selectedAt`.

### CORS

Simple CORS is enabled. Configure allowed origin with `CORS_ORIGIN` in `.env` (defaults to `*`). Methods allowed: GET, POST, OPTIONS; headers: Content-Type.

### Admin API (protected with `x-admin-key`)

Mount path: `/api/admin`

- `POST /api/admin/clients`
  - Body: `{ firstName, lastName, companyName, email }`
  - Creates client with secure token; returns client + `inviteUrl` (`BASE_URL/?t=<token>`).
- `GET /api/admin/clients`
  - Lists clients with selection status, including `selectedGiftTitle` and `selectedAt`.

Headers:
- `x-admin-key: <ADMIN_API_KEY>`

### Project scripts (summary)

- `pnpm dev` – API dev server (tsx watch)
- `pnpm build` – Compile API (`dist/`)
- `pnpm start` – Run compiled API
- `pnpm dev:web` – Next.js dev server
- `pnpm build:web` – Next.js production build
- `pnpm start:web` – Next.js start
- `pnpm prisma:migrate` – `prisma migrate dev --name init`
- `pnpm prisma:seed` – `prisma db seed`
