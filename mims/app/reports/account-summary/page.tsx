"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type SummaryRow = {
  account_id: number;
  account_number: string;
  acc_type: string;
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

function money(value: string | number) {
  return `LKR ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AccountSummaryPage() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        const response = await fetch("/api/reports/account-summary");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load report.");
        }

        setRows(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load report."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  return (
    <div className="container">
      <PageHeader
        title="Account-wise Summary"
        description="Transaction totals and balance reconciliation for every savings account."
      />

      <div className="card">
        {loading && <p className="muted">Loading account summary...</p>}

        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Plan</th>
                  <th>Type</th>
                  <th>Holders</th>
                  <th>Transactions</th>
                  <th>Deposits</th>
                  <th>Withdrawals</th>
                  <th>Interest</th>
                  <th>Current balance</th>
                  <th>Calculated balance</th>
                  <th>Difference</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const reconciled =
                    Math.abs(Number(row.balance_difference)) < 0.01;

                  return (
                    <tr key={row.account_id}>
                      <td>
                        <strong>{row.account_number}</strong>
                        <br />
                        <span className="muted small">
                          {row.primary_customer_name}
                        </span>
                      </td>

                      <td>{row.plan_name}</td>

                      <td>
                        <span className="badge">{row.acc_type}</span>
                      </td>

                      <td>
                        {row.holder_names}
                        <br />
                        <span className="muted small">
                          {row.holder_count} holder
                          {row.holder_count === 1 ? "" : "s"}
                        </span>
                      </td>

                      <td>{row.transaction_count}</td>
                      <td>{money(row.total_deposits)}</td>
                      <td>{money(row.total_withdrawals)}</td>
                      <td>{money(row.total_interest)}</td>
                      <td>{money(row.current_balance)}</td>
                      <td>{money(row.calculated_balance)}</td>

                      <td>
                        <span
                          className={
                            reconciled
                              ? "badge success"
                              : "badge danger"
                          }
                        >
                          {money(row.balance_difference)}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="muted">
                      No account records found.
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