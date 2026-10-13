"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type Row = {
  month: string;
  account_type: string;
  interest_credits: string | number;
  total_interest: string | number;
};

export default function InterestDistributionReport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reports/interest-distribution")
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
        title="Monthly Interest Distribution"
        description="Month, account type, number of interest credits and total interest distributed."
      />

      <div className="card">
        {error && <p className="error">{error}</p>}

        {!error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Account type</th>
                  <th>Interest credits</th>
                  <th>Total interest</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.month}-${row.account_type}-${index}`}>
                    <td>{row.month}</td>
                    <td>
                      <span className="badge">{row.account_type}</span>
                    </td>
                    <td>{row.interest_credits}</td>
                    <td>
                      LKR{" "}
                      {Number(row.total_interest).toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}

                {!rows.length && (
                  <tr>
                    <td colSpan={4} className="muted">
                      No interest has been processed yet.
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
