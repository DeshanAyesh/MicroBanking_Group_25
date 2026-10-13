import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";

const accountTypes = new Set(["", "INDIVIDUAL", "JOINT"]);
const accountStatuses = new Set(["", "ACTIVE", "INACTIVE"]);
const reconciliationValues = new Set(["", "RECONCILED", "DIFFERENCE"]);

export async function GET(request: NextRequest) {
  const session = requireRole(request, ["ADMIN", "AGENT"]);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const search = (request.nextUrl.searchParams.get("search") ?? "").trim();
  const accountType = request.nextUrl.searchParams.get("type") ?? "";
  const status = request.nextUrl.searchParams.get("status") ?? "";
  const reconciliation =
    request.nextUrl.searchParams.get("reconciliation") ?? "";

  if (search.length > 100) {
    return NextResponse.json(
      { message: "Search text must not exceed 100 characters." },
      { status: 400 }
    );
  }

  if (
    !accountTypes.has(accountType) ||
    !accountStatuses.has(status) ||
    !reconciliationValues.has(reconciliation)
  ) {
    return NextResponse.json(
      { message: "One or more report filters are invalid." },
      { status: 400 }
    );
  }

  const conditions: string[] = [];
  const parameters: string[] = [];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(`(
      account_report.account_number LIKE ?
      OR account_report.primary_customer_name LIKE ?
      OR account_report.holder_names LIKE ?
    )`);
    parameters.push(pattern, pattern, pattern);
  }

  if (accountType) {
    conditions.push("account_report.acc_type = ?");
    parameters.push(accountType);
  }

  if (status) {
    conditions.push("account_report.status = ?");
    parameters.push(status);
  }

  if (reconciliation === "RECONCILED") {
    conditions.push("ABS(account_report.balance_difference) < 0.01");
  } else if (reconciliation === "DIFFERENCE") {
    conditions.push("ABS(account_report.balance_difference) >= 0.01");
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  try {
    const [result] = await getDbPool().execute<RowDataPacket[]>(
      `WITH transaction_summary AS (
         SELECT
           account_id,
           COUNT(*) AS transaction_count,
           SUM(CASE WHEN transaction_type = 'DEPOSIT' THEN amount ELSE 0 END)
             AS total_deposits,
           SUM(CASE WHEN transaction_type = 'WITHDRAWAL' THEN amount ELSE 0 END)
             AS total_withdrawals,
           SUM(CASE WHEN transaction_type = 'INTEREST_CREDIT' THEN amount ELSE 0 END)
             AS total_interest
         FROM account_transaction
         GROUP BY account_id
       ),
       holder_summary AS (
         SELECT
           jah.account_id,
           COUNT(*) AS holder_count,
           GROUP_CONCAT(
             CONCAT(c.first_name, ' ', c.last_name)
             ORDER BY c.first_name, c.last_name
             SEPARATOR ', '
           ) AS holder_names
         FROM joint_account_holders jah
         JOIN customer c ON c.customer_id = jah.customer_id
         GROUP BY jah.account_id
       ),
       account_report AS (
         SELECT
           sa.account_id,
           sa.account_number,
           sa.acc_type,
           sa.status,
           sa.current_balance,
           sp.plan_name,
           CONCAT(primary_customer.first_name, ' ', primary_customer.last_name)
             AS primary_customer_name,
           CASE
             WHEN sa.acc_type = 'JOINT'
               THEN COALESCE(holder_summary.holder_names, '')
             ELSE CONCAT(primary_customer.first_name, ' ', primary_customer.last_name)
           END AS holder_names,
           CASE
             WHEN sa.acc_type = 'JOINT'
               THEN COALESCE(holder_summary.holder_count, 0)
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
         JOIN savings_plan sp ON sp.plan_id = sa.plan_id
         JOIN customer primary_customer
           ON primary_customer.customer_id = sa.primary_customer_id
         LEFT JOIN transaction_summary
           ON transaction_summary.account_id = sa.account_id
         LEFT JOIN holder_summary
           ON holder_summary.account_id = sa.account_id
       )
       SELECT
         account_report.*,
         COUNT(*) OVER () AS report_account_count,
         COALESCE(SUM(account_report.current_balance) OVER (), 0)
           AS report_current_balance,
         COALESCE(SUM(account_report.transaction_count) OVER (), 0)
           AS report_transaction_count,
         COALESCE(
           SUM(
             CASE
               WHEN ABS(account_report.balance_difference) >= 0.01 THEN 1
               ELSE 0
             END
           ) OVER (),
           0
         ) AS report_difference_count
       FROM account_report
       ${whereClause}
       ORDER BY account_report.account_id`,
      parameters
    );

    const firstRow = result[0];
    const summary = {
      account_count: Number(firstRow?.report_account_count ?? 0),
      current_balance: firstRow?.report_current_balance ?? 0,
      transaction_count: Number(firstRow?.report_transaction_count ?? 0),
      difference_count: Number(firstRow?.report_difference_count ?? 0),
    };

    const rows = result.map((row) => {
      const {
        report_account_count,
        report_current_balance,
        report_transaction_count,
        report_difference_count,
        ...account
      } = row;
      return account;
    });

    return NextResponse.json({ summary, rows });
  } catch (error) {
    console.error("Account summary report failed:", error);
    return NextResponse.json(
      { message: "Unable to load the account summary report." },
      { status: 500 }
    );
  }
}
