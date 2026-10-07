import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";

const MIN_PRINCIPAL_CENTS = 500000; // LKR 5,000.00 (SRS 4.5.3 #10)

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const toCents = (value: string | number) => Math.round(Number(value) * 100);

// GET /api/fixed-deposits  -> list FDs (customers only see their own)
export async function GET(request: NextRequest) {
  const session = requireRole(request, ["ADMIN", "AGENT", "CUSTOMER"]);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const params: number[] = [];
    let customerFilter = "";

    if (session.role === "CUSTOMER") {
      customerFilter = `
        WHERE EXISTS (
          SELECT 1
          FROM customer c
          WHERE c.user_id = ?
            AND (
              c.customer_id = sa.primary_customer_id
              OR EXISTS (
                SELECT 1
                FROM joint_account_holders j
                WHERE j.account_id = sa.account_id
                  AND j.customer_id = c.customer_id
              )
            )
        )`;
      params.push(session.userId);
    }

    const [rows] = await getDbPool().execute<RowDataPacket[]>(
      `SELECT
          fd.fd_id,
          fd.fd_number,
          fd.linked_account_id,
          sa.account_number,
          p.plan_name,
          p.term_months,
          p.interest_rate,
          fd.deposit_amount,
          DATE_FORMAT(fd.start_date, '%Y-%m-%d')       AS start_date,
          DATE_FORMAT(fd.maturity_date, '%Y-%m-%d')    AS maturity_date,
          DATE_FORMAT(fd.next_payout_date, '%Y-%m-%d') AS next_payout_date,
          fd.status
       FROM fixed_deposit fd
       JOIN savings_account sa ON sa.account_id = fd.linked_account_id
       JOIN fixed_deposit_plan p ON p.fd_plan_id = fd.fd_plan_id
       ${customerFilter}
       ORDER BY fd.fd_id`,
      params
    );

    return NextResponse.json({ fixedDeposits: rows });
  } catch (error) {
    console.error("Fetch fixed deposits failed:", error);
    return NextResponse.json(
      { message: "Unable to load fixed deposits." },
      { status: 500 }
    );
  }
}

// POST /api/fixed-deposits  -> create an FD (one atomic DB transaction)
export async function POST(request: NextRequest) {
  const session = requireRole(request, ["ADMIN", "AGENT"]);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const accountId = Number(body.account_id);
  const planId = Number(body.fd_plan_id);
  const principalText = String(body.deposit_amount ?? "").trim();

  if (!Number.isSafeInteger(accountId) || accountId <= 0) {
    return NextResponse.json({ message: "Account ID must be a positive whole number." }, { status: 400 });
  }
  if (!Number.isSafeInteger(planId) || planId <= 0) {
    return NextResponse.json({ message: "Select a valid FD term." }, { status: 400 });
  }
  if (!/^\d+(\.\d{1,2})?$/.test(principalText)) {
    return NextResponse.json(
      { message: "Principal must be a positive amount with at most 2 decimal places." },
      { status: 400 }
    );
  }
  const principalCents = toCents(principalText);
  if (principalCents < MIN_PRINCIPAL_CENTS) {
    return NextResponse.json({ message: "Minimum FD principal is LKR 5,000.00." }, { status: 400 });
  }

  const connection = await getDbPool().getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock the savings account row so the balance cannot change under us
    const [accounts] = await connection.execute<RowDataPacket[]>(
      `SELECT sa.account_id, sa.account_number, sa.status, sa.current_balance, sp.minimum_balance
         FROM savings_account sa
         JOIN savings_plan sp ON sp.plan_id = sa.plan_id
        WHERE sa.account_id = ?
        FOR UPDATE`,
      [accountId]
    );
    if (accounts.length === 0) throw new HttpError(404, "Savings account not found.");
    const account = accounts[0];
    if (account.status !== "ACTIVE") throw new HttpError(409, "Savings account is not active.");

    // 2. One FD per savings account
    const [existing] = await connection.execute<RowDataPacket[]>(
      "SELECT fd_id FROM fixed_deposit WHERE linked_account_id = ?",
      [accountId]
    );
    if (existing.length > 0) {
      throw new HttpError(409, "This savings account already has a fixed deposit.");
    }

    // 3. FD plan (term + rate)
    const [plans] = await connection.execute<RowDataPacket[]>(
      "SELECT fd_plan_id, plan_name, term_months FROM fixed_deposit_plan WHERE fd_plan_id = ?",
      [planId]
    );
    if (plans.length === 0) throw new HttpError(400, "Selected FD term does not exist.");
    const plan = plans[0];
    const termMonths = Number(plan.term_months);
    if (!Number.isInteger(termMonths) || termMonths <= 0) {
      throw new Error("Invalid term_months in fixed_deposit_plan.");
    }

    // 4. Balance must stay at or above the account plan's minimum balance
    const remainingCents = toCents(account.current_balance) - principalCents;
    if (remainingCents < toCents(account.minimum_balance)) {
      throw new HttpError(
        400,
        "Insufficient balance: the account would fall below its minimum balance."
      );
    }

    // 5. Who is performing this? (agent_id is NULL for admins)
    let agentId: number | null = null;
    if (session.role === "AGENT") {
      const [agents] = await connection.execute<RowDataPacket[]>(
        "SELECT agent_id FROM agent WHERE user_id = ?",
        [session.userId]
      );
      if (agents.length === 0) throw new HttpError(403, "No agent profile for this user.");
      agentId = agents[0].agent_id;
    }

    // 6. Create the FD. termMonths comes from the DB (validated integer), not from the user.
    //    maturity = start + term (SRS 4.5.3 #5), first payout = start + 30 days (SRS 4.6.3 #2)
    const [fdInsert] = await connection.execute<ResultSetHeader>(
      `INSERT INTO fixed_deposit
         (fd_number, linked_account_id, fd_plan_id, deposit_amount,
          start_date, maturity_date, next_payout_date, status)
       VALUES
         (LEFT(REPLACE(UUID(), '-', ''), 20), ?, ?, ?,
          CURDATE(),
          DATE_ADD(CURDATE(), INTERVAL ${termMonths} MONTH),
          DATE_ADD(CURDATE(), INTERVAL 30 DAY),
          'ACTIVE')`,
      [accountId, planId, principalText]
    );
    const fdId = fdInsert.insertId;
    await connection.execute(
      "UPDATE fixed_deposit SET fd_number = CONCAT('FD', LPAD(fd_id, 5, '0')) WHERE fd_id = ?",
      [fdId]
    );

    // 7. Debit the principal from the savings account (SRS 4.5.3 #9)
    await connection.execute(
      "UPDATE savings_account SET current_balance = current_balance - ? WHERE account_id = ?",
      [principalText, accountId]
    );
    const [balances] = await connection.execute<RowDataPacket[]>(
      "SELECT current_balance FROM savings_account WHERE account_id = ?",
      [accountId]
    );
    const balanceAfter = balances[0].current_balance;

    // 8. Audit trail: every balance change logs a transaction (SRS 5.4).
    //    NOTE: logged as WITHDRAWAL with an FDP reference prefix - see PR notes.
    const [txInsert] = await connection.execute<ResultSetHeader>(
      `INSERT INTO account_transaction
         (transaction_ref, account_id, agent_id, transaction_type, amount, balance_after)
       VALUES (LEFT(REPLACE(UUID(), '-', ''), 20), ?, ?, 'WITHDRAWAL', ?, ?)`,
      [accountId, agentId, principalText, balanceAfter]
    );
    await connection.execute(
      "UPDATE account_transaction SET transaction_ref = CONCAT('FDP', LPAD(transaction_id, 6, '0')) WHERE transaction_id = ?",
      [txInsert.insertId]
    );

    // 9. Read the new FD back for the response
    const [created] = await connection.execute<RowDataPacket[]>(
      `SELECT fd.fd_id, fd.fd_number, sa.account_number, p.plan_name, p.interest_rate,
              fd.deposit_amount,
              DATE_FORMAT(fd.start_date, '%Y-%m-%d')       AS start_date,
              DATE_FORMAT(fd.maturity_date, '%Y-%m-%d')    AS maturity_date,
              DATE_FORMAT(fd.next_payout_date, '%Y-%m-%d') AS next_payout_date,
              fd.status
         FROM fixed_deposit fd
         JOIN savings_account sa ON sa.account_id = fd.linked_account_id
         JOIN fixed_deposit_plan p ON p.fd_plan_id = fd.fd_plan_id
        WHERE fd.fd_id = ?`,
      [fdId]
    );

    await connection.commit();

    return NextResponse.json(
      { message: "Fixed deposit created.", fixedDeposit: created[0], balanceAfter },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();

    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "This savings account already has a fixed deposit." },
        { status: 409 }
      );
    }
    console.error("Create fixed deposit failed:", error);
    return NextResponse.json({ message: "Unable to create fixed deposit." }, { status: 500 });
  } finally {
    connection.release();
  }
}