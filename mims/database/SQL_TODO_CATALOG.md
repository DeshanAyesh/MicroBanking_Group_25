# SQL TODO catalog

This is a developer checklist, not a replacement for the SQL.

| Operation | Main tables | Transaction? | Key rules |
|---|---|---:|---|
| Login | users, roles | No | active user, password hash, role |
| Customer list | customers, branches, employees | No | search/filter |
| Customer create | customers | Yes if multiple related rows | constraints + relationships |
| Account create | savings_accounts, account_holders, plans | Yes | plan eligibility |
| Deposit | savings_accounts, transactions | Yes | positive amount, atomic balance update |
| Withdrawal | savings_accounts, transactions | Yes | sufficient balance, minimum balance, locking |
| FD create | fixed_deposits, savings_accounts, fd_plans | Yes | active savings account, max one FD/account |
| Interest | fixed_deposits, savings_accounts, transactions, interest_distribution | Yes | due payout, 30-day cycle |
| Agent report | transactions, agents/users | No | count + total value |
| Account report | savings_accounts, transactions | No | current balance + transaction summary |
| Active FD report | FDs + account/customer/plan relationships | No | active only |
| Interest report | interest distribution + account/plan | No | group by month/type |
| Customer activity | customers + holders + accounts + transactions | No | deposits, withdrawals, net |

For each row, write the actual SQL only after the relational design is agreed by the team.
