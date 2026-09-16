import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function AgentPage() {
  return <div className="container">
    <PageHeader title="Agent Dashboard" description="Assigned customers and today's banking activity." />
    <div className="grid grid-3">
      {["Assigned customers","Today's deposits","Today's withdrawals"].map(x=><div className="card" key={x}><div className="muted">{x}</div><div className="stat">—</div></div>)}
    </div>
    <div style={{marginTop:16}}><BlockedNotice operation="agent dashboard queries" /></div>
    <div className="card" style={{marginTop:16}}>
      <h2>Agent actions</h2>
      <div className="actions">
        <a className="btn" href="/customers/new">Register customer</a>
        <a className="btn secondary" href="/transactions/new">Process transaction</a>
        <a className="btn secondary" href="/fixed-deposits/new">Create FD</a>
      </div>
    </div>
  </div>;
}
