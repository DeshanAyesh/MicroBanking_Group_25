import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function Report() {
  return <div className="container">
    <PageHeader title="Customer Activity" description="total deposits, total withdrawals and net activity." />
    <div className="card">
      <div className="table-wrap"><table><thead><tr><th>Report result</th><th>Value</th></tr></thead><tbody></tbody></table></div>
      <div style={{marginTop:16}}><BlockedNotice operation="Customer Activity SQL query" /></div>
    </div>
  </div>;
}
