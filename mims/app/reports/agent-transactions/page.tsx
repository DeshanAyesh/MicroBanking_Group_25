"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type AgentTransactionRow = {
  agent_id: number;
  agent_code: string;
  agent_name: string;
  branch_name: string;
  transaction_count: number;
  total_transaction_value: string | number;
  total_deposits: string | number;
  total_withdrawals: string | number;
};

function money(value: string | number) {
  return `LKR ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AgentTransactionsReport() {
  const [rows, setRows] = useState<AgentTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        const response = await fetch("/api/reports/agent-transactions");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load report.");
        }

        setRows(data.rows || []);
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
        title="Agent-wise Transactions"
        description="Transaction volume and value processed by each active bank agent."
      />

      <div className="card">
        {loading && <p className="muted">Loading agent transactions...</p>}

        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Branch</th>
                  <th>Transactions</th>
                  <th>Deposits</th>
                  <th>Withdrawals</th>
                  <th>Total value</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.agent_id}>
                    <td>
                      <strong>{row.agent_name}</strong>
                      <br />
                      <span className="muted small">{row.agent_code}</span>
                    </td>
                    <td>{row.branch_name}</td>
                    <td>{row.transaction_count}</td>
                    <td>{money(row.total_deposits)}</td>
                    <td>{money(row.total_withdrawals)}</td>
                    <td>{money(row.total_transaction_value)}</td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      No agent transaction records found.
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