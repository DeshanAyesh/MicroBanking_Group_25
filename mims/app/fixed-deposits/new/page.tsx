"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

type Plan = {
  fd_plan_id: number;
  plan_name: string;
  term_months: number;
  interest_rate: string | number;
};

type Account = {
  account_id: number;
  account_number: string;
  customer_name: string;
  current_balance: string | number;
  minimum_balance: string | number;
};

export default function NewFixedDepositPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [fdPlanId, setFdPlanId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.fd_plan_id === Number(fdPlanId)),
    [plans, fdPlanId]
  );

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.account_id === Number(accountId)),
    [accounts, accountId]
  );

  useEffect(() => {
    fetch("/api/fixed-deposits/options")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load form options.");
        }

        setPlans(data.plans);
        setAccounts(data.accounts);
      })
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load form options."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSaving(true);

    try {
      const response = await fetch("/api/fixed-deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_id: Number(accountId),
          fd_plan_id: Number(fdPlanId),
          deposit_amount: depositAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create fixed deposit.");
      }

      router.push("/fixed-deposits");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create fixed deposit."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <PageHeader
        title="Create Fixed Deposit"
        description="The principal is transferred from the linked savings account."
      />

      <form className="card form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="account">Eligible savings account</label>

          <select
            id="account"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            required
            disabled={loading}
          >
            <option value="">Select an account</option>

            {accounts.map((account) => (
              <option
                key={account.account_id}
                value={account.account_id}
              >
                {account.account_number} — {account.customer_name} (
                LKR {Number(account.current_balance).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="plan">Fixed deposit plan</label>

          <select
            id="plan"
            value={fdPlanId}
            onChange={(event) => setFdPlanId(event.target.value)}
            required
            disabled={loading}
          >
            <option value="">Select a plan</option>

            {plans.map((plan) => (
              <option key={plan.fd_plan_id} value={plan.fd_plan_id}>
                {plan.plan_name} — {plan.interest_rate}%
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="amount">Principal (LKR)</label>

          <input
            id="amount"
            value={depositAmount}
            onChange={(event) => setDepositAmount(event.target.value)}
            required
            type="number"
            min="5000"
            step="0.01"
            placeholder="Minimum: 5000.00"
          />
        </div>

        {selectedPlan && (
          <div className="card">
            <strong>
              {selectedPlan.plan_name}: {selectedPlan.interest_rate}% for{" "}
              {selectedPlan.term_months} months
            </strong>

            {selectedAccount && (
              <p className="muted small">
                The account must retain at least LKR{" "}
                {Number(
                  selectedAccount.minimum_balance
                ).toLocaleString()}{" "}
                after the transfer.
              </p>
            )}
          </div>
        )}

        <button className="btn" disabled={loading || saving}>
          {saving ? "Creating..." : "Create fixed deposit"}
        </button>

        {message && <p className="error">{message}</p>}
      </form>
    </div>
  );
}
