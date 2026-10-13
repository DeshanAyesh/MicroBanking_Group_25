"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import styles from "./account-detail.module.css";

type Account = {
  account_id: number;
  account_number: string;
  acc_type: string;
  current_balance: string | number;
  status: string;
  created_at: string;
  plan_name: string;
  interest_rate: string | number;
  minimum_balance: string | number;
  primary_customer_name: string;
  holder_names: string;
  holder_count: number;
};

const money = (value: string | number) =>
  `LKR ${Number(value).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AccountDetailsPage() {
  const params = useParams();
  const accountId = params.id;
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadAccount() {
      try {
        const response = await fetch(`/api/accounts/${accountId}`, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load account.");
        setAccount(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(error instanceof Error ? error.message : "Unable to load account.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    if (accountId) loadAccount();
    return () => controller.abort();
  }, [accountId]);

  return (
    <div className={`container ${styles.page}`}>
      <Link className={styles.backLink} href="/accounts">← Savings accounts</Link>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Account record</span>
          <PageHeader
            title={account?.account_number ?? "Account Details"}
            description="Savings plan, ownership, current balance, and account access information."
          />
        </div>
        {account && <Link className="btn" href={`/accounts/${account.account_id}/transactions`}>View transactions</Link>}
      </div>

      {loading && <div className={styles.state}>Loading account details...</div>}
      {error && <p className="error">{error}</p>}

      {account && !loading && !error && <>
        <section className={styles.balanceCard}>
          <div><span>Current available balance</span><strong>{money(account.current_balance)}</strong><small>Recorded in the savings account ledger</small></div>
          <span className={`${styles.status} ${account.status === "ACTIVE" ? styles.active : styles.inactive}`}>{account.status}</span>
        </section>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}><span>01</span><div><h2>Plan information</h2><p>Terms applied to this savings account.</p></div></div>
            <dl>
              <div><dt>Savings plan</dt><dd>{account.plan_name}</dd></div>
              <div><dt>Account type</dt><dd><span className="badge">{account.acc_type}</span></dd></div>
              <div><dt>Annual interest rate</dt><dd>{Number(account.interest_rate).toFixed(2)}%</dd></div>
              <div><dt>Minimum balance</dt><dd>{money(account.minimum_balance)}</dd></div>
              <div><dt>Opened</dt><dd>{new Date(account.created_at).toLocaleString("en-LK", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" })}</dd></div>
            </dl>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeading}><span>02</span><div><h2>Ownership</h2><p>Customers authorized through this account relationship.</p></div></div>
            <div className={styles.primaryHolder}><span>Primary customer</span><strong>{account.primary_customer_name}</strong></div>
            <div className={styles.holders}><span>All account holders</span><strong>{account.holder_names}</strong><small>{account.holder_count} holder{account.holder_count === 1 ? "" : "s"}</small></div>
          </section>
        </div>

        <section className={styles.securityNote}>
          <strong>Database access control</strong>
          <p>Customers can retrieve this record only when they are the primary customer or appear in the joint-account holder relationship.</p>
        </section>
      </>}
    </div>
  );
}
