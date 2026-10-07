"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

type Account = {
  account_id: number;
  account_number: string;
  acc_type: string;
  current_balance: string | number;
  status: string;
  created_at: string;
  plan_name: string;
  interest_rate: string | number;
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

export default function AccountDetailsPage() {
  const params = useParams();
  const accountId = params.id;

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
        const response = await fetch(`/api/accounts/${accountId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load account.");
        }

        setAccount(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to load account."
        );
      } finally {
        setLoading(false);
      }
    }

    if (accountId) {
      loadAccount();
    }
  }, [accountId]);

  return (
    <div className="container">
      <PageHeader
        title="Account Details"
        description="Savings account information and account holders."
      />

      <div className="actions" style={{ marginBottom: 16 }}>
        <Link className="btn secondary" href="/accounts">
          Back to accounts
        </Link>

        {account && (
          <Link
            className="btn"
            href={`/accounts/${account.account_id}/transactions`}
          >
            View transactions
          </Link>
        )}
      </div>

      <div className="card">
        {loading && <p className="muted">Loading account details...</p>}
        {error && <p className="error">{error}</p>}

        {account && !loading && !error && (
          <div className="table-wrap">
            <table>
              <tbody>
                <tr>
                  <th>Account number</th>
                  <td>{account.account_number}</td>
                </tr>
                <tr>
                  <th>Account type</th>
                  <td><span className="badge">{account.acc_type}</span></td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td><span className="badge">{account.status}</span></td>
                </tr>
                <tr>
                  <th>Savings plan</th>
                  <td>{account.plan_name}</td>
                </tr>
                <tr>
                  <th>Interest rate</th>
                  <td>{account.interest_rate}%</td>
                </tr>
                <tr>
                  <th>Current balance</th>
                  <td>{money(account.current_balance)}</td>
                </tr>
                <tr>
                  <th>Primary customer</th>
                  <td>{account.primary_customer_name}</td>
                </tr>
                <tr>
                  <th>Account holders</th>
                  <td>
                    {account.holder_names}
                    <br />
                    <span className="muted small">
                      {account.holder_count} holder
                      {account.holder_count === 1 ? "" : "s"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th>Opened on</th>
                  <td>{new Date(account.created_at).toLocaleString("en-LK")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}