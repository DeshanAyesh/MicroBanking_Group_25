"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "ADMIN" | "AGENT" | "CUSTOMER";

export function Nav() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) return null;
        const data = await response.json();
        return data.session?.role as Role | undefined;
      })
      .then(value => setRole(value ?? null))
      .catch(() => setRole(null))
      .finally(() => setChecked(true));
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setRole(null);
    router.push("/login");
    router.refresh();
  }

  const links = role === "ADMIN"
    ? [["Admin", "/admin"], ["Customers", "/customers"], ["Accounts", "/accounts"], ["Transactions", "/transactions"], ["Reports", "/reports"]]
    : role === "AGENT"
      ? [["Agent", "/agent"], ["Customers", "/customers"], ["Accounts", "/accounts"], ["Transactions", "/transactions"], ["Fixed Deposits", "/fixed-deposits"], ["Reports", "/reports"]]
      : role === "CUSTOMER"
        ? [["My dashboard", "/customer"], ["My accounts", "/accounts"], ["My transactions", "/transactions"]]
        : [];

  return <header className="nav"><div className="nav-inner">
    <Link href="/" className="brand">B-Trust MIMS</Link>
    <nav className="nav-links">
      {checked && !role && <Link href="/login">Login</Link>}
      {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      {role && <button className="btn secondary" type="button" onClick={signOut}>Logout</button>}
    </nav>
  </div></header>;
}
