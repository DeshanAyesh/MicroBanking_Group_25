"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

type Transaction = {
  transaction_id: number;
  transaction_ref: string;
  transaction_type: "DEPOSIT" | "WITHDRAWAL" | "INTEREST_CREDIT";
  amount: string | number;
  balance_after: string | number;
  transaction_date: string;
  agent_name: string | null;
};

type Account = {
  account_id: number;
  account_number: string;
  current_balance: string | number;
};

const money = (value: string | number) =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function AccountHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/accounts/${id}/transactions`);
        const data = await res.json();

        if (res.status === 401) throw new Error("Please log in to view this page.");
        if (res.status === 404) throw new Error("Account not found.");
        if (!res.ok) throw new Error(data.message || "Failed to load history.");

        setAccount(data.account || null);
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  return (
    <div className="container">
      <PageHeader
        title={`Account Passbook${account ? ` - ${account.account_number}` : ""}`}
        description="Chronological record of deposits, withdrawals and interest credits."
      />

      <div className="actions" style={{ marginBottom: 16 }}>
        <Link className="btn" href="/accounts">
          &larr; Back to Accounts
        </Link>
      </div>

      <div className="card">
        {loading && <div style={{ padding: 20 }}>Loading transaction history...</div>}

        {error && <div style={{ color: "red", padding: 16 }}>{error}</div>}

        {!loading && !error && (
          <>
            {account && (
              <p style={{ marginBottom: 16, fontWeight: 600 }}>
                Current balance: LKR {money(account.current_balance)}
              </p>
            )}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance After</th>
                    <th>Date</th>
                    <th>Processed By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                        No transactions found for this account.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.transaction_id}>
                        <td style={{ fontFamily: "monospace" }}>{tx.transaction_ref}</td>
                        <td>{tx.transaction_type}</td>
                        <td>
                          {tx.transaction_type === "WITHDRAWAL" ? "-" : "+"} LKR{" "}
                          {money(tx.amount)}
                        </td>
                        <td>LKR {money(tx.balance_after)}</td>
                        <td>{formatDate(tx.transaction_date)}</td>
                        <td>
                          {tx.agent_name ||
                            (tx.transaction_type === "INTEREST_CREDIT"
                              ? "System (interest)"
                              : "-")}
                        </td>
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