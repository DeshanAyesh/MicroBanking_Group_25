"use client";

import { FormEvent, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

type Branch = { branch_id: number; branch_code: string; branch_name: string };
type Agent = { agent_id: number; branch_id: number; agent_code: string; first_name: string; last_name: string };

type Customer = {
  customer_id: number;
  nic: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  branch_id: number;
  agent_id: number;
};

export default function EditCustomer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [agents, setAgents] = useState<Agent[]>([]);
  const [message, setMessage] = useState(""); 
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/customers/${id}`),
      fetch("/api/customers/options")
    ])
    .then(async ([customerRes, optionsRes]) => {
      const customerData = await customerRes.json();
      if (!customerRes.ok) throw new Error(customerData.message || "Unable to load customer.");
      
      const optionsData = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(optionsData.message || "Unable to load form options.");

      setCustomer(customerData);
      setBranches(optionsData.branches);
      setAgents(optionsData.agents);
    })
    .catch(e => setMessage(e.message || "Unable to load data."))
    .finally(() => setLoading(false));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); 
    setMessage(""); 
    setSaving(true);
    
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    
    const payload = {
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone,
      email: body.email,
      address: body.address,
      status: body.status,
    };

    try {
      const response = await fetch(`/api/customers/${id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      const data = await response.json(); 
      if (!response.ok) throw new Error(data.message || "Unable to update customer.");
      
      alert("Customer updated successfully.");
      router.push("/customers"); 
      router.refresh();
    } catch (error) { 
      setMessage(error instanceof Error ? error.message : "Unable to update customer."); 
    } finally { 
      setSaving(false); 
    }
  }

  if (loading) {
    return <div className="container" style={{maxWidth:800}}>
      <PageHeader title="Edit Customer" description="Loading customer details..." />
      <div className="card"><p>Loading...</p></div>
    </div>;
  }

  if (!customer) {
    return <div className="container" style={{maxWidth:800}}>
      <PageHeader title="Edit Customer" description="Customer not found" />
      <div className="card"><p className="error">{message || "Customer not found."}</p></div>
    </div>;
  }

  const availableAgents = customer ? agents.filter(agent => agent.branch_id === customer.branch_id) : agents;

  return (
    <div className="container" style={{maxWidth:800}}>
      <PageHeader title="Edit Customer" description="Update customer profile information." />
      <form className="card form" onSubmit={submit}>
        <div className="grid grid-2">
          <div className="field"><label>First name</label><input name="first_name" defaultValue={customer.first_name} required /></div>
          <div className="field"><label>Last name</label><input name="last_name" defaultValue={customer.last_name} required /></div>
          
          <div className="field"><label>NIC / identification</label><input name="nic" defaultValue={customer.nic} disabled /></div>
          <div className="field"><label>Date of birth</label><input name="date_of_birth" type="date" defaultValue={customer.date_of_birth ? String(customer.date_of_birth).substring(0, 10) : ""} disabled /></div>
          
          <div className="field"><label>Gender</label>
            <select name="gender" defaultValue={customer.gender} disabled>
              <option value="" disabled>Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="field"><label>Phone</label><input name="phone" defaultValue={customer.phone || ""} /></div>
          
          <div className="field"><label>Email</label><input name="email" type="email" defaultValue={customer.email || ""} /></div>
          <div className="field"><label>Address</label><input name="address" defaultValue={customer.address || ""} /></div>
          
          <div className="field"><label>Branch</label>
            <select name="branch_id" defaultValue={customer.branch_id} disabled>
              <option value="">Select branch</option>
              {branches.map(branch => <option key={branch.branch_id} value={branch.branch_id}>{branch.branch_code} — {branch.branch_name}</option>)}
            </select>
          </div>
          <div className="field"><label>Assigned agent</label>
            <select name="agent_id" defaultValue={customer.agent_id} disabled>
              <option value="">Select agent</option>
              {availableAgents.map(agent => <option key={agent.agent_id} value={agent.agent_id}>{agent.agent_code} — {agent.first_name} {agent.last_name}</option>)}
            </select>
          </div>

          <div className="field"><label>Status</label>
            <select name="status" defaultValue={customer.status} required>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
        
        <button className="btn" disabled={saving}>
          {saving ? "Updating..." : "Update customer"}
        </button>
        {message && <p className="error">{message}</p>}
      </form>
    </div>
  );
}
