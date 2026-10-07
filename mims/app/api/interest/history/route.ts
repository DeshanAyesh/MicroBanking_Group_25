import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";

// GET /api/interest/history            -> interest credits (newest first, max 500)
// GET /api/interest/history?fd_id=6    -> credits for one FD
export async function GET(request: NextRequest) {
  const session = requireRole(request, ["ADMIN", "AGENT", "CUSTOMER"]);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const conditions: string[] = [];
  const params: number[] = [];

  const fdParam = request.nextUrl.searchParams.get("fd_id");
  if (fdParam !== null) {
    const fdId = Number(fdParam);
    if (!Number.isSafeInteger(fdId) || fdId <= 0) {
      return NextResponse.json(
        { message: "fd_id must be a positive whole number." },
        { status: 400 }
      );
    }
    conditions.push("idist.fd_id = ?");
    params.push(fdId);
  }

  // Customers only see credits on their own accounts (primary or joint holder)
  if (session.role === "CUSTOMER") {
    conditions.push(`EXISTS (
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
    )`);
    params.push(session.userId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [rows] = await getDbPool().execute<RowDataPacket[]>(
      `SELECT
          idist.distribution_id,
          fd.fd_id,
          fd.fd_number,
          sa.account_number,
          idist.cycle_number,
          DATE_FORMAT(idist.cycle_start_date, '%Y-%m-%d') AS cycle_start_date,
          DATE_FORMAT(idist.cycle_end_date, '%Y-%m-%d')   AS cycle_end_date,
          idist.interest_amount,
          t.transaction_ref,
          t.balance_after
       FROM interest_distribution idist
       JOIN fixed_deposit fd ON fd.fd_id = idist.fd_id
       JOIN savings_account sa ON sa.account_id = fd.linked_account_id
       JOIN account_transaction t ON t.transaction_id = idist.transaction_id
       ${where}
       ORDER BY idist.cycle_end_date DESC, idist.distribution_id DESC
       LIMIT 500`,
      params
    );

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Interest history failed:", error);
    return NextResponse.json(
      { message: "Unable to load interest history." },
      { status: 500 }
    );
  }
}