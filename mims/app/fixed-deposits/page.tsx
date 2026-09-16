import Link from "next/link";
import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function FDs() {
  return <div className="container">
    <PageHeader title="Fixed Deposits" description="FDs linked to eligible savings accounts." />
    <div className="actions" style={{marginBottom:16}}><Link className="btn" href="/fixed-deposits/new">Create fixed deposit</Link></div>
    <div className="grid grid-3">
      {[
        ["6 months","13%"],["1 year","14%"],["3 years","15%"]
      ].map(x=><div className="card" key={x[0]}><h3>{x[0]}</h3><div className="stat">{x[1]}</div><p className="muted">Interest rate</p></div>)}
    </div>
    <div className="card" style={{marginTop:16}}>
      <div className="table-wrap"><table><thead><tr><th>FD</th><th>Account</th><th>Principal</th><th>Duration</th><th>Rate</th><th>Maturity</th><th>Next payout</th><th>Status</th></tr></thead><tbody></tbody></table></div>
      <div style={{marginTop:16}}><BlockedNotice operation="active fixed deposit query" /></div>
    </div>
  </div>;
}
