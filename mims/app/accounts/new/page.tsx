"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type SavingsPlan = {
  plan_id: number;
  plan_name: string;
  interest_rate: string | number;
  minimum_balance: string | number;
  minimum_age: number | null;
  maximum_age: number | null;
};

type Customer = {
  customer_id: number;
  nic: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
};

export default function NewAccountPage() {
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [planId, setPlanId] = useState("");
  const [primaryCustomerId, setPrimaryCustomerId] = useState("");
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "JOINT">(
    "INDIVIDUAL"
  );
  const [holderIds, setHolderIds] = useState<string[]>([]);
  const [openingDeposit, setOpeningDeposit] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.plan_id === Number(planId)),
    [plans, planId]
  );

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch("/api/accounts/options");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load form details.");
        }

        setPlans(data.plans);
        setCustomers(data.customers);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load form details."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

  function changeAccountType(type: "INDIVIDUAL" | "JOINT") {
    setAccountType(type);
    setPlanId("");

    if (type === "INDIVIDUAL" && primaryCustomerId) {
      setHolderIds([primaryCustomerId]);
    }
  }

  function changePrimaryCustomer(customerId: string) {
    setPrimaryCustomerId(customerId);

    if (accountType === "INDIVIDUAL") {
      setHolderIds(customerId ? [customerId] : []);
      return;
    }

    if (customerId && !holderIds.includes(customerId)) {
      setHolderIds([...holderIds, customerId]);
    }
  }

  function changeJointHolders(selectedValues: string[]) {
    if (
      primaryCustomerId &&
      !selectedValues.includes(primaryCustomerId)
    ) {
      setHolderIds([...selectedValues, primaryCustomerId]);
      return;
    }

    setHolderIds(selectedValues);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!planId || !primaryCustomerId || !openingDeposit) {
      setError("Select a plan, primary customer, and opening deposit.");
      return;
    }

    if (
      accountType === "INDIVIDUAL" &&
      holderIds.length !== 1
    ) {
      setError("An individual account must have one holder.");
      return;
    }

    if (
      accountType === "JOINT" &&
      holderIds.length < 2
    ) {
      setError("A joint account must have at least two holders.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: Number(planId),
          primaryCustomerId: Number(primaryCustomerId),
          accountType,
          holderIds: holderIds.map(Number),
          openingDeposit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to open account.");
      }

      setMessage(
        `Account created successfully. Account number: ${data.accountNumber}`
      );

      setPlanId("");
      setPrimaryCustomerId("");
      setHolderIds([]);
      setOpeningDeposit("");
      setAccountType("INDIVIDUAL");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to open account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <PageHeader
        title="Open Savings Account"
        description="Create an individual or joint savings account for an existing customer."
      />

      <form className="card form" onSubmit={submit}>
        {loading && <p className="muted">Loading plans and customers...</p>}

        {!loading && (
          <>
            <div className="field">
              <label>Account type</label>

              <select
                value={accountType}
                onChange={(event) =>
                  changeAccountType(
                    event.target.value as "INDIVIDUAL" | "JOINT"
                  )
                }
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="JOINT">Joint</option>
              </select>
            </div>

            <div className="field">
              <label>Savings plan</label>

              <select
                value={planId}
                onChange={(event) => setPlanId(event.target.value)}
                required
              >
                <option value="">Select a plan</option>

                {plans
                  .filter((plan) =>
                    accountType === "JOINT"
                      ? plan.plan_name === "Joint"
                      : plan.plan_name !== "Joint"
                  )
                  .map((plan) => (
                    <option key={plan.plan_id} value={plan.plan_id}>
                      {plan.plan_name} - {plan.interest_rate}% interest -
                      minimum LKR {plan.minimum_balance}
                    </option>
                  ))}
              </select>

              {selectedPlan && (
                <p className="muted small">
                  Required opening deposit: LKR{" "}
                  {selectedPlan.minimum_balance}
                </p>
              )}
            </div>

            <div className="field">
              <label>Primary customer</label>

              <select
                value={primaryCustomerId}
                onChange={(event) =>
                  changePrimaryCustomer(event.target.value)
                }
                required
              >
                <option value="">Select a customer</option>

                {customers.map((customer) => (
                  <option
                    key={customer.customer_id}
                    value={customer.customer_id}
                  >
                    {customer.first_name} {customer.last_name} -{" "}
                    {customer.nic} (ID {customer.customer_id})
                  </option>
                ))}
              </select>
            </div>

            {accountType === "JOINT" && (
              <div className="field">
                <label>Joint account holders</label>

                <select
                  multiple
                  size={7}
                  value={holderIds}
                  onChange={(event) =>
                    changeJointHolders(
                      Array.from(event.target.selectedOptions).map(
                        (option) => option.value
                      )
                    )
                  }
                >
                  {customers.map((customer) => (
                    <option
                      key={customer.customer_id}
                      value={customer.customer_id}
                    >
                      {customer.first_name} {customer.last_name} -{" "}
                      {customer.nic} (ID {customer.customer_id})
                    </option>
                  ))}
                </select>

                <p className="muted small">
                  Hold Ctrl while selecting multiple customers. The primary
                  customer is included automatically.
                </p>
              </div>
            )}

            <div className="field">
              <label>Opening deposit (LKR)</label>

              <input
                type="text"
                inputMode="decimal"
                placeholder="Example: 1000.00"
                value={openingDeposit}
                onChange={(event) => setOpeningDeposit(event.target.value)}
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            {message && (
              <div className="notice">
                {message}
              </div>
            )}

            <button className="btn" disabled={submitting}>
              {submitting ? "Creating account..." : "Open savings account"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}