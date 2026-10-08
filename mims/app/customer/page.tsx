"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
export default function CustomerPage() {
  const [data, setData] = useState<{ account_count: number; total_balance: string | number; active_fd_count: number } | null>(null);
  useEffect(() => { fetch("/api/customer/dashboard").then(async r => { if (r.ok) setData(await r.json()); }).catch(() => undefined); }, []);
  const cards = [["My accounts", data?.account_count ?? "—"], ["Current balances", data ? `LKR ${Number(data.total_balance).toLocaleString()}` : "—"], ["Active fixed deposits", data?.active_fd_count ?? "—"]];
  return <div className="container">
    <PageHeader title="Customer Dashboard" description="Only the authenticated customer's own records should be displayed." />
    <div className="grid grid-3">
      {cards.map(([label, value])=><div className="card" key={String(label)}><div className="muted">{label}</div><div className="stat">{value}</div></div>)}
    </div>
    <div className="card" style={{marginTop:16}}>
      <h2>Privacy rule</h2>
      <p className="muted">Customer APIs must scope every query to the authenticated user's customer relationship. Never accept an arbitrary customer ID from the browser as proof of ownership.</p>
    </div>
  </div>;
}

