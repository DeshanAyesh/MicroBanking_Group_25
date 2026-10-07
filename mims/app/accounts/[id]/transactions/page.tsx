"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

type Transaction = {
  transaction_id: number;
  transaction_ref: string;
  transaction_type: string;
  amount: string | number;
  balance_after: string | number;
  transaction_date: string;
  agent_name: string | null;
};

type TransactionResponse = {
  account: {
    account_id: number;
    account_number: string;
    current_balance: string | number;
  };
  transactions: Transaction[];
};

function money(value: string | number) {
  return `LKR ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AccountTransactionsPage() {
  const params = useParams();
  const accountId = params.id;

  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await fetch(`/api/accounts/${accountId}/transactions`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load transactions.");
        }

        setData(result);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load transactions."
        );
      } finally {
        setLoading(false);
      }
    }

    if (accountId) {
      loadTransactions();
    }
  }, [accountId]);

  return (
    <div className="container">
      <PageHeader
        title="Account Transactions"
        description={
          data
            ? `Transaction history for ${data.account.account_number}.`
            : "Transaction history for a savings account."
        }
      />

      <div className="actions" style={{ marginBottom: 16 }}>
        <Link className="btn secondary" href={`/accounts/${accountId}`}>
          Back to account details
        </Link>
      </div>

      <div className="card">
        {loading && <p className="muted">Loading transactions...</p>}
        {error && <p className="error">{error}</p>}

        {data && !loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance after</th>
                  <th>Processed by</th>
                </tr>
              </thead>

              <tbody>
                {data.transactions.map((transaction) => (
                  <tr key={transaction.transaction_id}>
                    <td>
                      {new Date(transaction.transaction_date).toLocaleString(
                        "en-LK"
                      )}
                    </td>
                    <td>{transaction.transaction_ref}</td>
                    <td>
                      <span className="badge">
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td>{money(transaction.amount)}</td>
                    <td>{money(transaction.balance_after)}</td>
                    <td>{transaction.agent_name || "System"}</td>
                  </tr>
                ))}

                {data.transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      No transactions found for this account.
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