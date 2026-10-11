"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import styles from "./account-summary.module.css";

type SummaryRow = {
  account_id: number;
  account_number: string;
  acc_type: "INDIVIDUAL" | "JOINT";
  status: string;
  plan_name: string;
  primary_customer_name: string;
  holder_names: string;
  holder_count: number;
  transaction_count: number;
  total_deposits: string | number;
  total_withdrawals: string | number;
  total_interest: string | number;
  current_balance: string | number;
  calculated_balance: string | number;
  balance_difference: string | number;
};

type ReportSummary = {
  account_count: number;
  current_balance: string | number;
  transaction_count: number;
  difference_count: number;
};

type ReportResponse = {
  summary: ReportSummary;
  rows: SummaryRow[];
};

const emptySummary: ReportSummary = {
  account_count: 0,
  current_balance: 0,
  transaction_count: 0,
  difference_count: 0,
};

function money(value: string | number) {
  return `LKR ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AccountSummaryPage() {
  const [report, setReport] = useState<ReportResponse>({
    summary: emptySummary,
    rows: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState("");
  const [status, setStatus] = useState("");
  const [reconciliation, setReconciliation] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReport() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/reports/account-summary${query}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load report.");
        }

        setReport(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(
          error instanceof Error ? error.message : "Unable to load report."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadReport();
    return () => controller.abort();
  }, [query]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parameters = new URLSearchParams();
    if (search.trim()) parameters.set("search", search.trim());
    if (accountType) parameters.set("type", accountType);
    if (status) parameters.set("status", status);
    if (reconciliation) parameters.set("reconciliation", reconciliation);
    const value = parameters.toString();
    setQuery(value ? `?${value}` : "");
  }

  function clearFilters() {
    setSearch("");
    setAccountType("");
    setStatus("");
    setReconciliation("");
    setQuery("");
  }

  function exportCsv() {
    const headings = [
      "Account",
      "Primary customer",
      "Plan",
      "Type",
      "Status",
      "Holders",
      "Transactions",
      "Deposits",
      "Withdrawals",
      "Interest",
      "Current balance",
      "Calculated balance",
      "Difference",
    ];
    const rows = report.rows.map((row) => [
      row.account_number,
      row.primary_customer_name,
      row.plan_name,
      row.acc_type,
      row.status,
      row.holder_names,
      row.transaction_count,
      row.total_deposits,
      row.total_withdrawals,
      row.total_interest,
      row.current_balance,
      row.calculated_balance,
      row.balance_difference,
    ]);
    const csv = [headings, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value);
            const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
            return `"${safe.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "account-wise-summary.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.headingRow}>
        <div>
          <Link className={styles.backLink} href="/reports">
            ← Reports
          </Link>
          <PageHeader
            title="Account-wise Summary"
            description="Account ownership, transaction totals, balances, and database reconciliation in one report."
          />
        </div>
        <button
          className="btn secondary"
          type="button"
          onClick={exportCsv}
          disabled={loading || !!error || report.rows.length === 0}
        >
          Export CSV
        </button>
      </div>

      <form className={styles.filters} onSubmit={applyFilters}>
        <label className={styles.searchField}>
          Search
          <input
            value={search}
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Account, customer, or holder"
          />
        </label>
        <label>
          Account type
          <select
            value={accountType}
            onChange={(event) => setAccountType(event.target.value)}
          >
            <option value="">All types</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="JOINT">Joint</option>
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <label>
          Reconciliation
          <select
            value={reconciliation}
            onChange={(event) => setReconciliation(event.target.value)}
          >
            <option value="">All results</option>
            <option value="RECONCILED">Reconciled</option>
            <option value="DIFFERENCE">Difference found</option>
          </select>
        </label>
        <div className={styles.filterActions}>
          <button className="btn" disabled={loading}>Apply filters</button>
          <button
            className="btn secondary"
            type="button"
            onClick={clearFilters}
            disabled={loading}
          >
            Clear
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <section className={styles.metrics} aria-label="Filtered report totals">
        <article>
          <span>Accounts shown</span>
          <strong>{report.summary.account_count.toLocaleString()}</strong>
          <small>Matches the selected filters</small>
        </article>
        <article>
          <span>Current balance</span>
          <strong>{money(report.summary.current_balance)}</strong>
          <small>Stored balance across these accounts</small>
        </article>
        <article>
          <span>Transactions</span>
          <strong>{report.summary.transaction_count.toLocaleString()}</strong>
          <small>Deposits, withdrawals, and interest</small>
        </article>
        <article className={report.summary.difference_count ? styles.warningMetric : ""}>
          <span>Differences found</span>
          <strong>{report.summary.difference_count.toLocaleString()}</strong>
          <small>Accounts requiring reconciliation</small>
        </article>
      </section>

      <section className={styles.reportPanel}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Account register</h2>
            <p>Stored balances are checked against complete transaction history.</p>
          </div>
          <span className="badge">{report.summary.account_count} results</span>
        </div>

        {loading ? (
          <div className={styles.status}>Loading account summary...</div>
        ) : report.rows.length === 0 ? (
          <div className={styles.status}>No accounts match the selected filters.</div>
        ) : (
          <div className="table-wrap">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Plan and type</th>
                  <th>Holders</th>
                  <th>Transaction totals</th>
                  <th>Current balance</th>
                  <th>Reconciliation</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => {
                  const reconciled = Math.abs(Number(row.balance_difference)) < 0.01;
                  return (
                    <tr key={row.account_id}>
                      <td>
                        <strong className={styles.accountNumber}>{row.account_number}</strong>
                        <span>{row.primary_customer_name}</span>
                        <span className={`${styles.statusBadge} ${row.status === "ACTIVE" ? styles.active : styles.inactive}`}>
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <strong>{row.plan_name}</strong>
                        <span className="badge">{row.acc_type}</span>
                      </td>
                      <td>
                        <strong>{row.holder_names}</strong>
                        <span>{row.holder_count} holder{row.holder_count === 1 ? "" : "s"}</span>
                      </td>
                      <td>
                        <strong>{Number(row.transaction_count).toLocaleString()} transactions</strong>
                        <span className={styles.deposit}>+ {money(row.total_deposits)}</span>
                        <span className={styles.withdrawal}>− {money(row.total_withdrawals)}</span>
                        <span>Interest {money(row.total_interest)}</span>
                      </td>
                      <td>
                        <strong>{money(row.current_balance)}</strong>
                        <span>Calculated {money(row.calculated_balance)}</span>
                      </td>
                      <td>
                        <span className={`${styles.reconciliation} ${reconciled ? styles.reconciled : styles.difference}`}>
                          {reconciled ? "✓ Reconciled" : "⚠ Difference found"}
                        </span>
                        <span>{reconciled ? "Difference LKR 0.00" : money(row.balance_difference)}</span>
                      </td>
                      <td>
                        <Link className={styles.detailsLink} href={`/accounts/${row.account_id}`}>
                          View account →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
