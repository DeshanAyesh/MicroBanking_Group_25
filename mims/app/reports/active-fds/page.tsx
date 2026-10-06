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
  interest_rate: string | number;
  maturity_date: string;
  next_payout_date: string;
};

const money = (v: string | number) =>
  Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function downloadCsv(filename: string, header: string[], lines: (string | number)[][]) {
  // prefix risky leading characters so spreadsheet apps do not run them as formulas
  const esc = (v: string | number) => {
    const s = String(v);
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const csv = [header, ...lines].map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ActiveFixedDepositsReport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/reports/active-fds");
        const data = await res.json();
        if (res.status === 401) throw new Error("Please log in to view this report.");
        if (!res.ok) throw new Error(data.message || "Failed to load report.");
        setRows(data.rows || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function exportCsv() {
    downloadCsv(
      "active-fixed-deposits.csv",
      ["FD", "Account", "Customer", "Principal", "Duration", "Rate %", "Maturity", "Next payout"],
      rows.map((r) => [
        r.fd_number, r.account_number, r.customer_name, r.principal,
        r.plan_name, r.interest_rate, r.maturity_date, r.next_payout_date,
      ])
    );
  }

  return (
    <div className="container">
      <PageHeader
        title="Active Fixed Deposits"
        description="FD, account, customer, principal, duration, rate and next interest payout."
      />

      <div className="card">
        {loading && <div style={{ padding: 20 }}>Loading report...</div>}
        {error && <div style={{ color: "red", padding: 16 }}>{error}</div>}

        {!loading && !error && (
          <>
            <div className="actions" style={{ marginBottom: 16 }}>
              <button className="btn" onClick={exportCsv} disabled={rows.length === 0}>
                Export CSV
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>FD</th>
                    <th>Account</th>
                    <th>Customer</th>
                    <th>Principal</th>
                    <th>Duration</th>
                    <th>Rate</th>
                    <th>Maturity</th>
                    <th>Next payout</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 20 }}>
                        No active fixed deposits.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.fd_id}>
                        <td style={{ fontFamily: "monospace" }}>{r.fd_number}</td>
                        <td>{r.account_number}</td>
                        <td>{r.customer_name}</td>
                        <td>LKR {money(r.principal)}</td>
                        <td>{r.plan_name}</td>
                        <td>{Number(r.interest_rate)}%</td>
                        <td>{r.maturity_date}</td>
                        <td>{r.next_payout_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}