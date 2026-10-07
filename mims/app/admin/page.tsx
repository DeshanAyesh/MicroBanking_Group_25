import { PageHeader } from "@/components/PageHeader";
import { getDbPool } from "@/lib/db/mysql";
import { RowDataPacket } from "mysql2";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const pool = getDbPool();
  
  const [[{ count: totalCustomers }]] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM customer");
  const [[{ count: savingsAccounts }]] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM savings_account");
  const [[{ total: totalDeposits }]] = await pool.query<RowDataPacket[]>("SELECT COALESCE(SUM(amount), 0) as total FROM account_transaction WHERE transaction_type = 'DEPOSIT'");
  const [[{ total: totalWithdrawals }]] = await pool.query<RowDataPacket[]>("SELECT COALESCE(SUM(amount), 0) as total FROM account_transaction WHERE transaction_type = 'WITHDRAWAL'");
  const [[{ count: activeFDs }]] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM fixed_deposit WHERE status = 'ACTIVE'");
  const [[{ total: interestDistributed }]] = await pool.query<RowDataPacket[]>("SELECT COALESCE(SUM(interest_amount), 0) as total FROM interest_distribution");

  const stats = [
    { label: "Total customers", value: totalCustomers },
    { label: "Savings accounts", value: savingsAccounts },
    { label: "Total deposits", value: totalDeposits },
    { label: "Total withdrawals", value: totalWithdrawals },
    { label: "Active FDs", value: activeFDs },
    { label: "Interest distributed", value: interestDistributed },
  ];

  return <div className="container">
    <PageHeader title="Admin Dashboard" description="Database-backed management overview." />
    <div className="grid grid-3">
      {stats.map(s=><div className="card" key={s.label}><div className="muted small">{s.label}</div><div className="stat">{s.value}</div></div>)}
    </div>
    <div className="card" style={{marginTop:16}}>
      <h2>Recent transactions</h2>
      <p className="muted">Figures are calculated from the current database records.</p>
    </div>
  </div>;
}
