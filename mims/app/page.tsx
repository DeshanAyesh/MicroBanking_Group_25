import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <h1>B-Trust Microbanking & Interest Management System</h1>
        <p>
          A small, believable microfinance banking management system designed for a
          Database Systems university project. The database remains the heart of the application.
        </p>
      </section>

      <div className="grid grid-3">
        <div className="card">
          <h3>Database-first</h3>
          <p className="muted">MySQL integration points are ready while your team writes the SQL.</p>
        </div>
        <div className="card">
          <h3>Role-based</h3>
          <p className="muted">Admin, agent and customer areas are separated with authorization helpers.</p>
        </div>
        <div className="card">
          <h3>Financial flows</h3>
          <p className="muted">Deposit, withdrawal, fixed deposit and interest-processing flows are scaffolded.</p>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h2>Start here</h2>
        <div className="actions">
          <Link className="btn" href="/login">Login</Link>
          <Link className="btn secondary" href="/admin">Admin dashboard</Link>
          <Link className="btn secondary" href="/customers">Customer management</Link>
        </div>
      </div>
    </div>
  );
}
