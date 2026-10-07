import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  if (!requireRole(request, ["ADMIN", "AGENT"])) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  try {
    const pool = getDbPool();
    const [branches] = await pool.execute<RowDataPacket[]>("SELECT branch_id, branch_code, branch_name FROM branch ORDER BY branch_name");
    const [agents] = await pool.execute<RowDataPacket[]>("SELECT agent_id, branch_id, agent_code, first_name, last_name FROM agent WHERE status = 'ACTIVE' ORDER BY first_name, last_name");
    return NextResponse.json({ branches, agents });
  } catch (error) {
    console.error("Customer form options failed:", error);
    return NextResponse.json({ message: "Unable to load customer form options." }, { status: 500 });
  }
}
