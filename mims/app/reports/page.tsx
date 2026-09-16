import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
export default function Reports() {
  const reports = [
    ["agent-transactions","Agent-wise Transactions"],["account-summary","Account-wise Summary"],
    ["active-fds","Active Fixed Deposits"],["interest-distribution","Monthly Interest Distribution"],
    ["customer-activity","Customer Activity"]
  ];
  return <div className="container">
    <PageHeader title="Reports" description="Five database-driven reports required by the project." />
    <div className="grid grid-3">{reports.map(r=><Link className="card" href={`/reports/${r[0]}`} key={r[0]}><h3>{r[1]}</h3><p className="muted">Open report →</p></Link>)}</div>
  </div>;
}
