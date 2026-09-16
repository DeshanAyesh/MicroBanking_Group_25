import Link from "next/link";
import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function TransactionsPage() {
  return <div className="container">
    <PageHeader title="Transactions" description="Deposits, withdrawals and interest credits." />
    <div className="actions" style={{marginBottom:16}}><Link className="btn" href="/transactions/new">New transaction</Link></div>
    <div className="card">
      <div className="grid grid-2">
        <div className="field"><label>Search reference/account</label><input /></div>
        <div className="field"><label>Type</label><select><option>All types</option><option>DEPOSIT</option><option>WITHDRAWAL</option><option>INTEREST_CREDIT</option></select></div>
      </div>
      <div className="table-wrap" style={{marginTop:16}}><table><thead><tr><th>Reference</th><th>Account</th><th>Customer</th><th>Type</th><th>Amount</th><th>Timestamp</th><th>Agent</th><th>Status</th></tr></thead><tbody></tbody></table></div>
      <div style={{marginTop:16}}><BlockedNotice operation="transaction list/search/filter query" /></div>
    </div>
  </div>;
}
