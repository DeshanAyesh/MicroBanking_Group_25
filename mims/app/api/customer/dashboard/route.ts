import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  const session = requireRole(request, ["CUSTOMER"]);
  if (!session) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  try {
    const [[row]] = await getDbPool().execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT sa.account_id) AS account_count, COALESCE(SUM(sa.current_balance), 0) AS total_balance,
              COUNT(DISTINCT fd.fd_id) AS active_fd_count
       FROM customer c
       LEFT JOIN savings_account sa ON sa.primary_customer_id = c.customer_id OR EXISTS (
         SELECT 1 FROM joint_account_holders jah WHERE jah.account_id = sa.account_id AND jah.customer_id = c.customer_id
       )
       LEFT JOIN fixed_deposit fd ON fd.linked_account_id = sa.account_id AND fd.status = 'ACTIVE'
       WHERE c.user_id = ?`, [session.userId]
    );
    return NextResponse.json(row);
  } catch (error) { console.error("Customer dashboard failed:", error); return NextResponse.json({ message: "Unable to load customer dashboard." }, { status: 500 }); }
}

