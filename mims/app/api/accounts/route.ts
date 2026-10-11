import { NextRequest, NextResponse } from "next/server";  

import { requireRole } from "@/lib/auth/authorization"; //requireRole checks the login-session cookie and verifies that the requester has an allowed role.
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } 
from "mysql2";import type { PoolConnection } from "mysql2/promise";
import { randomBytes } from "node:crypto";
export async function GET(request: NextRequest) {
  const session = requireRole(request, ["ADMIN", "AGENT", "CUSTOMER"]);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const pool = getDbPool();

    let customerFilter = "";
    const parameters: number[] = [];

    if (session.role === "CUSTOMER") {
      customerFilter = `
        WHERE EXISTS (
          SELECT 1
          FROM customer viewing_customer
          WHERE viewing_customer.user_id = ?
            AND (
              viewing_customer.customer_id = sa.primary_customer_id
              OR EXISTS (
                SELECT 1
                FROM joint_account_holders jah_access
                WHERE jah_access.account_id = sa.account_id
                  AND jah_access.customer_id = viewing_customer.customer_id
              )
            )
        )`;

      parameters.push(session.userId);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
          sa.account_id,
          sa.account_number,
          sa.acc_type,
          sa.current_balance,
          sa.status,
          sa.created_at,
          sp.plan_name,
          CONCAT(primary_customer.first_name, ' ', primary_customer.last_name)
            AS primary_customer_name,
          CASE
            WHEN sa.acc_type = 'JOINT'
              THEN COALESCE(holders.holder_names, '')
            ELSE CONCAT(primary_customer.first_name, ' ', primary_customer.last_name)
          END AS holder_names,
          CASE
            WHEN sa.acc_type = 'JOINT'
              THEN COALESCE(holders.holder_count, 0)
            ELSE 1
          END AS holder_count
       FROM savings_account sa
       JOIN savings_plan sp
         ON sp.plan_id = sa.plan_id
       JOIN customer primary_customer
         ON primary_customer.customer_id = sa.primary_customer_id
       LEFT JOIN (
         SELECT
           jah.account_id,
           COUNT(*) AS holder_count,
           GROUP_CONCAT(
             CONCAT(c.first_name, ' ', c.last_name)
             ORDER BY c.first_name, c.last_name
             SEPARATOR ', '
           ) AS holder_names
         FROM joint_account_holders jah
         JOIN customer c
           ON c.customer_id = jah.customer_id
         GROUP BY jah.account_id
       ) holders
         ON holders.account_id = sa.account_id
       ${customerFilter}
       ORDER BY sa.account_id DESC`,
      parameters
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Account list failed:", error);

    return NextResponse.json(
      { message: "Unable to load savings accounts." },
      { status: 500 }
    );
  }
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
}

export async function POST(request: NextRequest) {
const session = requireRole(request, ["AGENT"]);
if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { message: "Invalid account details." },
      { status: 400 }
    );
  }

 const {
  planId,
  primaryCustomerId,
  accountType,
  holderIds,
  openingDeposit,
} = body;

  if (!Number.isSafeInteger(planId) || planId <= 0) {
    return NextResponse.json(
      { message: "Plan ID must be a positive whole number." },
      { status: 400 }
    );}

  if (
    !Number.isSafeInteger(primaryCustomerId) ||
    primaryCustomerId <= 0
  ) {
    return NextResponse.json(
      { message: "Customer ID must be a positive whole number." },
      { status: 400 }
    );
  }

  if (
  accountType !== "INDIVIDUAL" &&
  accountType !== "JOINT"
) {
  return NextResponse.json(
    { message: "Account type must be INDIVIDUAL or JOINT." },
    { status: 400 }
  );
}

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
  if (new Set(holderIds).size !== holderIds.length) {
  return NextResponse.json(
    { message: "The same customer cannot be added more than once." },
    { status: 400 }
  );
}

if (!holderIds.includes(primaryCustomerId)) {
  return NextResponse.json(
    { message: "The primary customer must be included in the holders." },
    { status: 400 }
  );
}

if (accountType === "INDIVIDUAL" && holderIds.length !== 1) {
  return NextResponse.json(
    { message: "An individual account must have exactly one holder." },
    { status: 400 }
  );
}

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

const toCents = (amount: string): bigint => {
  const [whole, fraction = ""] = amount.split(".");

  return (
    BigInt(whole) * BigInt(100) +
    BigInt(fraction.padEnd(2, "0"))
  );
};
if (
  process.env.ENFORCE_BUSINESS_HOURS === "true" &&
  !isWithinBusinessHours()
) {
  return NextResponse.json(
    {
      message:
        "Accounts can be opened Monday to Friday, from 9:00 a.m. to before 3:00 p.m. Sri Lanka time.",
    },
    { status: 403 }
  );
}
 try {
connection = await getDbPool().getConnection();
await connection.beginTransaction();
transactionStarted = true;

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

const accountNumber =
  "SA" + randomBytes(9).toString("hex").toUpperCase();

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
