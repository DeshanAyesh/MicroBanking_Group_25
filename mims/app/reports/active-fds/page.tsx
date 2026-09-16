import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function Report() {
  return <div className="container">
    <PageHeader title="Active Fixed Deposits" description="FD, account, customer, principal, duration, rate and next interest payout." />
    <div className="card">
      <div className="table-wrap"><table><thead><tr><th>Report result</th><th>Value</th></tr></thead><tbody></tbody></table></div>
      <div style={{marginTop:16}}><BlockedNotice operation="Active Fixed Deposits SQL query" /></div>
    </div>
  </div>;
}
