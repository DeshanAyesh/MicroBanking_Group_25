import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";

export async function GET(request: NextRequest) {
  // // const session = requireRole(request, ["ADMIN", "AGENT"]);

  // // if (!session) {
  // //   return NextResponse.json(
  // //     { message: "Unauthorized." },
  // //     { status: 401 }
  // //   );
  // }

  try {
    const pool = getDbPool();

    const [rows] = await pool.execute(
      `SELECT
          sa.account_id,
          sa.account_number,
          sa.acc_type,
          sa.status,
          sa.current_balance,
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

       ORDER BY sa.account_id`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Account summary report failed:", error);

    return NextResponse.json(
      { message: "Unable to load the account summary report." },
      { status: 500 }
    );
  }
}