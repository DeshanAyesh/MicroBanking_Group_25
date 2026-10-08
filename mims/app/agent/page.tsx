"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
export default function AgentPage() {
  const [data, setData] = useState<{ assigned_customers: number; today_deposits: string | number; today_withdrawals: string | number } | null>(null);
  useEffect(() => { fetch("/api/agent/dashboard").then(async r => { if (r.ok) setData(await r.json()); }).catch(() => undefined); }, []);
  const cards = [["Assigned customers", data?.assigned_customers ?? "—"], ["Today's deposits", data ? `LKR ${Number(data.today_deposits).toLocaleString()}` : "—"], ["Today's withdrawals", data ? `LKR ${Number(data.today_withdrawals).toLocaleString()}` : "—"]];
  return <div className="container">
    <PageHeader title="Agent Dashboard" description="Assigned customers and today's banking activity." />
    <div className="grid grid-3">
      {cards.map(([label, value])=><div className="card" key={String(label)}><div className="muted">{label}</div><div className="stat">{value}</div></div>)}
    </div>
    <div className="card" style={{marginTop:16}}>
      <h2>Agent actions</h2>
      <div className="actions">
        <a className="btn" href="/customers/new">Register customer</a>
        <a className="btn secondary" href="/transactions/new">Process transaction</a>
        <a className="btn secondary" href="/fixed-deposits/new">Create FD</a>
      </div>
    </div>
  </div>;
}

