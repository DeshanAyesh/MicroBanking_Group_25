"use client";

import Link from "next/link";
import styles from "./analytics.module.css";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";

type Summary = {
  total_accounts: string | number;
  active_accounts: string | number;
  active_joint_accounts: string | number;
active_total_balance: string | number;
  active_customers: string | number;
  active_fixed_deposits: string | number;
  active_fd_principal: string | number;
};

type MonthlyActivity = {
  period: string;
  label: string;
  deposits: string | number;
  withdrawals: string | number;
  interest: string | number;
};

type PlanDistribution = {
  average_balance: string | number;
  plan_id: number;
  plan_name: string;
  account_count: string | number;
  total_balance: string | number;
};

type TransactionType = {
  transaction_type: string;
  transaction_count: string | number;
  total_amount: string | number;
};

type AnalyticsData = {
  period: { start: string; end: string };
  generatedAt: string;
  summary: Summary;
  monthlyActivity: MonthlyActivity[];
  planDistribution: PlanDistribution[];
  transactionTypes: TransactionType[];
};

function money(value: string | number) {
  return `LKR ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type IconName = "customers" | "accounts" | "balance" | "fd" | "movement" | "interest" | "transactions";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    customers: <><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 19c.5-4 3-6 6-6s5.5 2 6 6M12 19c.4-3 2.2-5 5-5 2.6 0 4.5 1.8 5 5"/></>,
    accounts: <><path d="M3 9h18M5 9v9m4-9v9m6-9v9m4-9v9M3 20h18M12 3l9 5H3l9-5z"/></>,
    balance: <><path d="M4 6h15a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h13"/><path d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5z"/></>,
    fd: <><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v5c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 10v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 15v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/></>,
    movement: <><path d="M4 7h14l-3-3m3 3-3 3M20 17H6l3-3m-3 3 3 3"/></>,
    interest: <><path d="M5 19 19 5"/><circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/></>,
    transactions: <><path d="M4 18V9m6 9V4m6 14v-6m4 6V7"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const planColors = ["#0873bd", "#10b5dc", "#68c5e4", "#9dd9ec", "#c8eaf4"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);

  function exportCsv() {
    if (!data) return;
    const rows: (string | number)[][] = [
      ["Banking Analytics"], ["Generated at", data.generatedAt],
      ["Transaction period", data.period.start, data.period.end],
      ["Month", "Deposits (LKR)", "Withdrawals (LKR)", "Interest (LKR)", "Net deposits less withdrawals (LKR)"],
      ...data.monthlyActivity.map(r => [r.label, r.deposits, r.withdrawals, r.interest, Number(r.deposits) - Number(r.withdrawals)]),
      [], ["Current snapshot - not filtered by transaction dates"],
      ["Active customers", data.summary.active_customers], ["Active accounts", data.summary.active_accounts],
["Current savings balance (LKR)", data.summary.active_total_balance],      [], ["Plan", "Accounts", "Balance (LKR)", "Average balance (LKR)", "Account share (%)"],
      ...data.planDistribution.map(r => [r.plan_name, r.account_count, r.total_balance, r.average_balance,
        Number(data.summary.total_accounts) ? (Number(r.account_count) / Number(data.summary.total_accounts) * 100).toFixed(1) : "0"]),
      [], ["Transaction type", "Count", "Amount (LKR)"],
      ...data.transactionTypes.map(r => [r.transaction_type, r.transaction_count, r.total_amount]),
    ];
    const csv = rows.map(row => row.map(value => {
      const text = String(value);
      const safe = typeof value === "string" && /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
      return '"' + safe.replace(/"/g, '""') + '"';
    }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `banking-analytics-${data.period.start}-${data.period.end}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  useEffect(() => {
    const controller = new AbortController();
    async function loadAnalytics() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/reports/analytics${query}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load banking analytics.");
        }

        setData(result);
        setStart(result.period.start);
        setEnd(result.period.end);
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load banking analytics."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAnalytics();
    return () => controller.abort();
  }, [query, refresh]);
   //max values use to calculate the relative bar height in the graph
  const maximumMonthlyValue = useMemo(() => {
    if (!data?.monthlyActivity.length) return 1;//0 ->return null to avoid null divide error

    return Math.max(
      1,
      //falt map->converts data into a row like [5000,2000,3000,...]
      //return max->find the max of all three components deposit ,wothdrawals ,amd interest and pass them 
      ...data.monthlyActivity.flatMap((row) => [
        Number(row.deposits),
        Number(row.withdrawals),
        Number(row.interest),
      ])
    );
  }, [data]);
  //usigng reduce function to summ up the total movements
  const netMovement = data?.monthlyActivity.reduce(
    (sum, row) => sum + Number(row.deposits) - Number(row.withdrawals),
    0
  ) ?? 0;

  const interestCredits = data?.monthlyActivity.reduce(
    (sum, row) => sum + Number(row.interest),
    0
  ) ?? 0;

  const planGradient = useMemo(() => {
    if (!data?.planDistribution.length || !Number(data.summary.total_accounts)) {
      return "conic-gradient(#e4edf4 0 100%)";
    }

    let position = 0;
    const segments = data.planDistribution.map((row, index) => {
      const startPosition = position;
      position += (Number(row.account_count) / Number(data.summary.total_accounts)) * 100;
      return `${planColors[index % planColors.length]} ${startPosition}% ${position}%`;
    });
    if (position < 100) segments.push(`#e4edf4 ${position}% 100%`);
    return `conic-gradient(${segments.join(", ")})`;
  }, [data]);

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link className={styles.backLink} href="/reports">← Reports</Link>
          <PageHeader
            title="Banking Analytics"
            description="A live overview of customer reach, account balances, transaction activity, and savings-plan adoption."
          />
        </div>
       
        <form className={styles.filterPanel} onSubmit={event => {
          event.preventDefault();
          setQuery(`?${new URLSearchParams({ start, end })}`);
          setRefresh(value => value + 1);
        }}>
          <label>From<input type="date" required value={start} onChange={event => setStart(event.target.value)} /></label>
          <label>To<input type="date" required value={end} onChange={event => setEnd(event.target.value)} /></label>
          <button className="btn" disabled={loading}>Apply dates</button>
          <button className="btn secondary" type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button>
          <button className="btn secondary" type="button" disabled={!data || loading || !!error} onClick={exportCsv}>Export CSV</button>
          <p className={styles.filterNote}>Dates filter transactions only. Maximum period: 366 days.</p>
          {data && !loading && !error && (
            <p className={styles.refreshText}>
              Showing {data.period.start} to {data.period.end} · Refreshed {new Date(data.generatedAt).toLocaleString("en-GB", { timeZone: "Asia/Colombo" })} Sri Lanka time
            </p>
          )}
        </form>
      </div>

      {loading && <div className={styles.status}>Loading banking analytics...</div>}
      {error && <p className="error">{error}</p>}

      {data && !loading && !error && (
        <>
          <section className={styles.metricGrid} aria-label="Current banking snapshot">
            {[
              { icon: "customers" as IconName, tone: "blue", label: "Active customers", value: Number(data.summary.active_customers).toLocaleString(), note: "Registered and active customers" },
              { icon: "accounts" as IconName, tone: "green", label: "Active accounts", value: Number(data.summary.active_accounts).toLocaleString(), note: `${Number(data.summary.active_joint_accounts).toLocaleString()} joint accounts across all statuses` },
              { icon: "balance" as IconName, tone: "amber", label: "Current savings balance", value: money(data.summary.active_total_balance), note: `Across ${Number(data.summary.total_accounts).toLocaleString()} accounts` },
              { icon: "fd" as IconName, tone: "purple", label: "Active FD principal", value: money(data.summary.active_fd_principal), note: `${Number(data.summary.active_fixed_deposits).toLocaleString()} active fixed deposits` },
            ].map(metric => (
              <article className={styles.metricCard} key={metric.label}>
                <span className={`${styles.metricIcon} ${styles[metric.tone]}`}><Icon name={metric.icon} /></span>
                <div><span className={styles.metricLabel}>{metric.label}</span><strong className={styles.metricValue}>{metric.value}</strong><span className={styles.metricNote}>{metric.note}</span></div>
              </article>
            ))}
          </section>

          <div className={styles.mainGrid}>
            <section className={`${styles.panel} ${styles.activityPanel}`}>
              <div className={styles.movementHeader}>
                <div className={styles.sectionTitle}><span className={`${styles.sectionIcon} ${styles.blue}`}><Icon name="transactions" /></span><div><h2>Selected-period movement</h2><p>Customer cash movement and bank interest within the chosen dates.</p></div></div>
                <div className={styles.movementStats}>
                  <div><span><Icon name="movement" /> Net movement</span><strong>{money(netMovement)}</strong></div>
                  <div><span><Icon name="interest" /> Interest credits</span><strong>{money(interestCredits)}</strong></div>
                </div>
              </div>

              <div className={styles.chartHeader}><div><h3>Monthly transaction activity</h3><p>First and last months may represent partial periods.</p></div><span className="badge">LKR value</span></div>
              {data.monthlyActivity.length === 0 ? <p className="muted">No transaction activity is available yet.</p> : (
                <div className={styles.chart}>
                  <div className={styles.chartPlot}>
                    {data.monthlyActivity.map(row => (
                      <div className={styles.monthGroup} key={row.period}>
                        <div className={styles.barGroup}>
                          {(["deposits", "withdrawals", "interest"] as const).map(type => (
                            <span key={type} className={`${styles.chartBar} ${styles[type]}`} title={`${type}: ${money(row[type])}`} style={{ "--bar-height": `${(Number(row[type]) / maximumMonthlyValue) * 100}%` } as CSSProperties} />
                          ))}
                        </div>
                        <span>{row.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.legend}><span><i className={styles.deposits}/>Deposits</span><span><i className={styles.withdrawals}/>Withdrawals</span><span><i className={styles.interest}/>Interest</span></div>
                </div>
              )}
            </section>

            <section className={`${styles.panel} ${styles.planPanel}`}>
              <div className={styles.sectionTitle}><span className={`${styles.sectionIcon} ${styles.cyan}`}>◕</span><div><h2>Savings-plan distribution</h2><p>Current account adoption and balances by plan.</p></div></div>
              <div className={styles.planContent}>
                <div className={styles.donut} style={{ background: planGradient }}><div><strong>{Number(data.summary.total_accounts).toLocaleString()}</strong><span>accounts</span></div></div>
                <div className={styles.planList}>
                  {data.planDistribution.map((row, index) => {
                    const share = Number(data.summary.total_accounts) ? Number(row.account_count) / Number(data.summary.total_accounts) * 100 : 0;
                    return <div className={styles.planRow} key={row.plan_id}>
                      <div className={styles.planHeading}><strong><i style={{ background: planColors[index % planColors.length] }} />{row.plan_name}</strong><span>{Number(row.account_count).toLocaleString()} accounts</span></div>
                      <div className={styles.planTrack}><span style={{ width: `${share}%`, background: planColors[index % planColors.length] }} /></div>
                      <small>Balance {money(row.total_balance)} · Average {money(row.average_balance)} · Share {share.toFixed(1)}%</small>
                    </div>;
                  })}
                </div>
              </div>
            </section>
          </div>

          <section className={`${styles.panel} ${styles.transactionPanel}`}>
            <div className={styles.transactionHeading}>
              <div className={styles.sectionTitle}><span className={`${styles.sectionIcon} ${styles.blue}`}>◔</span><div><h2>Transaction mix</h2><p>Transaction counts and amounts within the selected dates.</p></div></div>
              <Link className="btn secondary" href="/transactions">View transactions</Link>
            </div>
            <div className={styles.transactionGrid}>
              {data.transactionTypes.length === 0 && <p className="muted">No transactions in this period.</p>}
              {data.transactionTypes.map(row => {
                const icon = row.transaction_type === "INTEREST_CREDIT" ? "interest" : "movement";
                const tone = row.transaction_type === "WITHDRAWAL" ? "amber" : row.transaction_type === "INTEREST_CREDIT" ? "green" : "blue";
                return <article className={styles.transactionCard} key={row.transaction_type}>
                  <span className={`${styles.transactionIcon} ${styles[tone]}`}><Icon name={icon} /></span>
                  <div><span>{row.transaction_type.replace("_", " ")}</span><strong>{Number(row.transaction_count).toLocaleString()} transactions</strong><b>{money(row.total_amount)}</b></div>
                </article>;
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
