"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type FixedDeposit = {
  fd_id: number;
  fd_number: string;
  account_number: string;
  plan_name: string;
  term_months: number;
  interest_rate: string | number;
  deposit_amount: string | number;
  maturity_date: string;
  next_payout_date: string;
  status: string;
};

const money = (value: string | number) =>
  `LKR ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
  })}`;

export default function FixedDepositsPage() {
  const [rows, setRows] = useState<FixedDeposit[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/fixed-deposits")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load fixed deposits.");
        }

        setRows(data.fixedDeposits || []);
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load fixed deposits."
        );
      });
  }, []);

  return (
    <div className="container">
      <PageHeader
        title="Fixed Deposits"
        description="Fixed deposits funded from linked savings accounts."
      />

      <div className="actions" style={{ marginBottom: 16 }}>
        <Link className="btn" href="/fixed-deposits/new">
          Create fixed deposit
        </Link>
      </div>

      <div className="card">
        {error && <p className="error">{error}</p>}

        {!error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>FD</th>
                  <th>Account</th>
                  <th>Principal</th>
                  <th>Plan</th>
                  <th>Rate</th>
                  <th>Maturity</th>
                  <th>Next payout</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.fd_id}>
                    <td>
                      <strong>{row.fd_number}</strong>
                    </td>
                    <td>{row.account_number}</td>
                    <td>{money(row.deposit_amount)}</td>
                    <td>
                      {row.plan_name} ({row.term_months} months)
                    </td>
                    <td>{row.interest_rate}%</td>
                    <td>{row.maturity_date}</td>
                    <td>{row.next_payout_date}</td>
                    <td>
                      <span className="badge">{row.status}</span>
                    </td>
                  </tr>
                ))}

                {!rows.length && (
                  <tr>
                    <td colSpan={8} className="muted">
                      No fixed deposits found.
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
