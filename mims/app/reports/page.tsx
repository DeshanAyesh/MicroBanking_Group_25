import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export default function Reports() {
  const reports = [
    ["analytics", "Banking Analytics", "Live metrics and transaction trends across the bank."],
    ["agent-transactions", "Agent-wise Transactions", "Transaction volume and value processed by each agent."],
    ["account-summary", "Account-wise Summary", "Balances, transaction totals, and reconciliation results."],
    ["active-fds", "Active Fixed Deposits", "Current deposits, terms, rates, and upcoming payouts."],
    ["interest-distribution", "Monthly Interest Distribution", "Interest credits by month and account type."],
    ["customer-activity", "Customer Activity", "Customer deposit, withdrawal, and net activity totals."],
  ];

  return (
    <div className="container">
      <PageHeader
        title="Reports & Analytics"
        description="Database-driven reports for operational review, reconciliation, and banking trends."
      />
      <div className="grid grid-3">
        {reports.map(([slug, title, description]) => (
          <Link className="card report-card" href={`/reports/${slug}`} key={slug}>
            <span className="feature-number">{slug === "analytics" ? "OVERVIEW" : "REPORT"}</span>
            <h3>{title}</h3>
            <p className="muted">{description}</p>
            <span className="report-link">Open report →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
