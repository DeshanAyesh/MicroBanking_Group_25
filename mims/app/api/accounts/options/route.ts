import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
export async function GET(request: NextRequest) {
  const session = requireRole(request, ["AGENT"]);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const pool = getDbPool();

    const [plans] = await pool.execute(
      `SELECT
          plan_id,
          plan_name,
          interest_rate,
          minimum_balance,
          minimum_age,
          maximum_age
       FROM savings_plan
       ORDER BY plan_id`
    );

    const [customers] = await pool.execute(
      `SELECT
          customer_id,
          nic,
          first_name,
          last_name,
          date_of_birth
       FROM customer
       WHERE status = 'ACTIVE'
       ORDER BY first_name, last_name, customer_id`
    );

    return NextResponse.json({ plans, customers });
  } catch (error) {
    console.error("Account form options failed:", error);

    return NextResponse.json(
      { message: "Unable to load account form details." },
      { status: 500 }
    );
  }
}