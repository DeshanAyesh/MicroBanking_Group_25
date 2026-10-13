"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Role = "ADMIN" | "AGENT" | "CUSTOMER";

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState<Role | null>(null);
  const [checked, setChecked] = useState(false);

  const checkAuth = useCallback(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;

        const data = await response.json();
        return data.session?.role as Role | undefined;
      })
      .then((value) => setRole(value ?? null))
      .catch(() => setRole(null))
      .finally(() => setChecked(true));
  }, []);

  useEffect(() => {
    checkAuth();

    function handleAuthChange() {
      checkAuth();
    }

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [pathname, checkAuth]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });

    setRole(null);
    window.dispatchEvent(new Event("auth-change"));
    router.push("/login");
    router.refresh();
  }

  const logoHref = role
    ? role === "ADMIN"
      ? "/admin"
      : role === "AGENT"
        ? "/agent"
        : "/customer"
    : "/";

  const links =
    role === "ADMIN"
      ? [
          ["Dashboard", "/admin"],
          ["Customers", "/customers"],
          ["Accounts", "/accounts"],
          ["Transactions", "/transactions"],
          ["Fixed Deposits", "/fixed-deposits"],
          ["Reports", "/reports"],
        ]
      : role === "AGENT"
        ? [
            ["Dashboard", "/agent"],
            ["Customers", "/customers"],
            ["Accounts", "/accounts"],
            ["Transactions", "/transactions"],
            ["Fixed Deposits", "/fixed-deposits"],
            ["Reports", "/reports"],
          ]
        : role === "CUSTOMER"
          ? [
              ["Dashboard", "/customer"],
              ["Accounts", "/accounts"],
              ["Transactions", "/transactions"],
            ]
          : [];

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link
          href={logoHref}
          className="brand"
          title={role ? `${role} Dashboard` : "B-Trust MIMS"}
        >
          B-Trust MIMS
        </Link>

        <nav className="nav-links">
          {checked && !role && (
            <Link href="/login" className="btn secondary">
              Login
            </Link>
          )}

          {checked && role && (
            <>
              {links.map(([label, href]) => (
                <Link href={href} key={href}>
                  {label}
                </Link>
              ))}

              <button
                className="btn secondary"
                type="button"
                onClick={signOut}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}