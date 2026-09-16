"use client";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BlockedNotice } from "@/components/BlockedNotice";

export default function NewFD() {
  const [duration,setDuration]=useState("6 months");
  const [msg,setMsg]=useState("");
  const rates:Record<string,string>={"6 months":"13%","1 year":"14%","3 years":"15%"};
  function submit(e:FormEvent){e.preventDefault();setMsg("fixed-deposit creation SQL transaction");}
  return <div className="container" style={{maxWidth:700}}>
    <PageHeader title="Create Fixed Deposit" description="Maximum one FD per savings account." />
    <form className="card form" onSubmit={submit}>
      <div className="field"><label>Eligible savings account</label><input required placeholder="Account ID" /></div>
      <div className="field"><label>Principal (LKR)</label><input required type="number" min="0.01" step="0.01" /></div>
      <div className="field"><label>Duration</label><select value={duration} onChange={e=>setDuration(e.target.value)}>{Object.keys(rates).map(d=><option key={d}>{d}</option>)}</select></div>
      <div className="card"><strong>Interest rate: {rates[duration]}</strong><p className="muted small">Maturity and next interest date should be derived from the start date and 30-day cycle rules.</p></div>
      <button className="btn">Create FD</button>
      {msg && <BlockedNotice operation={msg} />}
    </form>
  </div>;
}
