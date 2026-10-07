"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type UserRole = "ADMIN" | "AGENT" | "CUSTOMER";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      const destinations: Record<UserRole, string> = {
        ADMIN: "/admin",
        AGENT: "/agent",
        CUSTOMER: "/customer",
      };

      router.push(destinations[data.role as UserRole] || "/");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to sign in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container login-shell">
      <div className="card login-card">
        <div className="login-mark">BT</div>
        <div className="login-kicker">B-TRUST MICROFINANCE</div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to access your authorised banking workspace.</p>

        <form className="form" onSubmit={submit} style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="identifier">Username</label>
            <input
              id="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {message && <p className="error">{message}</p>}
      </div>
    </div>
  );
}
