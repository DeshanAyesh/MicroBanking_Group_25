import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";

export async function GET(request: NextRequest) {

  if (!requireRole(request, ["ADMIN","AGENT"])) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {

    const pool = getDbPool();

    const [rows] = await pool.query(`
      SELECT 
          c.customer_id,
          CONCAT(c.first_name, ' ', c.last_name) AS customer_name,

          COALESCE(
            SUM(
              CASE 
                WHEN t.transaction_type = 'DEPOSIT'
                THEN t.amount
                ELSE 0
              END
            ),0
          ) AS total_deposits,

          COALESCE(
            SUM(
              CASE 
                WHEN t.transaction_type = 'WITHDRAWAL'
                THEN t.amount
                ELSE 0
              END
            ),0
          ) AS total_withdrawals,

          COALESCE(
            SUM(
              CASE 
                WHEN t.transaction_type = 'DEPOSIT'
                THEN t.amount
                ELSE 0
              END
            ),0
          )
          -
          COALESCE(
            SUM(
              CASE 
                WHEN t.transaction_type = 'WITHDRAWAL'
                THEN t.amount
                ELSE 0
              END
            ),0
          ) AS net_activity

      FROM customer c

      LEFT JOIN (
          SELECT 
              primary_customer_id AS customer_id,
              account_id
          FROM savings_account

          UNION

          SELECT
              customer_id,
              account_id
          FROM joint_account_holders

      ) AS customer_accounts

      ON c.customer_id = customer_accounts.customer_id

      LEFT JOIN account_transaction t
      ON customer_accounts.account_id = t.account_id

      GROUP BY 
          c.customer_id,
          c.first_name,
          c.last_name

      ORDER BY c.customer_id
    `);


    return NextResponse.json({
      results: rows
    });


  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        message:"Failed to load customer activity report."
      },
      {
        status:500
      }
    );

  }

}