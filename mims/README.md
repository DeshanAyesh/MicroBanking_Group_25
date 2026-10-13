# B-Trust Microbanking and Interest Management System

B-Trust MIMS is a university database project for managing customers, savings accounts, joint accounts, transactions, fixed deposits, interest processing, and banking reports.

## Technology stack

- Next.js 15
- React 19
- TypeScript
- MySQL 8.4
- `mysql2`
- bcrypt password hashing
- JWT authentication
- Docker and Docker Compose

## Main features

- Role-based authentication for administrators, agents, and customers
- Customer registration and profile management
- Individual and joint savings accounts
- Savings-plan and age validation
- Deposits and withdrawals through stored procedures
- Fixed-deposit creation and monthly interest processing
- Account transaction history
- Account reconciliation and banking analytics
- Database functions, procedures, triggers, indexes, foreign keys, and transactions

## Recommended setup: Docker

Docker runs the application and MySQL in separate containers with the correct versions and database configuration.

### Requirements

- Git
- Docker Desktop

### Start the complete system

Open PowerShell in the folder containing `docker-compose.yml`:

```powershell
cd mims
docker compose up --build -d
```

Check the containers:

```powershell
docker compose ps
```

Expected services:

```text
btrust-mysql   healthy
btrust-mims    running
```

Open the application:

```text
http://localhost:3000
```

The Docker MySQL server is also available from the host at:

```text
Host: 127.0.0.1
Port: 3307
Database: btrust_mims
User: btrust_user
```

The containers communicate internally using `database:3306`.

### Demo accounts

| Role | Username | Password |
|---|---|---|
| Administrator | `admin1` | `BTrust@123` |
| Agent | `agent1` | `BTrust@123` |
| Customer | `cust1` | `BTrust@123` |

Additional seeded agent accounts are `agent2` through `agent5`. Additional customer accounts are `cust2` through `cust15`. They use the same local demonstration password.

These credentials are only for the seeded university demonstration database.

### Stop Docker

Stop the containers while preserving the database:

```powershell
docker compose down
```

Do not add `-v` when the database must be preserved. The `-v` option deletes the Docker database volume.

## Local Next.js development with Docker MySQL

This mode runs Next.js through `npm run dev` while keeping MySQL inside Docker. Both application modes use the same database records.

### 1. Keep only Docker MySQL running

```powershell
docker compose up -d database
docker compose stop application
```

### 2. Install packages

```powershell
npm install
```

### 3. Create `.env.local`

Create the file from the example:

```powershell
Copy-Item .env.example .env.local
```

Configure it for Docker MySQL:

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=btrust_mims
DB_USER=btrust_user
DB_PASSWORD=local_database_password

JWT_SECRET=replace_with_a_long_random_local_secret
JWT_EXPIRES_IN=8h

NEXT_PUBLIC_APP_NAME=B-Trust MIMS
ENFORCE_BUSINESS_HOURS=false
```

Generate a private JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `JWT_SECRET` in `.env.local`.

Do not commit `.env.local` or use production credentials in the repository.

If `MYSQL_PASSWORD` was customized when Docker MySQL was first created, use that same value for `DB_PASSWORD`. Changing a Compose environment value later does not change the password stored inside an existing MySQL volume.

### 4. Start development mode

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

Next.js prints another port such as `3001` if port 3000 is already occupied. Stop the Docker application before starting local development if port 3000 is required.

### Switch back to the Docker application

Stop the local development server with `Ctrl+C`, then run:

```powershell
docker compose up -d application
```

The data remains unchanged because both modes use the same Docker MySQL volume.

## Manual setup with a locally installed MySQL server

Docker is recommended, but the project can also use MySQL installed directly on the laptop.

### Requirements

- Node.js 20 or later
- MySQL Server 8.x
- MySQL Workbench or MySQL command-line client

### Environment configuration

Create `.env.local` and use the credentials from the local MySQL installation:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=btrust_mims
DB_USER=root
DB_PASSWORD=your_local_mysql_password

JWT_SECRET=replace_with_a_long_random_local_secret
JWT_EXPIRES_IN=8h

NEXT_PUBLIC_APP_NAME=B-Trust MIMS
ENFORCE_BUSINESS_HOURS=false
```

### Database setup order

Create and select the database:

```sql
CREATE DATABASE IF NOT EXISTS btrust_mims;
USE btrust_mims;
```

Run the SQL files in this order:

| Order | File | Purpose |
|---:|---|---|
| 1 | `database/schema.sql` | Tables, keys, relationships, and constraints |
| 2 | `database/functions.sql` | Fixed-deposit interest function |
| 3 | `database/procedures.sql` | Deposit, withdrawal, and interest procedures |
| 4 | `database/seed.sql` | Demonstration users and banking records |
| 5 | `database/indexes.sql` | Query-performance indexes |
| 6 | `database/triggers.sql` | Balance, ownership, and ledger-integrity triggers |
| 7 | `database/reports.sql` | Report queries for database testing |

Install dependencies and start the application:

```powershell
npm install
npm run dev
```

## Production build verification

Run this from the `mims` folder:

```powershell
npm run build
```

A successful build performs TypeScript checking and creates all application and API routes.

## Database notes

- Savings accounts may be individual or joint.
- Joint ownership is stored in `joint_account_holders`.
- Opening deposits create account-transaction records.
- Deposit and withdrawal procedures update balances atomically.
- Posted transactions are protected from updates and deletion by triggers.
- Database indexes support customer lookups, account history, agent activity, analytics date ranges, and fixed-deposit processing.
- The Account-wise Summary report reconciles stored balances with the transaction ledger.
- Banking Analytics uses date filters. The seeded transaction period is `2023-01-01` through `2023-06-01`.

## Useful Docker commands

View status:

```powershell
docker compose ps
```

View logs:

```powershell
docker compose logs -f
```

Restart only the application:

```powershell
docker compose restart application
```

Stop only the application and keep MySQL running:

```powershell
docker compose stop application
```

Start only the application again:

```powershell
docker compose up -d application
```

## Troubleshooting

### Port 3000 is already in use

Stop the Docker application before running local development:

```powershell
docker compose stop application
npm run dev
```

### MySQL access denied in local development

Confirm that `.env.local` uses:

```text
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=btrust_user
```

The `DB_PASSWORD` must match the password used when the current Docker MySQL volume was first created. Restart `npm run dev` after changing `.env.local` because Next.js loads environment variables at startup.

### Docker database contains different records from local MySQL

Docker MySQL uses its own persistent volume and does not automatically copy records from MySQL installed directly on Windows. Ensure the application is connected to the intended host and port.

### Login fails

- Confirm the username and password exactly; passwords are case-sensitive.
- Confirm that MySQL is healthy with `docker compose ps`.
- Restart the application after environment changes.
- Use the seeded demo credentials when working with a newly initialized Docker database.

### Analytics shows no transactions

Select a date range containing the seeded transactions:

```text
From: 2023-01-01
To:   2023-06-01
```

### Start again without deleting data

```powershell
docker compose down
docker compose up -d
```

Avoid `docker compose down -v` unless intentionally deleting the Docker database.

## Repository safety

Do not commit:

- `.env.local`
- Database passwords used outside local demonstration
- JWT secrets
- Docker database volumes
- Build output or `node_modules`

The repository should contain `.env.example` as the safe configuration template.
