import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";

export async function POST(request: NextRequest) {
  if (!requireRole(request, ["ADMIN"])) return NextResponse.json({message:"Unauthorized."},{status:401});
  
  try {
    const pool = getDbPool();
    await pool.query("CALL process_monthly_interest()");
    return NextResponse.json({message: "Interest processed successfully."});
  } catch (error) {
    console.error("Interest processing error:", error);
    return NextResponse.json({message: "Failed to process interest."}, {status: 500});
  }
}
