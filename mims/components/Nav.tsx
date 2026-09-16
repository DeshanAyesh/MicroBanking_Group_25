import Link from "next/link";

export function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">B-Trust MIMS</Link>
        <nav className="nav-links">
          <Link href="/login">Login</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/agent">Agent</Link>
          <Link href="/customer">Customer</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/accounts">Accounts</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/fixed-deposits">Fixed Deposits</Link>
          <Link href="/reports">Reports</Link>
        </nav>
      </div>
    </header>
  );
}
