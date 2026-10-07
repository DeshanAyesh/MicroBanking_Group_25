"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

type Branch = { branch_id: number; branch_code: string; branch_name: string };
type Agent = { agent_id: number; branch_id: number; agent_code: string; first_name: string; last_name: string };

export default function NewCustomer() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]); const [agents, setAgents] = useState<Agent[]>([]);
  const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false);
  const [branchId, setBranchId] = useState(""); const [agentId, setAgentId] = useState("");
  useEffect(() => { fetch("/api/customers/options").then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.message); setBranches(d.branches); setAgents(d.agents); }).catch(e => setMessage(e.message || "Unable to load form options.")); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setSaving(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    body.branch_id = branchId; body.agent_id = agentId;
    try {
      const response = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to create customer.");
      router.push("/customers"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create customer."); } finally { setSaving(false); }
  }
  const availableAgents = branchId ? agents.filter(agent => agent.branch_id === Number(branchId)) : agents;
  return <div className="container" style={{maxWidth:800}}>
    <PageHeader title="Register Customer" description="Create the customer's login and profile together in one database transaction." />
    <form className="card form" onSubmit={submit}>
      <div className="grid grid-2">
        <div className="field"><label>Username</label><input name="username" required /></div><div className="field"><label>Temporary password</label><input name="password" type="password" minLength={8} required /></div>
        <div className="field"><label>First name</label><input name="first_name" required /></div><div className="field"><label>Last name</label><input name="last_name" required /></div>
        <div className="field"><label>NIC / identification</label><input name="nic" required /></div><div className="field"><label>Date of birth</label><input name="date_of_birth" type="date" required /></div>
        <div className="field"><label>Gender</label><select name="gender" required defaultValue=""><option value="" disabled>Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div><div className="field"><label>Phone</label><input name="phone" /></div>
        <div className="field"><label>Email</label><input name="email" type="email" /></div><div className="field"><label>Address</label><input name="address" /></div>
        <div className="field"><label>Branch</label><select value={branchId} onChange={event => { setBranchId(event.target.value); setAgentId(""); }} required><option value="">Select branch</option>{branches.map(branch => <option key={branch.branch_id} value={branch.branch_id}>{branch.branch_code} — {branch.branch_name}</option>)}</select></div>
        <div className="field"><label>Assigned agent</label><select value={agentId} onChange={event => setAgentId(event.target.value)} required><option value="">Select agent</option>{availableAgents.map(agent => <option key={agent.agent_id} value={agent.agent_id}>{agent.agent_code} — {agent.first_name} {agent.last_name}</option>)}</select></div>
      </div>
      <button className="btn" disabled={saving}>{saving ? "Creating..." : "Create customer"}</button>{message && <p className="error">{message}</p>}
    </form>
  </div>;
}


