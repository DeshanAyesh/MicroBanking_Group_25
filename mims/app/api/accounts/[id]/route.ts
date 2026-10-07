import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = requireRole(request, ["ADMIN", "AGENT", "CUSTOMER"]);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const accountId = Number(id);

  if (!Number.isSafeInteger(accountId) || accountId <= 0) {
    return NextResponse.json(
      { message: "Account ID must be a positive whole number." },
      { status: 400 }
    );
  }

  try {
    const pool = getDbPool();

    let customerFilter = "";
    const parameters: number[] = [accountId];

    if (session.role === "CUSTOMER") {
      customerFilter = `
        AND EXISTS (
          SELECT 1
          FROM customer viewing_customer
          WHERE viewing_customer.user_id = ?
            AND (
              viewing_customer.customer_id = sa.primary_customer_id
              OR EXISTS (
                SELECT 1
                FROM joint_account_holders jah_access
                WHERE jah_access.account_id = sa.account_id
                  AND jah_access.customer_id = viewing_customer.customer_id
              )
            )
        )`;

      parameters.push(session.userId);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
          sa.account_id,
          sa.account_number,
          sa.acc_type,
          sa.current_balance,
          sa.status,
          sa.created_at,
          sp.plan_name,
          sp.interest_rate,
          sp.minimum_balance,
          CONCAT(primary_customer.first_name, ' ', primary_customer.last_name)
            AS primary_customer_name,
          CASE
            WHEN sa.acc_type = 'JOINT'
              THEN COALESCE(holders.holder_names, '')
            ELSE CONCAT(primary_customer.first_name, ' ', primary_customer.last_name)
          END AS holder_names,
          CASE
            WHEN sa.acc_type = 'JOINT'
              THEN COALESCE(holders.holder_count, 0)
            ELSE 1
          END AS holder_count
       FROM savings_account sa
       JOIN savings_plan sp
         ON sp.plan_id = sa.plan_id
       JOIN customer primary_customer
         ON primary_customer.customer_id = sa.primary_customer_id
       LEFT JOIN (
         SELECT
           jah.account_id,
           COUNT(*) AS holder_count,
           GROUP_CONCAT(
             CONCAT(c.first_name, ' ', c.last_name)
             ORDER BY c.first_name, c.last_name
             SEPARATOR ', '
           ) AS holder_names
         FROM joint_account_holders jah
         JOIN customer c
           ON c.customer_id = jah.customer_id
         GROUP BY jah.account_id
       ) holders
         ON holders.account_id = sa.account_id
       WHERE sa.account_id = ?
       ${customerFilter}`,
      parameters
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Account details failed:", error);

    return NextResponse.json(
      { message: "Unable to load account details." },
      { status: 500 }
    );
  }
}