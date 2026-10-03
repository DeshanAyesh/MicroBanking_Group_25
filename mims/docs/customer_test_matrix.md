# Customer and Validation Test Matrix

This document records the end-to-end integration testing for Customer-related features, verifying that database constraints, API validations, and business rules are enforced correctly.

| Test ID | Feature | Scenario | Expected Behavior | Status |
|---|---|---|---|---|
| CUST-01 | Customer Registration | Register a new customer with valid data (NIC, name, DOB, contact). | Customer is saved to the database, assigned to the given agent, and HTTP 201 is returned. | PASS |
| CUST-02 | Customer Registration | Attempt to register a customer with an existing NIC. | Database UNIQUE constraint on `nic` rejects the insert. API returns an appropriate duplicate NIC error response. | PASS |
| CUST-03 | Customer Registration | Attempt to register a customer missing required fields (for example, first name or date of birth). | API validation rejects the request before inserting data into the database. | PASS |
| CUST-04 | Customer Registration | Attempt to register a customer with an invalid agent ID or branch ID. | Database FOREIGN KEY constraints prevent invalid references and the API handles the error correctly. | PASS |
| CUST-05 | Customer CRUD | Update customer's contact details such as phone number or address. | Customer details are updated successfully in the `customer` table. | PASS |
| CUST-06 | Customer Validation | Verify customer date of birth information for age-based account eligibility checks. | Customer age information can be used correctly for account validation rules. | PASS |
| CUST-07 | Customer Report | Run Customer Activity Report with a mixture of deposits and withdrawals. | Report correctly calculates total deposits, total withdrawals, and net activity values. | PASS |
| CUST-08 | Customer Report | Run Customer Activity Report for joint account holders. | Joint account transactions are correctly reflected for linked customers according to the documented joint-account attribution assumption. | PASS |

## Testing Notes

- Customer registration validation checks required fields and prevents duplicate customer records.
- Database constraints maintain data integrity for customer-related operations.
- Customer activity reports are verified using transaction records.
- Joint account transaction handling follows the documented project assumption.