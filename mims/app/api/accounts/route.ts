import { NextRequest, NextResponse } from "next/server";  
//nextrequest ->incoming request
//nextresponse -> respose back to ui

import { requireRole } from "@/lib/auth/authorization"; //requireRole checks the login-session cookie and verifies that the requester has an allowed role.
// It checks the person operating the system—not the customer whose account is being opened.
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } 
from "mysql2";import type { PoolConnection } from "mysql2/promise";
import { randomBytes } from "node:crypto";

export async function GET(request: NextRequest) {
  if (!requireRole(request, ["ADMIN","AGENT","CUSTOMER"])) return NextResponse.json({message:"Unauthorized."},{status:401});
  return NextResponse.json({message:"BLOCKED — SQL TODO required: account query."},{status:501});
}


function isWithinBusinessHours(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  const weekday = getPart("weekday");
  const hour = Number(getPart("hour"));
  const minute = Number(getPart("minute"));

  const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(
    weekday ?? ""
  );

  const minutesSinceMidnight = hour * 60 + minute;

  return (
    isWeekday &&
    minutesSinceMidnight >= 9 * 60 &&
    minutesSinceMidnight < 15 * 60
  );
  // return true; // TEMPORARY: allows testing outside business hours
}

//ui->post api->permission check->input checks ->db look ups ->save ->response to ui
export async function POST(request: NextRequest) {
  // Only admins and agents can open accounts.
 const session = requireRole(request, ["ADMIN", "AGENT"]);

if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  //  Read the JSON sent by the form.
  let body;
  let connection: PoolConnection | undefined;
  let transactionStarted = false;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON request." },
      { status: 400 }
    );
  }

  // 3. Make sure the submitted data is an object.
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { message: "Invalid account details." },
      { status: 400 }
    );
  }

  //  Extract the account details.
 const {
  planId,
  primaryCustomerId,
  accountType,
  holderIds,
  openingDeposit,
} = body;
  //checking paln id

  if (!Number.isSafeInteger(planId) || planId <= 0) {
    return NextResponse.json(
      { message: "Plan ID must be a positive whole number." },
      { status: 400 }
    );}
  //checking customer id

  if (
    !Number.isSafeInteger(primaryCustomerId) ||
    primaryCustomerId <= 0
  ) {
    return NextResponse.json(
      { message: "Customer ID must be a positive whole number." },
      { status: 400 }
    );
  }

  //checking acc type
  if (
  accountType !== "INDIVIDUAL" &&
  accountType !== "JOINT"
) {
  return NextResponse.json(
    { message: "Account type must be INDIVIDUAL or JOINT." },
    { status: 400 }
  );
}

//account holders array check
if (!Array.isArray(holderIds)) {
  return NextResponse.json(
    { message: "Account holders must be provided as a list." },
    { status: 400 }
  );
}

if (
  holderIds.length === 0 ||
  !holderIds.every(
    (id: unknown) =>
      typeof id === "number" &&
      Number.isSafeInteger(id) &&
      id > 0
  )
) {
  return NextResponse.json(
    { message: "Provide at least one holder with a valid customer ID." },
    { status: 400 }
  );
}
  //duplicate check
  if (new Set(holderIds).size !== holderIds.length) {
  return NextResponse.json(
    { message: "The same customer cannot be added more than once." },
    { status: 400 }
  );
}

// The primary customer must be one of the account holders.
if (!holderIds.includes(primaryCustomerId)) {
  return NextResponse.json(
    { message: "The primary customer must be included in the holders." },
    { status: 400 }
  );
}

// An individual account must have exactly one holder.
if (accountType === "INDIVIDUAL" && holderIds.length !== 1) {
  return NextResponse.json(
    { message: "An individual account must have exactly one holder." },
    { status: 400 }
  );
}

// A joint account must have at least two distinct holders.
if (accountType === "JOINT" && holderIds.length < 2) {
  return NextResponse.json(
    { message: "A joint account must have at least two holders." },
    { status: 400 }
  );
}
if (
  typeof openingDeposit !== "string" ||
  !/^\d{1,13}(\.\d{1,2})?$/.test(openingDeposit)
) {
  return NextResponse.json(
    {
      message:
        "Opening deposit must be a non-negative amount with at most two decimal places.",
    },
    { status: 400 }
  );
}

// Convert decimal amounts into whole cents for exact comparison.
const toCents = (amount: string): bigint => {
  const [whole, fraction = ""] = amount.split(".");

  return (
    BigInt(whole) * BigInt(100) +
    BigInt(fraction.padEnd(2, "0"))
  );
};
if (!isWithinBusinessHours()) {
  return NextResponse.json(
    {
      message:
        "Accounts can be opened Monday to Friday, from 9:00 a.m. to before 3:00 p.m. Sri Lanka time.",
    },
    { status: 403 }
  );
}
  // Account creation will be added in the next steps.
 try {
connection = await getDbPool().getConnection();
await connection.beginTransaction();
transactionStarted = true;

  // 1. Find the selected savings plan.
  const [plans] = await connection.execute<RowDataPacket[]>(
    `SELECT plan_id, plan_name, minimum_age,
            maximum_age, minimum_balance
     FROM savings_plan
     WHERE plan_id = ?
     FOR UPDATE`,
    [planId]
  );

  if (plans.length === 0) {
    return NextResponse.json(
      { message: "The selected savings plan does not exist." },
      { status: 400 }
    );
  }

  const plan = plans[0];
  if (
  toCents(openingDeposit) <
  toCents(String(plan.minimum_balance))
) {
  return NextResponse.json(
    {
      message:
        `Opening deposit must be at least LKR ${plan.minimum_balance}.`,
    },
    { status: 400 }
  );
}

  // 2. Find all selected holders.
  const placeholders = holderIds.map(() => "?").join(", ");

  const [customers] = await connection.execute<RowDataPacket[]>(
    `SELECT customer_id, status,
            TIMESTAMPDIFF(YEAR, date_of_birth, CURRENT_DATE) AS age,
            date_of_birth > CURRENT_DATE AS future_birth
     FROM customer
     WHERE customer_id IN (${placeholders})
     ORDER BY customer_id
      FOR UPDATE`,
    holderIds
  );

  if (customers.length !== holderIds.length) {
    return NextResponse.json(
      { message: "One or more selected customers do not exist." },
      { status: 400 }
    );
  }
  // Make sure the selected plan matches the account type.
const isJointPlan = plan.plan_name.toLowerCase() === "joint";

if (
  (accountType === "JOINT" && !isJointPlan) ||
  (accountType === "INDIVIDUAL" && isJointPlan)
) {
  return NextResponse.json(
    { message: "The selected plan does not match the account type." },
    { status: 400 }
  );
}

// Check every holder's status and age.
for (const customer of customers) {
  if (customer.status !== "ACTIVE") {
    return NextResponse.json(
      { message: `Customer ${customer.customer_id} is not active.` },
      { status: 400 }
    );
  }

  if (customer.age === null || customer.future_birth) {
    return NextResponse.json(
      {
        message:
          `Customer ${customer.customer_id} has an invalid date of birth.`,
      },
      { status: 400 }
    );
  }

  if (
    (plan.minimum_age !== null &&
      customer.age < plan.minimum_age) ||
    (plan.maximum_age !== null &&
      customer.age > plan.maximum_age)
  ) {
    return NextResponse.json(
      {
        message:
          `Customer ${customer.customer_id} does not meet the ${plan.plan_name} plan age requirements.`,
      },
      { status: 400 }
    );
  }
}

  // Eligibility checks and account creation come next.
// Find the acting agent's database ID.
let agentId: number | null = null;

if (session.role === "AGENT") {
  const [agents] = await connection.execute<RowDataPacket[]>(
    `SELECT agent_id
     FROM agent
     WHERE user_id = ? AND status = 'ACTIVE'
     FOR UPDATE`,
    [session.userId]
  );

  if (agents.length === 0) {
    return NextResponse.json(
      { message: "An active agent profile is required." },
      { status: 403 }
    );
  }

  agentId = agents[0].agent_id;
}

// Generate a 20-character account number.
const accountNumber =
  "SA" + randomBytes(9).toString("hex").toUpperCase();

// Create the savings account.
const [result] = await connection.execute<ResultSetHeader>(
  `INSERT INTO savings_account
     (account_number, primary_customer_id, plan_id,
      acc_type, current_balance)
   VALUES (?, ?, ?, ?, ?)`,
  [
    accountNumber,
    primaryCustomerId,
    planId,
    accountType,
    openingDeposit,
  ]
);

const accountId = result.insertId;

// Store every joint holder, including the primary customer.
if (accountType === "JOINT") {
  for (const customerId of holderIds) {
    await connection.execute(
      `INSERT INTO joint_account_holders
         (account_id, customer_id)
       VALUES (?, ?)`,
      [accountId, customerId]
    );
  }
}

// Record opening funds as a deposit.
// A zero-balance Children's account has no opening transaction.
if (toCents(openingDeposit) > BigInt(0)) {
  await connection.execute(
    `INSERT INTO account_transaction
       (transaction_ref, account_id, agent_id,
        transaction_type, amount, balance_after)
     VALUES (?, ?, ?, 'DEPOSIT', ?, ?)`,
    [
      "OPEN-" + accountNumber,
      accountId,
      agentId,
      openingDeposit,
      openingDeposit,
    ]
  );
}

// Save all changes together.
await connection.commit();
transactionStarted = false;

return NextResponse.json(
  {
    message: "Savings account created successfully.",
    accountId,
    accountNumber,
  },
  { status: 201 }
);
  
} catch (error) {
  console.error("Account creation failed:", error);

  return NextResponse.json(
    { message: "Unable to create the account. Please try again." },
    { status: 500 }
  );
} finally {
  if (connection) {
    let reusable = true;

    if (transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        reusable = false;
        console.error("Account rollback failed:", rollbackError);
        connection.destroy();
      }
    }

    if (reusable) {
      connection.release();
    }
  }

}
}