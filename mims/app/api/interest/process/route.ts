import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export async function POST(request: NextRequest) {
  if (!requireRole(request, ["ADMIN"])) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.query(
      "CALL ProcessMonthlyInterest(NULL, @credits_created, @total_interest)"
    );

    const [summary] = await connection.query<RowDataPacket[]>(
      `SELECT
         @credits_created AS credits_created,
         @total_interest AS total_interest`
    );

    return NextResponse.json({
      message: "Interest processed successfully.",
      creditsCreated: Number(summary[0]?.credits_created ?? 0),
      totalInterest: Number(summary[0]?.total_interest ?? 0),
    });
  } catch (error) {
    console.error("Interest processing error:", error);

    return NextResponse.json(
      { message: "Failed to process interest." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}