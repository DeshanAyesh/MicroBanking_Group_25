"use client";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BlockedNotice } from "@/components/BlockedNotice";

const plans = [
  ["Children","12%","LKR 0"],["Teen","11%","LKR 500"],["Adult (18+)","10%","LKR 1,000"],
  ["Senior (60+)","13%","LKR 1,000"],["Joint","7%","LKR 5,000"]
];

export default function NewAccount() {
  const [msg,setMsg]=useState("");
  function submit(e:FormEvent){e.preventDefault();setMsg("account creation SQL transaction");}
  return <div className="container" style={{maxWidth:800}}>
    <PageHeader title="Open Savings Account" />
    <form className="card form" onSubmit={submit}>
      <div className="field"><label>Account type</label><select><option>Individual</option><option>Joint</option></select></div>
      <div className="field"><label>Plan</label><select>{plans.map(p=><option key={p[0]}>{p[0]} — {p[1]} interest — minimum {p[2]}</option>)}</select></div>
      <div className="field"><label>Primary customer</label><input placeholder="Customer ID / NIC" required /></div>
      <div className="notice small">Joint accounts must be represented by a separate account-holder relationship table. Do not store multiple customer IDs in one column.</div>
      <button className="btn">Open account</button>
      {msg && <BlockedNotice operation={msg} />}
    </form>
  </div>;
}
