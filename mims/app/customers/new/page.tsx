"use client";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BlockedNotice } from "@/components/BlockedNotice";

export default function NewCustomer() {
  const [message,setMessage]=useState("");
  function submit(e:FormEvent){e.preventDefault();setMessage("BLOCKED — SQL TODO required: create customer transaction.");}
  return <div className="container" style={{maxWidth:800}}>
    <PageHeader title="Register Customer" description="Collect only the fields required by the relational design." />
    <form className="card form" onSubmit={submit}>
      <div className="grid grid-2">
        <div className="field"><label>First name</label><input required /></div>
        <div className="field"><label>Last name</label><input required /></div>
        <div className="field"><label>NIC / identification</label><input required /></div>
        <div className="field"><label>Phone</label><input required /></div>
        <div className="field"><label>Email</label><input type="email" /></div>
        <div className="field"><label>Branch</label><select><option>Select branch</option></select></div>
        <div className="field"><label>Assigned agent</label><select><option>Select agent</option></select></div>
      </div>
      <button className="btn">Create customer</button>
      {message && <BlockedNotice operation={message.replace("BLOCKED — SQL TODO required: ","")} />}
    </form>
  </div>;
}
