import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

const stats = ["Total customers","Savings accounts","Total deposits","Total withdrawals","Active FDs","Interest distributed"];

export default function AdminPage() {
  return <div className="container">
    <PageHeader title="Admin Dashboard" description="Database-backed management overview." />
    <div className="grid grid-3">
      {stats.map(s=><div className="card" key={s}><div className="muted small">{s}</div><div className="stat">—</div><div className="small muted">SQL TODO</div></div>)}
    </div>
    <div style={{marginTop:16}}><BlockedNotice operation="dashboard aggregate queries" /></div>
    <div className="card" style={{marginTop:16}}>
      <h2>Recent transactions</h2>
      <p className="muted">No fake transactions are shown. Connect the report/query TODO after implementing SQL.</p>
    </div>
  </div>;
}
