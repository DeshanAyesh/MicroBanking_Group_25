"use client";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BlockedNotice } from "@/components/BlockedNotice";

export default function NewTransaction() {
  const [type,setType]=useState("DEPOSIT");
  const [msg,setMsg]=useState("");
  function submit(e:FormEvent){e.preventDefault();setMsg(`${type.toLowerCase()} database transaction`);}
  return <div className="container" style={{maxWidth:700}}>
    <PageHeader title="Process Transaction" description="Deposit and withdrawal validation must eventually execute atomically in MySQL." />
    <form className="card form" onSubmit={submit}>
      <div className="field"><label>Transaction type</label><select value={type} onChange={e=>setType(e.target.value)}><option>DEPOSIT</option><option>WITHDRAWAL</option></select></div>
      <div className="field"><label>Account</label><input placeholder="Account number / ID" required /></div>
      <div className="field"><label>Amount (LKR)</label><input type="number" min="0.01" step="0.01" required /></div>
      <div className="field"><label>Agent / user</label><input placeholder="Authenticated user should be used server-side" /></div>
      <div className="notice">
        Withdrawal requirements: verify account, eligibility, available balance and minimum balance; then update balance and record the transaction atomically.
      </div>
      <button className="btn">Continue</button>
      {msg && <BlockedNotice operation={msg} />}
    </form>
  </div>;
}
