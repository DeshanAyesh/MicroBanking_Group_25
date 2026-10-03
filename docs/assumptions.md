# Domain Assumptions and Normalization

## Customer Rules

- Every customer must have valid identification details.
- Customers are assigned to a branch and an agent.
- Customer activity reports include transactions from individual and joint accounts.

## Joint Account Attribution

For customer activity reports, transactions from joint accounts are fully counted for every linked holder.

This assumption is used to ensure every joint account holder can view complete activity related to their shared account.

## Normalization

The database follows 3NF principles.

### 1NF
All attributes are atomic and each table has a primary key.

### 2NF
Non-key attributes depend fully on the primary key.

### 3NF
No non-key attribute depends on another non-key attribute.
Relationships are handled using foreign keys.