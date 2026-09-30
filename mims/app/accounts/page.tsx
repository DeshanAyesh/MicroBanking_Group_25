"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  return (
    <div className="container">
      <PageHeader
        title="Savings Accounts"
        description="Individual and joint savings accounts."
      />

      <div className="actions" style={{ marginBottom: 16 }}>
        <Link className="btn" href="/accounts/new">
          Open savings account
        </Link>
      </div>

      <div className="card">
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
                {accounts.map((account) => (
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

                {accounts.length === 0 && (
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