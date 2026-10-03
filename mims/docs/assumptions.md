# Domain Assumptions and Normalization

## Domain Assumptions and Customer Rules

- A customer must have a valid NIC, first name, last name, date of birth, gender, and contact details (phone, email, address).
- Age is verified against savings plan rules (e.g. Children 0-12, Teen 13-17, Adult 18-59, Senior 60+).
- A customer is registered to a specific branch and assigned a specific agent.
- Joint Account Attribution: For reports tracking customer activity (like Report 5), transactions on a joint account are fully attributed to all holders of that account. In a real-world scenario, they might be split or attributed to the initiator, but to guarantee visibility across all linked customers in this project scope, full attribution is assumed.

## Normalization

The database schema follows Third Normal Form (3NF):

- **1NF**: All attributes are atomic (e.g., first and last names are separate columns). Every table has a primary key.
- **2NF**: All non-key attributes are fully functionally dependent on the primary key. For example, in `joint_account_holders`, the added date depends on the composite key `(account_id, customer_id)`.
- **3NF**: There are no transitive dependencies. Customer details (like address and phone) depend only on `customer_id`, not on the agent or branch. The agent and branch are referenced via foreign keys.

## ERD and Schema Coordination

As the Customer lead, the following entity relationships are strictly enforced:

- **`customer` to `user_account`**: 1-to-1 relationship. Each customer profile links exactly to one authentication user.
- **`customer` to `agent`**: M-to-1 relationship. Customers are assigned to exactly one agent for tracking.
- **`customer` to `savings_account`**: 1-to-M (Primary) and M-to-M (Joint via `joint_account_holders`).

These relationships ensure complete data integrity across all core banking functions.