"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message ?? "Login failed.");
      return;
    }
    router.push(data.redirectTo);
  }

  return (
    <div className="container" style={{maxWidth:520}}>
      <div className="card">
        <h1>Sign in</h1>
        <p className="muted">B-Trust MIMS authentication.</p>
        <div className="notice small">Database login remains blocked until the team implements the user lookup SQL.</div>
        <form className="form" onSubmit={submit} style={{marginTop:16}}>
          <div className="field">
            <label htmlFor="identifier">Username / Email</label>
            <input id="identifier" value={identifier} onChange={e=>setIdentifier(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button className="btn" type="submit">Sign in</button>
        </form>
        {message && <p className="error">{message}</p>}
      </div>
    </div>
  );
}
