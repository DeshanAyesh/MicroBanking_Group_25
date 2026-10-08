import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-eyebrow">SECURE BANKING OPERATIONS PLATFORM</div>
        <h1>B-Trust Microbanking & Interest Management System</h1>
        <p>
          A role-based banking workspace for customer management, savings accounts,
          transactions, fixed deposits, interest processing, and reporting.
        </p>
        <div className="hero-actions"><Link className="btn hero-btn" href="/login">Sign in to workspace</Link></div>
      </section>

      <div className="grid grid-3">
        <div className="card feature-card">
          <div className="feature-number">01</div>
          <h3>Customer & accounts</h3>
          <p className="muted">Register customers, open individual or joint savings accounts, and keep account holders connected to the correct records.</p>
        </div>
        <div className="card feature-card">
          <div className="feature-number">02</div>
          <h3>Controlled transactions</h3>
          <p className="muted">Deposits and withdrawals use database transactions, validation, and balance rules for reliable processing.</p>
        </div>
        <div className="card feature-card">
          <div className="feature-number">03</div>
          <h3>Fixed deposits & reports</h3>
          <p className="muted">Track fixed deposits, process monthly interest, and use live database reports for operational decisions.</p>
        </div>
      </div>

      <div className="card access-card">
        <div>
          <span className="access-label">ROLE-BASED ACCESS</span>
          <h2>One secure sign-in, the right workspace.</h2>
          <p className="muted">Agents manage customers and accounts. Customers can view only their own financial records. Administrators access oversight and reporting.</p>
        </div>
        <Link className="btn" href="/login">Continue to sign in</Link>
      </div>
    </div>
  );
}
