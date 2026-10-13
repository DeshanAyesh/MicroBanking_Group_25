"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import styles from "./new-account.module.css";

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

type CreatedAccount = {
  accountId: number;
  accountNumber: string;
};

const money = (value: string | number) =>
  `LKR ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const customerName = (customer: Customer) =>
  `${customer.first_name} ${customer.last_name}`;

function ageOf(dateOfBirth: string) {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export default function NewAccountPage() {
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [planId, setPlanId] = useState("");
  const [primaryCustomerId, setPrimaryCustomerId] = useState("");
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "JOINT">("INDIVIDUAL");
  const [holderIds, setHolderIds] = useState<string[]>([]);
  const [holderSearch, setHolderSearch] = useState("");
  const [openingDeposit, setOpeningDeposit] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<CreatedAccount | null>(null);
  const [error, setError] = useState("");

  const availablePlans = useMemo(
    () => plans.filter((plan) =>
      accountType === "JOINT"
        ? plan.plan_name.toLowerCase() === "joint"
        : plan.plan_name.toLowerCase() !== "joint"
    ),
    [plans, accountType]
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.plan_id === Number(planId)),
    [plans, planId]
  );

  const primaryCustomer = useMemo(
    () => customers.find((customer) => customer.customer_id === Number(primaryCustomerId)),
    [customers, primaryCustomerId]
  );

  const selectedHolders = useMemo(
    () => customers.filter((customer) => holderIds.includes(String(customer.customer_id))),
    [customers, holderIds]
  );

  const visibleHolderOptions = useMemo(() => {
    const term = holderSearch.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      `${customerName(customer)} ${customer.nic} ${customer.customer_id}`
        .toLowerCase()
        .includes(term)
    );
  }, [customers, holderSearch]);

  const ageWarnings = useMemo(() => {
    if (!selectedPlan) return [];
    return selectedHolders.filter((customer) => {
      const age = ageOf(customer.date_of_birth);
      return (
        (selectedPlan.minimum_age !== null && age < selectedPlan.minimum_age) ||
        (selectedPlan.maximum_age !== null && age > selectedPlan.maximum_age)
      );
    });
  }, [selectedHolders, selectedPlan]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOptions() {
      try {
        const response = await fetch("/api/accounts/options", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load form details.");
        }
        setPlans(data.plans);
        setCustomers(data.customers);
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(error instanceof Error ? error.message : "Unable to load form details.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadOptions();
    return () => controller.abort();
  }, []);

  function changeAccountType(type: "INDIVIDUAL" | "JOINT") {
    setAccountType(type);
    setPlanId("");
    setError("");
    setCreatedAccount(null);
    setHolderIds(primaryCustomerId ? [primaryCustomerId] : []);
  }

  function changePrimaryCustomer(customerId: string) {
    const previousPrimary = primaryCustomerId;
    setPrimaryCustomerId(customerId);
    setCreatedAccount(null);

    if (accountType === "INDIVIDUAL") {
      setHolderIds(customerId ? [customerId] : []);
      return;
    }

    setHolderIds((current) => {
      const withoutPrevious = current.filter((id) => id !== previousPrimary);
      return customerId && !withoutPrevious.includes(customerId)
        ? [...withoutPrevious, customerId]
        : withoutPrevious;
    });
  }

  function toggleHolder(customerId: string) {
    if (customerId === primaryCustomerId) return;
    setHolderIds((current) =>
      current.includes(customerId)
        ? current.filter((id) => id !== customerId)
        : [...current, customerId]
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreatedAccount(null);

    if (!planId || !primaryCustomerId || !openingDeposit) {
      setError("Select a plan, primary customer, and opening deposit.");
      return;
    }
    if (accountType === "INDIVIDUAL" && holderIds.length !== 1) {
      setError("An individual account must have exactly one holder.");
      return;
    }
    if (accountType === "JOINT" && holderIds.length < 2) {
      setError("Select at least one additional joint holder.");
      return;
    }
    if (selectedPlan && Number(openingDeposit) < Number(selectedPlan.minimum_balance)) {
      setError(`Opening deposit must be at least ${money(selectedPlan.minimum_balance)}.`);
      return;
    }
    if (ageWarnings.length) {
      setError("One or more selected customers do not meet the plan age requirements.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setCreatedAccount({ accountId: data.accountId, accountNumber: data.accountNumber });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to open account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`container ${styles.page}`}>
      <Link className={styles.backLink} href="/accounts">← Savings accounts</Link>
      <PageHeader
        title="Open Savings Account"
        description="Create an individual or joint account for active, registered customers."
      />

      {loading ? <div className={styles.loading}>Loading plans and customers...</div> : (
        <form className={styles.layout} onSubmit={submit}>
          <div className={styles.formPanel}>
            <section className={styles.section}>
              <div className={styles.sectionHeading}><span>1</span><div><h2>Choose ownership</h2><p>Decide who can access this account.</p></div></div>
              <div className={styles.typeGrid}>
                <button type="button" className={accountType === "INDIVIDUAL" ? styles.selected : ""} onClick={() => changeAccountType("INDIVIDUAL")}>
                  <strong>Individual account</strong><span>One registered customer owns the account.</span>
                </button>
                <button type="button" className={accountType === "JOINT" ? styles.selected : ""} onClick={() => changeAccountType("JOINT")}>
                  <strong>Joint account</strong><span>A primary customer shares access with other holders.</span>
                </button>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeading}><span>2</span><div><h2>Select a savings plan</h2><p>Plan rules are verified again by the API and database transaction.</p></div></div>
              <div className={styles.planGrid}>
                {availablePlans.map((plan) => (
                  <button key={plan.plan_id} type="button" className={planId === String(plan.plan_id) ? styles.selectedPlan : ""} onClick={() => setPlanId(String(plan.plan_id))}>
                    <span>{plan.plan_name}</span>
                    <strong>{Number(plan.interest_rate).toFixed(2)}%</strong>
                    <small>Minimum {money(plan.minimum_balance)}</small>
                    <small>Age {plan.minimum_age ?? "Any"}–{plan.maximum_age ?? "Any"}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeading}><span>3</span><div><h2>Assign customers</h2><p>The primary customer is always included as an account holder.</p></div></div>
              <label className={styles.field}>Primary customer
                <select value={primaryCustomerId} onChange={(event) => changePrimaryCustomer(event.target.value)} required>
                  <option value="">Select a registered customer</option>
                  {customers.map((customer) => (
                    <option key={customer.customer_id} value={customer.customer_id}>
                      {customerName(customer)} — {customer.nic} — age {ageOf(customer.date_of_birth)}
                    </option>
                  ))}
                </select>
              </label>

              {accountType === "JOINT" && (
                <div className={styles.holderPicker}>
                  <div className={styles.holderToolbar}><strong>Additional holders</strong><input value={holderSearch} onChange={(event) => setHolderSearch(event.target.value)} placeholder="Search customers" /></div>
                  <div className={styles.customerList}>
                    {visibleHolderOptions.map((customer) => {
                      const id = String(customer.customer_id);
                      const primary = id === primaryCustomerId;
                      return <label key={customer.customer_id} className={styles.customerOption}>
                        <input type="checkbox" checked={holderIds.includes(id)} disabled={primary} onChange={() => toggleHolder(id)} />
                        <span><strong>{customerName(customer)}</strong><small>{customer.nic} · age {ageOf(customer.date_of_birth)}{primary ? " · Primary" : ""}</small></span>
                      </label>;
                    })}
                  </div>
                  <p className={styles.selectionCount}>{holderIds.length} holders selected</p>
                </div>
              )}

              {ageWarnings.length > 0 && (
                <p className={styles.warning}>Age requirement not met by: {ageWarnings.map(customerName).join(", ")}.</p>
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeading}><span>4</span><div><h2>Record opening funds</h2><p>The deposit and initial transaction are committed atomically.</p></div></div>
              <label className={styles.field}>Opening deposit (LKR)
                <input type="text" inputMode="decimal" pattern="\d{1,13}(\.\d{1,2})?" placeholder={selectedPlan ? String(selectedPlan.minimum_balance) : "Example: 1000.00"} value={openingDeposit} onChange={(event) => setOpeningDeposit(event.target.value)} required />
                <small>{selectedPlan ? `Required minimum: ${money(selectedPlan.minimum_balance)}` : "Select a plan to see its minimum balance."}</small>
              </label>
            </section>

            {error && <p className="error">{error}</p>}
            {createdAccount && <div className={styles.success}><strong>Account created successfully</strong><span>{createdAccount.accountNumber}</span><Link href={`/accounts/${createdAccount.accountId}`}>Open account record →</Link></div>}

            <div className={styles.submitRow}>
              <Link className="btn secondary" href="/accounts">Cancel</Link>
              <button className="btn" disabled={submitting || !!createdAccount}>{submitting ? "Creating account..." : "Create savings account"}</button>
            </div>
          </div>

          <aside className={styles.review}>
            <span className={styles.reviewLabel}>Account review</span>
            <h2>{accountType === "JOINT" ? "Joint savings" : "Individual savings"}</h2>
            <dl>
              <div><dt>Plan</dt><dd>{selectedPlan?.plan_name ?? "Not selected"}</dd></div>
              <div><dt>Interest rate</dt><dd>{selectedPlan ? `${Number(selectedPlan.interest_rate).toFixed(2)}%` : "—"}</dd></div>
              <div><dt>Primary customer</dt><dd>{primaryCustomer ? customerName(primaryCustomer) : "Not selected"}</dd></div>
              <div><dt>Account holders</dt><dd>{holderIds.length || "—"}</dd></div>
              <div><dt>Opening deposit</dt><dd>{openingDeposit ? money(openingDeposit) : "—"}</dd></div>
            </dl>
            {selectedHolders.length > 0 && <div className={styles.chips}>{selectedHolders.map((customer) => <span key={customer.customer_id}>{customerName(customer)}</span>)}</div>}
            <p>Account, holders, and the opening transaction are saved in one database transaction. Any failure rolls everything back.</p>
          </aside>
        </form>
      )}
    </div>
  );
}
