import type { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db/mysql";

type MonthlyActivity = {
  period: string;
  label: string;
  deposits: string | number;
  withdrawals: string | number;
  interest: string | number;
};

const summarySql = `
  SELECT
    COUNT(*) AS total_accounts,
    COALESCE(SUM(status = 'ACTIVE'), 0) AS active_accounts,
    COALESCE(SUM(CASE WHEN status = 'ACTIVE' AND acc_type = 'JOINT' THEN 1 ELSE 0 END), 0) AS active_joint_accounts,
    COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN current_balance ELSE 0 END), 0) AS active_total_balance,
    (SELECT COUNT(*) FROM customer WHERE status = 'ACTIVE') AS active_customers,
    (SELECT COUNT(*) FROM fixed_deposit WHERE status = 'ACTIVE') AS active_fixed_deposits,
    (SELECT COALESCE(SUM(deposit_amount), 0) FROM fixed_deposit WHERE status = 'ACTIVE') AS active_fd_principal
  FROM savings_account
`;

const monthlySql = `
  SELECT
    DATE_FORMAT(transaction_date, '%Y-%m') AS period,
    DATE_FORMAT(transaction_date, '%b %Y') AS label,
    COALESCE(SUM(CASE WHEN transaction_type = 'DEPOSIT' THEN amount ELSE 0 END), 0) AS deposits,
    COALESCE(SUM(CASE WHEN transaction_type = 'WITHDRAWAL' THEN amount ELSE 0 END), 0) AS withdrawals,
    COALESCE(SUM(CASE WHEN transaction_type = 'INTEREST_CREDIT' THEN amount ELSE 0 END), 0) AS interest
  FROM account_transaction
  WHERE transaction_date >= ? AND transaction_date < DATE_ADD(?, INTERVAL 1 DAY)
  GROUP BY DATE_FORMAT(transaction_date, '%Y-%m'), DATE_FORMAT(transaction_date, '%b %Y')
  ORDER BY period
`;

const planSql = `
  SELECT
    sp.plan_id,
    sp.plan_name,
    COUNT(sa.account_id) AS account_count,
    COALESCE(SUM(sa.current_balance), 0) AS total_balance,
    COALESCE(AVG(sa.current_balance), 0) AS average_balance
  FROM savings_plan sp
  LEFT JOIN savings_account sa
    ON sa.plan_id = sp.plan_id
   AND sa.status = 'ACTIVE'
  GROUP BY sp.plan_id, sp.plan_name
  ORDER BY account_count DESC, sp.plan_name
`;

const transactionTypeSql = `
  SELECT
    transaction_type,
    COUNT(*) AS transaction_count,
    COALESCE(SUM(amount), 0) AS total_amount
  FROM account_transaction
  WHERE transaction_date >= ? AND transaction_date < DATE_ADD(?, INTERVAL 1 DAY)
  GROUP BY transaction_type
  ORDER BY transaction_type
`;

export async function getAnalyticsReport(start: string, end: string) {
  const connection = await getDbPool().getConnection();
  let transactionStarted = false;

  try {
    await connection.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await connection.query("START TRANSACTION READ ONLY");
    transactionStarted = true;

    const [summaryRows] = await connection.query<RowDataPacket[]>(summarySql);
    const [monthlyRows] = await connection.execute<RowDataPacket[]>(monthlySql, [start, end]);
    const [planRows] = await connection.query<RowDataPacket[]>(planSql);
    const [transactionTypeRows] = await connection.execute<RowDataPacket[]>(transactionTypeSql, [start, end]);

    await connection.commit();
    transactionStarted = false;

    const monthlyActivity: MonthlyActivity[] = [];
    const cursor = new Date(`${start.slice(0, 7)}-01T00:00:00Z`);

    while (cursor.toISOString().slice(0, 7) <= end.slice(0, 7)) {
      const period = cursor.toISOString().slice(0, 7);
      const recordedMonth = monthlyRows.find(
        (row) => row.period === period
      ) as MonthlyActivity | undefined;

      monthlyActivity.push(recordedMonth ?? {
        period,
        label: cursor.toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
        deposits: 0,
        withdrawals: 0,
        interest: 0,
      });

      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return {
      period: { start, end },
      generatedAt: new Date().toISOString(),
      summary: summaryRows[0],
      monthlyActivity,
      planDistribution: planRows,
      transactionTypes: transactionTypeRows,
    };
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}
