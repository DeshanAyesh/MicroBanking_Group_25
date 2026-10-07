import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";

// GET /api/reports/active-fds
// Report 3 (SRS 4.7.3 #3): active FDs with customer, principal, rate, term, next payout.
export async function GET(request: NextRequest) {
  const session = requireRole(request, ["ADMIN", "AGENT", "CUSTOMER"]);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const params: number[] = [];
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
      params.push(session.userId);
    }

    const [rows] = await getDbPool().execute<RowDataPacket[]>(
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
          DATE_FORMAT(fd.start_date, '%Y-%m-%d')       AS start_date,
          DATE_FORMAT(fd.maturity_date, '%Y-%m-%d')    AS maturity_date,
          DATE_FORMAT(fd.next_payout_date, '%Y-%m-%d') AS next_payout_date
       FROM fixed_deposit fd
       JOIN savings_account sa ON sa.account_id = fd.linked_account_id
       JOIN customer c ON c.customer_id = sa.primary_customer_id
       JOIN fixed_deposit_plan p ON p.fd_plan_id = fd.fd_plan_id
       WHERE fd.status = 'ACTIVE'
       ${customerFilter}
       ORDER BY fd.next_payout_date, fd.fd_id`,
      params
    );

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Active FD report failed:", error);
    return NextResponse.json(
      { message: "Unable to load the active fixed deposit report." },
      { status: 500 }
    );
  }
}