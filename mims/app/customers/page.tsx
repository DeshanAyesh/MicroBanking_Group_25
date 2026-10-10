"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
type Customer = { customer_id: number; nic: string; first_name: string; last_name: string; phone: string | null; email: string | null; status: string; branch_name: string; agent_first_name: string; agent_last_name: string };
export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]); const [search, setSearch] = useState(""); const [error, setError] = useState("");
  useEffect(() => { fetch("/api/customers").then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.message); setRows(d); }).catch(e => setError(e.message || "Unable to load customers.")); }, []);
  const visibleRows = useMemo(() => { const term = search.trim().toLowerCase(); return !term ? rows : rows.filter(row => `${row.first_name} ${row.last_name} ${row.nic} ${row.email ?? ""}`.toLowerCase().includes(term)); }, [rows, search]);
  return <div className="container">
    <PageHeader title="Customer Management" description="Search, filter, register, edit and inspect customers." />
    <div className="actions" style={{marginBottom:16}}>
      <Link className="btn" href="/customers/new">Register customer</Link>
    </div>
    <div className="card">
      <div className="field"><label htmlFor="search">Search</label><input id="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, NIC, email..." /></div>
      {error && <p className="error">{error}</p>}
      {!error && <div className="table-wrap" style={{marginTop:16}}><table><thead><tr><th>Customer</th><th>NIC</th><th>Contact</th><th>Branch / agent</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visibleRows.map(row => <tr key={row.customer_id}><td><strong>{row.first_name} {row.last_name}</strong></td><td>{row.nic}</td><td>{row.phone || "—"}<br /><span className="muted small">{row.email || ""}</span></td><td>{row.branch_name}<br /><span className="muted small">{row.agent_first_name} {row.agent_last_name}</span></td><td><span className="badge">{row.status}</span></td><td><Link href={`/customers/${row.customer_id}/edit`}>Edit</Link></td></tr>)}{!visibleRows.length && <tr><td colSpan={6} className="muted">No customers found.</td></tr>}</tbody></table></div>}
    </div>
  </div>;
}
