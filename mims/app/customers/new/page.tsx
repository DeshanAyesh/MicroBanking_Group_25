"use client";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

export default function NewCustomer() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          branch_id: Number(data.branch_id),
          agent_id: Number(data.agent_id),
          nic: data.nic,
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Failed to create customer.");
      } else {
        setMessage("Customer created successfully.");
        e.currentTarget.reset();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <PageHeader title="Register Customer" description="Collect only the fields required by the relational design." />
      
      {message && <div style={{ marginBottom: 15, padding: 12, backgroundColor: "#d4edda", color: "#155724", borderRadius: 4 }}>{message}</div>}
      {error && <div style={{ marginBottom: 15, padding: 12, backgroundColor: "#f8d7da", color: "#721c24", borderRadius: 4 }}>{error}</div>}

      <form className="card form" onSubmit={submit}>
        <div className="grid grid-2">
          <div className="field"><label>Username</label><input name="username" required /></div>
          <div className="field"><label>Password</label><input type="password" name="password" required /></div>

          <div className="field"><label>First name</label><input name="first_name" required /></div>
          <div className="field"><label>Last name</label><input name="last_name" required /></div>

          <div className="field"><label>NIC / identification</label><input name="nic" required /></div>
          <div className="field"><label>Date of Birth</label><input type="date" name="date_of_birth" required /></div>

          <div className="field">
            <label>Gender</label>
            <select name="gender" required defaultValue="">
              <option value="" disabled>Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="field"><label>Phone</label><input name="phone" /></div>

          <div className="field"><label>Email</label><input type="email" name="email" /></div>
          <div className="field"><label>Address</label><input name="address" /></div>

          <div className="field"><label>Branch ID</label><input type="number" name="branch_id" required /></div>
          <div className="field"><label>Assigned Agent ID</label><input type="number" name="agent_id" required /></div>
        </div>
        <button className="btn" disabled={loading}>
          {loading ? "Creating..." : "Create customer"}
        </button>
      </form>
    </div>
  );
}
