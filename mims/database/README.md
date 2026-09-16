# Database TODO guide

All files in this folder deliberately contain TODOs instead of executable SQL.

Recommended order:

1. `schema.sql`
2. `seed.sql`
3. `indexes.sql`
4. `functions.sql`
5. `procedures.sql`
6. `triggers.sql`
7. `reports.sql`

Use MySQL syntax. Do not substitute PostgreSQL syntax.

Before implementing transaction procedures, agree on:
- balance representation
- transaction status semantics
- reference generation
- account eligibility rules
- minimum-balance enforcement
- locking/isolation approach
- 30-day interest-cycle interpretation

The application should be connected only after the team understands and fills these SQL TODOs.
