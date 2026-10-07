--
-- Report 1: Agent-wise Transactions
-- Show total transaction count and total transaction value.
-- Tables likely involved: transactions, users/employees/agents.
--
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
--
-- Report 3: Active FDs
-- Show FD, account, customer, principal, duration, rate, next payout.
-- Tables likely involved: fixed_deposits, savings_accounts, account_holders,
-- customers, fd_plans.
--
-- Report 4: Monthly Interest Distribution
-- Show month, account type, number of interest credits, total interest distributed.
-- Tables likely involved: interest_distribution, transactions, savings_accounts/plans.
--
-- Report 5: Customer Activity
-- Show total deposits, total withdrawals, net activity.
-- Tables likely involved: customers, account_holders, savings_accounts, transactions.
--
-- For every report, document joins, grouping, filtering, ordering and expected columns
-- before writing the SQL.
