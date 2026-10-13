import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  const session = requireRole(request, ["AGENT"]);
  if (!session) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  try {
    const [[row]] = await getDbPool().execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT c.customer_id) AS assigned_customers,
              COALESCE(SUM(CASE WHEN t.transaction_type = 'DEPOSIT' AND DATE(t.transaction_date) = CURRENT_DATE THEN t.amount ELSE 0 END), 0) AS today_deposits,
              COALESCE(SUM(CASE WHEN t.transaction_type = 'WITHDRAWAL' AND DATE(t.transaction_date) = CURRENT_DATE THEN t.amount ELSE 0 END), 0) AS today_withdrawals
       FROM agent a LEFT JOIN customer c ON c.agent_id = a.agent_id
       LEFT JOIN account_transaction t ON t.agent_id = a.agent_id
       WHERE a.user_id = ?`, [session.userId]
    );
    return NextResponse.json(row);
  } catch (error) { console.error("Agent dashboard failed:", error); return NextResponse.json({ message: "Unable to load agent dashboard." }, { status: 500 }); }
}
