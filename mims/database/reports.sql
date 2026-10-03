-- Report 5: Customer Activity

-- Joins:
-- customer:
-- Used to retrieve customer information.

-- savings_account:
-- Used to identify individual account ownership.

-- joint_account_holders:
-- Used to identify joint account ownership.

-- account_transaction:
-- Used to calculate deposits and withdrawals.

-- Grouping:
-- Group by customer_id, first_name and last_name
-- to calculate totals per customer.

-- Filtering:
-- Only DEPOSIT and WITHDRAWAL transactions are included.

-- Ordering:
-- Results are ordered by customer_id.

-- Expected columns:
-- customer_id
-- customer_name
-- total_deposits
-- total_withdrawals
-- net_activity


/*
SELECT 
    c.customer_id,
    CONCAT(c.first_name,' ',c.last_name) AS customer_name,

    SUM(
      CASE 
        WHEN t.transaction_type='DEPOSIT'
        THEN t.amount
        ELSE 0
      END
    ) AS total_deposits,

    SUM(
      CASE 
        WHEN t.transaction_type='WITHDRAWAL'
        THEN t.amount
        ELSE 0
      END
    ) AS total_withdrawals

FROM customer c

LEFT JOIN savings_account sa
ON sa.primary_customer_id=c.customer_id

LEFT JOIN account_transaction t
ON t.account_id=sa.account_id

GROUP BY c.customer_id;
*/