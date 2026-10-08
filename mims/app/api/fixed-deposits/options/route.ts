import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  if (!requireRole(request, ["ADMIN", "AGENT"])) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const pool = getDbPool();
    const [plans] = await pool.execute<RowDataPacket[]>(
      `SELECT fd_plan_id, plan_name, term_months, interest_rate
       FROM fixed_deposit_plan ORDER BY term_months`
    );
    const [accounts] = await pool.execute<RowDataPacket[]>(
      `SELECT sa.account_id, sa.account_number, sa.current_balance,
              sp.minimum_balance,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name
       FROM savings_account sa
       JOIN savings_plan sp ON sp.plan_id = sa.plan_id
       JOIN customer c ON c.customer_id = sa.primary_customer_id
       LEFT JOIN fixed_deposit fd ON fd.linked_account_id = sa.account_id
       WHERE sa.status = 'ACTIVE' AND fd.fd_id IS NULL
       ORDER BY sa.account_number`
    );
    return NextResponse.json({ plans, accounts });
  } catch (error) {
    console.error("Fixed deposit options failed:", error);
    return NextResponse.json(
      { message: "Unable to load fixed deposit options." },
      { status: 500 }
    );
  }
}
