import { PageHeader } from "@/components/PageHeader";
import { ProcessInterestButton } from "@/components/ProcessInterestButton";
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const pool = getDbPool();

  const [[{ count: totalCustomers }]] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM customer",
  );

  const [[{ count: savingsAccounts }]] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM savings_account",
  );

  const [[{ total: totalDeposits }]] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(amount), 0) AS total
       FROM account_transaction
       WHERE transaction_type = 'DEPOSIT'`,
  );

  const [[{ total: totalWithdrawals }]] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(amount), 0) AS total
       FROM account_transaction
       WHERE transaction_type = 'WITHDRAWAL'`,
  );

  const [[{ count: activeFDs }]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count
       FROM fixed_deposit
       WHERE status = 'ACTIVE'`,
  );

  const [[{ total: interestDistributed }]] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(interest_amount), 0) AS total
       FROM interest_distribution`,
  );

  const stats = [
    { label: "Total customers", value: totalCustomers },
    { label: "Savings accounts", value: savingsAccounts },
    { label: "Total deposits", value: totalDeposits },
    { label: "Total withdrawals", value: totalWithdrawals },
    { label: "Active FDs", value: activeFDs },
    { label: "Interest distributed", value: interestDistributed },
  ];

  return (
    <div className="container">
      <PageHeader
        title="Admin Dashboard"
        description="Database-backed management overview."
      />

      <div className="grid grid-3">
        {stats.map((stat) => (
          <div className="card" key={stat.label}>
            <div className="muted small">{stat.label}</div>
            <div className="stat">{String(stat.value)}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Global operations</h2>
        <p className="muted">
          Calculate monthly interest for eligible fixed deposits.
        </p>

        <ProcessInterestButton />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Recent transactions</h2>
        <p className="muted">
          Figures are calculated from the current database records.
        </p>
      </div>
    </div>
  );
}
