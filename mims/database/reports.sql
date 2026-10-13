-- Report 1: Agent-wise Transactions
SELECT
    a.agent_id,
    a.agent_code,
    CONCAT(a.first_name, ' ', a.last_name) AS agent_name,
    b.branch_name,
    COUNT(at.transaction_id) AS transaction_count,
    COALESCE(SUM(at.amount), 0.00) AS total_transaction_value,
    COALESCE(SUM(CASE WHEN at.transaction_type = 'DEPOSIT' THEN at.amount ELSE 0 END), 0.00) AS total_deposits,
    COALESCE(SUM(CASE WHEN at.transaction_type = 'WITHDRAWAL' THEN at.amount ELSE 0 END), 0.00) AS total_withdrawals
FROM agent a
JOIN branch b ON b.branch_id = a.branch_id
LEFT JOIN account_transaction at ON at.agent_id = a.agent_id
WHERE a.status = 'ACTIVE'
GROUP BY a.agent_id, a.agent_code, a.first_name, a.last_name, b.branch_name
ORDER BY total_transaction_value DESC, agent_name;

-- Report 2: Account-wise Summary
-- Shows every account's transaction totals and reconciles calculated balance
-- against the current balance stored in savings_account.

SELECT
    sa.account_id,
    sa.account_number,
    sa.acc_type,
    sa.status,
    sp.plan_name,

    CONCAT(
        primary_customer.first_name,
        ' ',
        primary_customer.last_name
    ) AS primary_customer_name,

    CASE
        WHEN sa.acc_type = 'JOINT'
        THEN COALESCE(holders.holder_names, '')
        ELSE CONCAT(
            primary_customer.first_name,
            ' ',
            primary_customer.last_name
        )
    END AS holder_names,

    CASE
        WHEN sa.acc_type = 'JOINT'
        THEN COALESCE(holders.holder_count, 0)
        ELSE 1
    END AS holder_count,

    COALESCE(transaction_summary.transaction_count, 0)
        AS transaction_count,

    COALESCE(transaction_summary.total_deposits, 0.00)
        AS total_deposits,

    COALESCE(transaction_summary.total_withdrawals, 0.00)
        AS total_withdrawals,

    COALESCE(transaction_summary.total_interest, 0.00)
        AS total_interest,

    sa.current_balance,

    (
        COALESCE(transaction_summary.total_deposits, 0.00)
        + COALESCE(transaction_summary.total_interest, 0.00)
        - COALESCE(transaction_summary.total_withdrawals, 0.00)
    ) AS calculated_balance,

    (
        sa.current_balance
        - (
            COALESCE(transaction_summary.total_deposits, 0.00)
            + COALESCE(transaction_summary.total_interest, 0.00)
            - COALESCE(transaction_summary.total_withdrawals, 0.00)
        )
    ) AS balance_difference

FROM savings_account sa

JOIN savings_plan sp
    ON sp.plan_id = sa.plan_id

JOIN customer primary_customer
    ON primary_customer.customer_id = sa.primary_customer_id

LEFT JOIN (
    SELECT
        account_id,
        COUNT(*) AS transaction_count,

        SUM(
            CASE
                WHEN transaction_type = 'DEPOSIT'
                THEN amount
                ELSE 0
            END
        ) AS total_deposits,

        SUM(
            CASE
                WHEN transaction_type = 'WITHDRAWAL'
                THEN amount
                ELSE 0
            END
        ) AS total_withdrawals,

        SUM(
            CASE
                WHEN transaction_type = 'INTEREST_CREDIT'
                THEN amount
                ELSE 0
            END
        ) AS total_interest

    FROM account_transaction
    GROUP BY account_id
) transaction_summary
    ON transaction_summary.account_id = sa.account_id

LEFT JOIN (
    SELECT
        jah.account_id,
        COUNT(*) AS holder_count,

        GROUP_CONCAT(
            CONCAT(c.first_name, ' ', c.last_name)
            ORDER BY c.first_name, c.last_name
            SEPARATOR ', '
        ) AS holder_names

    FROM joint_account_holders jah

    JOIN customer c
        ON c.customer_id = jah.customer_id

    GROUP BY jah.account_id
) holders
    ON holders.account_id = sa.account_id

ORDER BY sa.account_id;

-- Report 3: Active Fixed Deposits
SELECT
    fd.fd_id,
    fd.fd_number,
    sa.account_number,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    fd.deposit_amount AS principal,
    p.plan_name,
    p.term_months,
    p.interest_rate,
    fd.maturity_date,
    fd.next_payout_date
FROM fixed_deposit fd
JOIN savings_account sa ON sa.account_id = fd.linked_account_id
JOIN customer c ON c.customer_id = sa.primary_customer_id
JOIN fixed_deposit_plan p ON p.fd_plan_id = fd.fd_plan_id
WHERE fd.status = 'ACTIVE'
ORDER BY fd.next_payout_date, fd.fd_id;

-- Report 4: Monthly Interest Distribution by Savings Plan
SELECT
    DATE_FORMAT(idist.cycle_end_date, '%Y-%m') AS month,
    sp.plan_name AS account_type,
    COUNT(*) AS interest_credits,
    SUM(idist.interest_amount) AS total_interest
FROM interest_distribution idist
JOIN fixed_deposit fd ON fd.fd_id = idist.fd_id
JOIN savings_account sa ON sa.account_id = fd.linked_account_id
JOIN savings_plan sp ON sp.plan_id = sa.plan_id
GROUP BY DATE_FORMAT(idist.cycle_end_date, '%Y-%m'), sp.plan_id, sp.plan_name
ORDER BY month, sp.plan_id;

-- Report 5: Customer Activity
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    COALESCE(SUM(CASE WHEN at.transaction_type = 'DEPOSIT' THEN at.amount ELSE 0 END), 0.00) AS total_deposits,
    COALESCE(SUM(CASE WHEN at.transaction_type = 'WITHDRAWAL' THEN at.amount ELSE 0 END), 0.00) AS total_withdrawals,
    COALESCE(SUM(CASE WHEN at.transaction_type = 'DEPOSIT' THEN at.amount ELSE 0 END), 0.00)
      - COALESCE(SUM(CASE WHEN at.transaction_type = 'WITHDRAWAL' THEN at.amount ELSE 0 END), 0.00) AS net_activity
FROM customer c
LEFT JOIN (
    SELECT primary_customer_id AS customer_id, account_id FROM savings_account
    UNION
    SELECT customer_id, account_id FROM joint_account_holders
) customer_accounts ON customer_accounts.customer_id = c.customer_id
LEFT JOIN account_transaction at ON at.account_id = customer_accounts.account_id
GROUP BY c.customer_id, c.first_name, c.last_name
ORDER BY c.customer_id;
