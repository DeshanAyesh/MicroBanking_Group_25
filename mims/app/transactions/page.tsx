"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
type Row = { transaction_id: number; transaction_ref: string; transaction_type: string; amount: string | number; transaction_date: string; account_number: string; customer_name: string; agent_name: string | null };
export default function TransactionsPage() {
  const [rows, setRows] = useState<Row[]>([]); const [search, setSearch] = useState(""); const [type, setType] = useState(""); const [error, setError] = useState("");
  const [role, setRole] = useState("");
  useEffect(() => { fetch("/api/transactions").then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.message); setRows(d); }).catch(e => setError(e.message || "Unable to load transactions.")); }, []);
  useEffect(() => { fetch("/api/auth/me").then(async r => r.ok ? r.json() : null).then(data => setRole(data?.session?.role ?? "")).catch(() => undefined); }, []);
  const visibleRows = useMemo(() => rows.filter(row => (!type || row.transaction_type === type) && (!search || `${row.transaction_ref} ${row.account_number}`.toLowerCase().includes(search.toLowerCase()))), [rows, type, search]);
  return <div className="container">
    <PageHeader title="Transactions" description="Deposits, withdrawals and interest credits." />
    {role === "AGENT" && <div className="actions" style={{marginBottom:16}}><Link className="btn" href="/transactions/new">New transaction</Link></div>}
    <div className="card">
      <div className="grid grid-2">
        <div className="field"><label>Search reference/account</label><input value={search} onChange={event => setSearch(event.target.value)} /></div>
        <div className="field"><label>Type</label><select value={type} onChange={event => setType(event.target.value)}><option value="">All types</option><option>DEPOSIT</option><option>WITHDRAWAL</option><option>INTEREST_CREDIT</option></select></div>
      </div>
      {error && <p className="error">{error}</p>}<div className="table-wrap" style={{marginTop:16}}><table><thead><tr><th>Reference</th><th>Account</th><th>Customer</th><th>Type</th><th>Amount</th><th>Timestamp</th><th>Agent</th></tr></thead><tbody>{visibleRows.map(row => <tr key={row.transaction_id}><td>{row.transaction_ref}</td><td>{row.account_number}</td><td>{row.customer_name}</td><td><span className="badge">{row.transaction_type}</span></td><td>LKR {Number(row.amount).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</td><td>{new Date(row.transaction_date).toLocaleString()}</td><td>{row.agent_name || "System"}</td></tr>)}{!visibleRows.length && !error && <tr><td colSpan={7} className="muted">No transactions found.</td></tr>}</tbody></table></div>
    </div>
  </div>;
}
