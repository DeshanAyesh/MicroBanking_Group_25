"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import styles from "./transactions.module.css";

type Transaction = {
  transaction_id: number;
  transaction_ref: string;
  transaction_type: "DEPOSIT" | "WITHDRAWAL" | "INTEREST_CREDIT";
  amount: string | number;
  balance_after: string | number;
  transaction_date: string;
  agent_name: string | null;
};

type TransactionResponse = {
  account: { account_id: number; account_number: string; current_balance: string | number };
  transactions: Transaction[];
};

const money = (value: string | number) =>
  `LKR ${Number(value).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AccountTransactionsPage() {
  const params = useParams();
  const accountId = params.id;
  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadTransactions() {
      try {
        const response = await fetch(`/api/accounts/${accountId}/transactions`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load transactions.");
        setData(result);
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(error instanceof Error ? error.message : "Unable to load transactions.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    if (accountId) loadTransactions();
    return () => controller.abort();
  }, [accountId]);

  const visibleTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.transactions ?? []).filter((transaction) =>
      (!typeFilter || transaction.transaction_type === typeFilter) &&
      (!term || `${transaction.transaction_ref} ${transaction.agent_name ?? "System"}`.toLowerCase().includes(term))
    );
  }, [data, search, typeFilter]);

  const totals = useMemo(() => (data?.transactions ?? []).reduce(
    (result, transaction) => {
      const amount = Number(transaction.amount);
      if (transaction.transaction_type === "DEPOSIT") result.deposits += amount;
      if (transaction.transaction_type === "WITHDRAWAL") result.withdrawals += amount;
      if (transaction.transaction_type === "INTEREST_CREDIT") result.interest += amount;
      return result;
    },
    { deposits: 0, withdrawals: 0, interest: 0 }
  ), [data]);

  return (
    <div className={`container ${styles.page}`}>
      <Link className={styles.backLink} href={`/accounts/${accountId}`}>← Account details</Link>
      <PageHeader
        title={data ? `${data.account.account_number} Transactions` : "Account Transactions"}
        description="Immutable ledger history of deposits, withdrawals, and interest credits."
      />

      {data && <section className={styles.metrics}>
        <article><span>Current balance</span><strong>{money(data.account.current_balance)}</strong></article>
        <article><span>Total deposits</span><strong>{money(totals.deposits)}</strong></article>
        <article><span>Total withdrawals</span><strong>{money(totals.withdrawals)}</strong></article>
        <article><span>Interest credited</span><strong>{money(totals.interest)}</strong></article>
      </section>}

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <div><h2>Transaction ledger</h2><p>Posted records cannot be edited or deleted.</p></div>
          <div className={styles.filters}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference or agent" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All transaction types</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAWAL">Withdrawals</option>
              <option value="INTEREST_CREDIT">Interest credits</option>
            </select>
          </div>
        </div>

        {loading && <div className={styles.state}>Loading transactions...</div>}
        {error && <p className="error">{error}</p>}
        {data && !loading && !error && (visibleTransactions.length ?
          <div className="table-wrap"><table className={styles.table}>
            <thead><tr><th>Date</th><th>Reference</th><th>Type</th><th>Amount</th><th>Balance after</th><th>Processed by</th></tr></thead>
            <tbody>{visibleTransactions.map((transaction) => {
              const outgoing = transaction.transaction_type === "WITHDRAWAL";
              return <tr key={transaction.transaction_id}>
                <td>{new Date(transaction.transaction_date).toLocaleString("en-LK", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" })}</td>
                <td><code>{transaction.transaction_ref}</code></td>
                <td><span className={`${styles.type} ${styles[transaction.transaction_type.toLowerCase()]}`}>{transaction.transaction_type.replace("_", " ")}</span></td>
                <td><strong className={outgoing ? styles.outgoing : styles.incoming}>{outgoing ? "−" : "+"} {money(transaction.amount)}</strong></td>
                <td><strong>{money(transaction.balance_after)}</strong></td>
                <td>{transaction.agent_name || "System"}</td>
              </tr>;
            })}</tbody>
          </table></div> : <div className={styles.state}>No transactions match the selected filters.</div>
        )}
      </section>
    </div>
  );
}
