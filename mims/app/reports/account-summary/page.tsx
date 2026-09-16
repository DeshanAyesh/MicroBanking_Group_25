import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function Report() {
  return <div className="container">
    <PageHeader title="Account-wise Summary" description="transaction summary and current balance." />
    <div className="card">
      <div className="table-wrap"><table><thead><tr><th>Report result</th><th>Value</th></tr></thead><tbody></tbody></table></div>
      <div style={{marginTop:16}}><BlockedNotice operation="Account-wise Summary SQL query" /></div>
    </div>
  </div>;
}
