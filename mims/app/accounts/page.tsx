"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type Account = {
  account_id: number;
  account_number: string;
  acc_type: string;
  current_balance: string | number;
  status: string;
  plan_name: string;
  primary_customer_name: string;
  holder_names: string;
  holder_count: number;
};

function money(value: string | number) {
  return `LKR ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");

  const visibleAccounts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return accounts;
    return accounts.filter((account) =>
      `${account.account_number} ${account.plan_name} ${account.primary_customer_name} ${account.holder_names}`
        .toLowerCase()
        .includes(term)
    );
  }, [accounts, query]);

  const totalBalance = useMemo(
    () => accounts.reduce((total, account) => total + Number(account.current_balance), 0),
    [accounts]
  );

  useEffect(() => {
    async function loadAccounts() {
      try {
        const response = await fetch("/api/accounts");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load accounts.");
        }

        setAccounts(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to load accounts."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAccounts();
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then(async response => response.ok ? response.json() : null).then(data => setRole(data?.session?.role ?? "")).catch(() => undefined);
  }, []);

  return (
    <div className="container">
      <PageHeader
        title="Savings Accounts"
        description="Individual and joint savings accounts."
      />

      <div className="grid grid-3 account-summary-grid">
        <div className="card metric-card"><span className="metric-label">TOTAL ACCOUNTS</span><div className="stat">{accounts.length}</div><span className="muted small">All accessible savings accounts</span></div>
        <div className="card metric-card"><span className="metric-label">TOTAL BALANCE</span><div className="stat">{money(totalBalance)}</div><span className="muted small">Current combined account balance</span></div>
        <div className="card metric-card"><span className="metric-label">JOINT ACCOUNTS</span><div className="stat">{accounts.filter(account => account.acc_type === "JOINT").length}</div><span className="muted small">Accounts with multiple holders</span></div>
      </div>

      <div className="card account-list-card">
        <div className="list-toolbar">
          <div><h2>Account register</h2><p className="muted">Review balances, holders, plans, and account status.</p></div>
          <div className="toolbar-actions"><input aria-label="Search accounts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search account or customer" />{role === "AGENT" && <Link className="btn" href="/accounts/new">Open savings account</Link>}</div>
        </div>
        {loading && <p className="muted">Loading savings accounts...</p>}

        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Plan</th>
                  <th>Type</th>
                  <th>Balance</th>
                  <th>Holders</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {visibleAccounts.map((account) => (
                  <tr key={account.account_id}>
                    <td>
                      <Link href={`/accounts/${account.account_id}`}>
                        <strong>{account.account_number}</strong>
                      </Link>
                      <br />
                      <span className="muted small">
                        {account.primary_customer_name}
                      </span>
                    </td>
                    <td>{account.plan_name}</td>
                    <td>
                      <span className="badge">{account.acc_type}</span>
                    </td>
                    <td>{money(account.current_balance)}</td>
                    <td>
                      {account.holder_names}
                      <br />
                      <span className="muted small">
                        {account.holder_count} holder
                        {account.holder_count === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td>
                      <span className="badge">{account.status}</span>
                    </td>
                  </tr>
                ))}

                {visibleAccounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      No savings accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
