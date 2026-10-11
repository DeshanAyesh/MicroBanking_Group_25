"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import styles from "./accounts.module.css";

type Account = {
  account_id: number;
  account_number: string;
  acc_type: "INDIVIDUAL" | "JOINT";
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
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [role, setRole] = useState("");

  const visibleAccounts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesSearch =
        !term ||
        `${account.account_number} ${account.plan_name} ${account.primary_customer_name} ${account.holder_names}`
          .toLowerCase()
          .includes(term);
      const matchesType = !typeFilter || account.acc_type === typeFilter;
      const matchesStatus = !statusFilter || account.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, query, typeFilter, statusFilter]);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.status === "ACTIVE"),
    [accounts]
  );
  const activeBalance = useMemo(
    () => activeAccounts.reduce(
      (total, account) => total + Number(account.current_balance),
      0
    ),
    [activeAccounts]
  );
  const jointAccounts = useMemo(
    () => activeAccounts.filter((account) => account.acc_type === "JOINT").length,
    [activeAccounts]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccounts() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/accounts", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load accounts.");
        }
        setAccounts(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(
          error instanceof Error ? error.message : "Unable to load accounts."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAccounts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => setRole(data?.session?.role ?? ""))
      .catch(() => undefined);
  }, []);

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("");
    setStatusFilter("");
  };

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Savings portfolio</span>
          <PageHeader
            title={role === "CUSTOMER" ? "My Savings Accounts" : "Savings Accounts"}
            description={
              role === "CUSTOMER"
                ? "Review your individual and joint savings accounts."
                : "Manage individual and joint accounts, ownership, plans, and balances."
            }
          />
        </div>
        {role === "AGENT" && (
          <Link className="btn" href="/accounts/new">
            + Open savings account
          </Link>
        )}
      </div>

      <section className={styles.metrics} aria-label="Savings account totals">
        <article>
          <span>Active accounts</span>
          <strong>{activeAccounts.length.toLocaleString()}</strong>
          <small>{accounts.length.toLocaleString()} accessible accounts in total</small>
        </article>
        <article>
          <span>Active balance</span>
          <strong>{money(activeBalance)}</strong>
          <small>Combined current balance of active accounts</small>
        </article>
        <article>
          <span>Joint accounts</span>
          <strong>{jointAccounts.toLocaleString()}</strong>
          <small>Active accounts shared by multiple holders</small>
        </article>
      </section>

      <section className={styles.accountPanel}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Account register</h2>
            <p>Search accounts and open a record to inspect ownership and transactions.</p>
          </div>
          <span className="badge">{visibleAccounts.length} results</span>
        </div>

        <div className={styles.filters}>
          <label className={styles.search}>
            <span>Search</span>
            <input
              aria-label="Search accounts"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Account number, customer, holder, or plan"
            />
          </label>
          <label>
            <span>Account type</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="JOINT">Joint</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <button className="btn secondary" type="button" onClick={clearFilters}>
            Clear
          </button>
        </div>

        {loading && <div className={styles.state}>Loading savings accounts...</div>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          visibleAccounts.length ? (
            <div className="table-wrap">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Account and customer</th>
                    <th>Plan</th>
                    <th>Ownership</th>
                    <th>Current balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAccounts.map((account) => (
                    <tr key={account.account_id}>
                      <td>
                        <strong className={styles.accountNumber}>{account.account_number}</strong>
                        <span>{account.primary_customer_name}</span>
                      </td>
                      <td>
                        <strong>{account.plan_name}</strong>
                        <span className={styles.mutedLine}>Savings plan</span>
                      </td>
                      <td>
                        <span className="badge">{account.acc_type}</span>
                        <strong>{account.holder_names}</strong>
                        <span className={styles.mutedLine}>
                          {account.holder_count} holder{account.holder_count === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td><strong className={styles.balance}>{money(account.current_balance)}</strong></td>
                      <td>
                        <span className={`${styles.status} ${account.status === "ACTIVE" ? styles.active : styles.inactive}`}>
                          {account.status}
                        </span>
                      </td>
                      <td>
                        <Link className={styles.viewLink} href={`/accounts/${account.account_id}`}>
                          View account →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.state}>
              <strong>No savings accounts found</strong>
              <span>Clear the filters or try a different search.</span>
            </div>
          )
        )}
      </section>
    </div>
  );
}
