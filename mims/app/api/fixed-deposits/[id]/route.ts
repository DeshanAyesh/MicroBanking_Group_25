import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";

// GET /api/fixed-deposits/[id] -> one FD plus its interest payment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = requireRole(request, ["ADMIN", "AGENT", "CUSTOMER"]);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const fdId = Number(id);
  if (!Number.isSafeInteger(fdId) || fdId <= 0) {
    return NextResponse.json(
      { message: "Fixed deposit ID must be a positive whole number." },
      { status: 400 }
    );
  }

  try {
    const pool = getDbPool();
    const accessParams: number[] = [fdId];
    let customerFilter = "";

    // Customers only see FDs on their own accounts (primary or joint holder)
    if (session.role === "CUSTOMER") {
      customerFilter = `
        AND EXISTS (
          SELECT 1
          FROM customer viewer
          WHERE viewer.user_id = ?
            AND (
              viewer.customer_id = sa.primary_customer_id
              OR EXISTS (
                SELECT 1
                FROM joint_account_holders j
                WHERE j.account_id = sa.account_id
                  AND j.customer_id = viewer.customer_id
              )
            )
        )`;
      accessParams.push(session.userId);
    }

    const [fdRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
          fd.fd_id,
          fd.fd_number,
          sa.account_id,
          sa.account_number,
          CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
          fd.deposit_amount AS principal,
          p.plan_name,
          p.term_months,
          p.interest_rate,
          ROUND(fd.deposit_amount * p.interest_rate / 100 / 12, 2) AS monthly_interest,
          DATE_FORMAT(fd.start_date, '%Y-%m-%d')       AS start_date,
          DATE_FORMAT(fd.maturity_date, '%Y-%m-%d')    AS maturity_date,
          DATE_FORMAT(fd.next_payout_date, '%Y-%m-%d') AS next_payout_date,
          fd.status
       FROM fixed_deposit fd
       JOIN savings_account sa ON sa.account_id = fd.linked_account_id
       JOIN customer c ON c.customer_id = sa.primary_customer_id
       JOIN fixed_deposit_plan p ON p.fd_plan_id = fd.fd_plan_id
       WHERE fd.fd_id = ?
       ${customerFilter}`,
      accessParams
    );

    // 404 for both "does not exist" and "not yours", so ids cannot be probed
    if (fdRows.length === 0) {
      return NextResponse.json({ message: "Fixed deposit not found." }, { status: 404 });
    }

    const [payments] = await pool.execute<RowDataPacket[]>(
      `SELECT
          idist.cycle_number,
          DATE_FORMAT(idist.cycle_start_date, '%Y-%m-%d') AS cycle_start_date,
          DATE_FORMAT(idist.cycle_end_date, '%Y-%m-%d')   AS cycle_end_date,
          idist.interest_amount,
          t.transaction_ref
       FROM interest_distribution idist
       JOIN account_transaction t ON t.transaction_id = idist.transaction_id
       WHERE idist.fd_id = ?
       ORDER BY idist.cycle_number`,
      [fdId]
    );

    return NextResponse.json({ fixedDeposit: fdRows[0], interestPayments: payments });
  } catch (error) {
    console.error("Fixed deposit details failed:", error);
    return NextResponse.json(
      { message: "Unable to load fixed deposit details." },
      { status: 500 }
    );
  }
}