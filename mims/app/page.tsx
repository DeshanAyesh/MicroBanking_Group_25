import Link from "next/link";

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 72px)" }}>
      <div className="container" style={{ flex: 1 }}>
        <section className="hero">
          <div className="hero-eyebrow">SECURE BANKING OPERATIONS PLATFORM</div>
          <h1>B-Trust Microbanking & Interest Management System</h1>
        </section>

        <div className="card access-card">
          <div>
            <h2>One secure sign-in, the right workspace.</h2>
          </div>
          <div className="access-actions flex justify-center w-full">
            <Link className="btn" href="/login">
              Continue to Log in
            </Link>
          </div>
        </div>
      </div>

      <footer className="footer w-full py-6 text-center text-sm text-gray-300">
        <p className="text-sm text-gray-300">
          Group 25. Database Systems Module. University of Moratuwa.
        </p>
      </footer>
    </div>
  );
}
