import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function Report() {
  return <div className="container">
    <PageHeader title="Monthly Interest Distribution" description="month, account type, number of interest credits and total interest distributed." />
    <div className="card">
      <div className="table-wrap"><table><thead><tr><th>Report result</th><th>Value</th></tr></thead><tbody></tbody></table></div>
      <div style={{marginTop:16}}><BlockedNotice operation="Monthly Interest Distribution SQL query" /></div>
    </div>
  </div>;
}
