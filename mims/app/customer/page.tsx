import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function CustomerPage() {
  return <div className="container">
    <PageHeader title="Customer Dashboard" description="Only the authenticated customer's own records should be displayed." />
    <div className="grid grid-3">
      {["My accounts","Current balances","Active fixed deposits"].map(x=><div className="card" key={x}><div className="muted">{x}</div><div className="stat">—</div></div>)}
    </div>
    <div style={{marginTop:16}}><BlockedNotice operation="customer-scoped account and transaction queries" /></div>
    <div className="card" style={{marginTop:16}}>
      <h2>Privacy rule</h2>
      <p className="muted">Customer APIs must scope every query to the authenticated user's customer relationship. Never accept an arbitrary customer ID from the browser as proof of ownership.</p>
    </div>
  </div>;
}
