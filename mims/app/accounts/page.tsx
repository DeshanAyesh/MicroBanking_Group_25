import Link from "next/link";
import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function AccountsPage() {
  return <div className="container">
    <PageHeader title="Savings Accounts" description="Individual and joint savings accounts." />
    <div className="actions" style={{marginBottom:16}}><Link className="btn" href="/accounts/new">Open savings account</Link></div>
    <div className="card">
      <div className="table-wrap"><table><thead><tr><th>Account</th><th>Plan</th><th>Balance</th><th>Holders</th><th>Status</th></tr></thead><tbody></tbody></table></div>
      <div style={{marginTop:16}}><BlockedNotice operation="account list query" /></div>
    </div>
  </div>;
}
