import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  const session = requireRole(request, ["ADMIN", "AGENT", "CUSTOMER"]);
  if (!session) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  try {
    let filter = ""; let values: number[] = [];
    if (session.role === "AGENT") { filter = "WHERE t.agent_id = (SELECT agent_id FROM agent WHERE user_id = ? LIMIT 1)"; values = [session.userId]; }
    if (session.role === "CUSTOMER") {
      filter = `WHERE EXISTS (SELECT 1 FROM customer c WHERE c.user_id = ? AND (c.customer_id = sa.primary_customer_id OR EXISTS (
        SELECT 1 FROM joint_account_holders jah WHERE jah.account_id = sa.account_id AND jah.customer_id = c.customer_id
      )))`; values = [session.userId];
    }
    const [rows] = await getDbPool().execute<RowDataPacket[]>(
      `SELECT t.transaction_id, t.transaction_ref, t.transaction_type, t.amount, t.balance_after, t.transaction_date,
              sa.account_number, CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
              CONCAT(a.first_name, ' ', a.last_name) AS agent_name
       FROM account_transaction t JOIN savings_account sa ON sa.account_id = t.account_id
       JOIN customer c ON c.customer_id = sa.primary_customer_id
       LEFT JOIN agent a ON a.agent_id = t.agent_id ${filter}
       ORDER BY t.transaction_date DESC, t.transaction_id DESC LIMIT 200`, values
    );
    return NextResponse.json(rows);
  } catch (error) { console.error("Transaction list failed:", error); return NextResponse.json({ message: "Unable to load transactions." }, { status: 500 }); }
}

