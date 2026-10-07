"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type Row = {
  fd_id: number;
  fd_number: string;
  account_number: string;
  customer_name: string;
  principal: string | number;
  plan_name: string;
  term_months: number;
  interest_rate: string | number;
  maturity_date: string;
  next_payout_date: string;
};

const money = (value: string | number) =>
  `LKR ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
  })}`;

export default function ActiveFixedDepositsReport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reports/active-fds")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load report.");
        }

        setRows(data.rows || []);
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load report."
        );
      });
  }, []);

  return (
    <div className="container">
      <PageHeader
        title="Active Fixed Deposits"
        description="FD, account, customer, principal, duration, rate and next interest payout."
      />

      <div className="card">
        {error && <p className="error">{error}</p>}

        {!error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>FD</th>
                  <th>Account / customer</th>
                  <th>Principal</th>
                  <th>Plan</th>
                  <th>Rate</th>
                  <th>Maturity</th>
                  <th>Next payout</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.fd_id}>
                    <td>{row.fd_number}</td>
                    <td>
                      {row.account_number}
                      <br />
                      <span className="muted small">
                        {row.customer_name}
                      </span>
                    </td>
                    <td>{money(row.principal)}</td>
                    <td>
                      {row.plan_name} ({row.term_months} months)
                    </td>
                    <td>{row.interest_rate}%</td>
                    <td>{row.maturity_date}</td>
                    <td>{row.next_payout_date}</td>
                  </tr>
                ))}

                {!rows.length && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No active fixed deposits found.
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
