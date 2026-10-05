import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = requireRole(request, ["ADMIN", "AGENT", "CUSTOMER"]);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const accountId = Number(id);

  if (!Number.isSafeInteger(accountId) || accountId <= 0) {
    return NextResponse.json(
      { message: "Account ID must be a positive whole number." },
      { status: 400 }
    );
  }

  try {
    const pool = getDbPool();

    let customerFilter = "";
    const accessParameters: number[] = [accountId];

    if (session.role === "CUSTOMER") {
      customerFilter = `
        AND EXISTS (
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

      accessParameters.push(session.userId);
    }

    const [accountRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
          sa.account_id,
          sa.account_number,
          sa.current_balance
       FROM savings_account sa
       WHERE sa.account_id = ?
       ${customerFilter}`,
      accessParameters
    );

    if (accountRows.length === 0) {
      return NextResponse.json(
        { message: "Account not found." },
        { status: 404 }
      );
    }

    const [transactions] = await pool.execute<RowDataPacket[]>(
      `SELECT
          t.transaction_id,
          t.transaction_ref,
          t.account_id,
          t.transaction_type,
          t.amount,
          t.balance_after,
          t.transaction_date,
          t.agent_id,
          CONCAT(a.first_name, ' ', a.last_name) AS agent_name
       FROM account_transaction t
       LEFT JOIN agent a
         ON a.agent_id = t.agent_id
       WHERE t.account_id = ?
       ORDER BY t.transaction_date DESC, t.transaction_id DESC`,
      [accountId]
    );

    return NextResponse.json({
      account: accountRows[0],
      transactions,
    });
  } catch (error) {
    console.error("Account transaction history failed:", error);

    return NextResponse.json(
      { message: "Unable to load account transaction history." },
      { status: 500 }
    );
  }
}