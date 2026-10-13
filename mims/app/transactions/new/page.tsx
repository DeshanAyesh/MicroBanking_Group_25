"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

export default function NewTransaction() {
  const [type, setType] = useState("DEPOSIT");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setMsg("");
    setLoading(true);

    try {
      const endpoint =
        type === "DEPOSIT"
          ? "/api/transactions/deposit"
          : "/api/transactions/withdraw";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accountIdentifier,
          amount: Number(amount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Transaction failed.");
      }

      setMsg(
        `${data.message} Transaction Ref: ${data.transactionRef}. ` +
        `New Balance: LKR ${Number(data.balanceAfter).toFixed(2)}`
      );

      setAmount("");

    } catch (error) {
      setMsg(
        error instanceof Error
          ? error.message
          : "Transaction failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <PageHeader
        title="Process Transaction"
        description="Process deposits and withdrawals atomically."
      />

      <form className="card form" onSubmit={submit}>

        <div className="field">
          <label>Transaction type</label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="DEPOSIT">DEPOSIT</option>
            <option value="WITHDRAWAL">WITHDRAWAL</option>
          </select>
        </div>

        <div className="field">
          <label>Account Number / ID</label>

          <input
            value={accountIdentifier}
            onChange={(e) =>
              setAccountIdentifier(e.target.value)
            }
            placeholder="Example: ACC00001 or 1"
            required
          />
        </div>

        <div className="field">
          <label>Amount (LKR)</label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>

        <div className="notice">
          {type === "DEPOSIT"
            ? "The deposit will update the account balance and create a DEPOSIT transaction atomically."
            : "The withdrawal will check available balance and minimum balance before updating the account atomically."
          }
        </div>

        <button
          className="btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : type === "DEPOSIT"
              ? "Process Deposit"
              : "Process Withdrawal"
          }
        </button>

        {msg && (
          <div className="notice" style={{ marginTop: 16 }}>
            {msg}
          </div>
        )}

      </form>
    </div>
  );
}
