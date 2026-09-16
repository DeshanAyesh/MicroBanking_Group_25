# B-Trust Microbanking and Interest Management System (MIMS)

A small, understandable university Database Systems project for a Sri Lankan microfinance banking context.

## Stack

- Next.js
- React + TypeScript
- Plain CSS (kept intentionally simple; no UI framework required)
- Next.js API routes
- MySQL
- `mysql2` database integration
- `bcryptjs` for password hashing
- JWT-based authentication structure

## Important SQL rule

**The final SQL is intentionally NOT implemented.**

Every database SQL file contains documented TODO placeholders. The application is structured so the five-person team can write and understand the SQL themselves.

This applies to schema, seed data, SELECT/JOIN/report queries, procedures, functions, triggers, indexes, and transaction SQL.

When an API depends on unfinished SQL, it returns a clear `BLOCKED — SQL TODO required` response instead of pretending that a banking operation succeeded.

## Run

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local`.
4. Fill in the MySQL connection values and JWT secret.
5. Create/select the MySQL database manually.
6. Complete the TODOs in `database/` with your team's SQL.
7. Start development:

```bash
npm run dev
```

Open http://localhost:3000.

## Project structure

- `app/` — pages and API routes
- `components/` — reusable UI
- `lib/auth/` — password/JWT helpers and authorization
- `lib/db/` — MySQL connection layer and SQL TODO integration points
- `lib/validation/` — server-side validation helpers
- `database/` — SQL TODO files
- `types/` — shared domain types

## Team split

- Frontend: pages/components/styles
- Backend: API route contracts and business-flow integration
- Database: schema, seed, queries, procedures/functions/triggers/indexes
- Authentication: login/session/authorization
- Reports: report pages and report SQL

## Current status

The UI, routing, API contracts, validation, authentication helpers, MySQL connection layer, and database TODO documentation are scaffolded.

Database-dependent operations remain intentionally blocked until your team writes the SQL.
