import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  const session = requireRole(request, ["ADMIN", "AGENT"]);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const pool = getDbPool();

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
          a.agent_id,
          a.agent_code,
          CONCAT(a.first_name, ' ', a.last_name) AS agent_name,
          b.branch_name,

          COUNT(at.transaction_id) AS transaction_count,

          COALESCE(SUM(at.amount), 0.00) AS total_transaction_value,

          COALESCE(SUM(
            CASE
              WHEN at.transaction_type = 'DEPOSIT' THEN at.amount
              ELSE 0
            END
          ), 0.00) AS total_deposits,

          COALESCE(SUM(
            CASE
              WHEN at.transaction_type = 'WITHDRAWAL' THEN at.amount
              ELSE 0
            END
          ), 0.00) AS total_withdrawals

       FROM agent a
       JOIN branch b
         ON b.branch_id = a.branch_id
       LEFT JOIN account_transaction at
         ON at.agent_id = a.agent_id
       WHERE a.status = 'ACTIVE'
       GROUP BY
         a.agent_id,
         a.agent_code,
         a.first_name,
         a.last_name,
         b.branch_name
       ORDER BY total_transaction_value DESC, agent_name`
    );

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Agent transaction report failed:", error);

    return NextResponse.json(
      { message: "Unable to load the agent-wise transactions report." },
      { status: 500 }
    );
  }
}