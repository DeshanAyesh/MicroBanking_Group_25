"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type Row = {
  month: string;
  account_type: string;
  interest_credits: string | number;
  total_interest: string | number;
};

const money = (v: string | number) =>
  Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function downloadCsv(filename: string, header: string[], lines: (string | number)[][]) {
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

export default function InterestDistributionReport() {
  const [month, setMonth] = useState(""); // what the user typed
  const [applied, setApplied] = useState(""); // month being shown ("" = all months)
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const qs = applied ? `?month=${encodeURIComponent(applied)}` : "";
        const res = await fetch(`/api/reports/interest-distribution${qs}`);
        const data = await res.json();
        if (res.status === 401) {
          throw new Error("Please log in as an admin or agent to view this report.");
        }
        if (!res.ok) throw new Error(data.message || "Failed to load report.");
        setRows(data.rows || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [applied]);

  function applyFilter() {
    setError(null);
    const value = month.trim();
    if (value && !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      setError("Enter the month as YYYY-MM, for example 2023-11.");
      return;
    }
    setApplied(value);
  }

  const totalCredits = rows.reduce((sum, r) => sum + Number(r.interest_credits), 0);
  const totalInterest = rows.reduce((sum, r) => sum + Number(r.total_interest), 0);

  function exportCsv() {
    downloadCsv(
      `interest-distribution-${applied || "all"}.csv`,
      ["Month", "Account type", "Interest credits", "Total interest (LKR)"],
      rows.map((r) => [r.month, r.account_type, r.interest_credits, r.total_interest])
    );
  }

  return (
    <div className="container">
      <PageHeader
        title="Monthly Interest Distribution"
        description="Month, account type, number of interest credits and total interest distributed."
      />

      <div className="card">
        <div className="actions" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="YYYY-MM (e.g. 2023-11)"
            style={{ padding: 8 }}
          />
          <button className="btn" onClick={applyFilter}>Apply</button>
          <button
            className="btn"
            onClick={() => {
              setMonth("");
              setError(null);
              setApplied("");
            }}
          >
            All months
          </button>
          <button className="btn" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </button>
        </div>

        {loading && <div style={{ padding: 20 }}>Loading report...</div>}
        {error && <div style={{ color: "red", padding: 16 }}>{error}</div>}

        {!loading && !error && (
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
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 20 }}>
                      No interest distributed for this selection.
                    </td>
                  </tr>
                ) : (
                  <>
                    {rows.map((r) => (
                      <tr key={`${r.month}-${r.account_type}`}>
                        <td>{r.month}</td>
                        <td>{r.account_type}</td>
                        <td>{Number(r.interest_credits)}</td>
                        <td>LKR {money(r.total_interest)}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700 }}>
                      <td colSpan={2}>Total</td>
                      <td>{totalCredits}</td>
                      <td>LKR {money(totalInterest)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}