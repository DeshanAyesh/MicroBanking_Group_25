import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
export async function GET(request: NextRequest) {
  if (!requireRole(request, ["ADMIN","AGENT","CUSTOMER"])) return NextResponse.json({message:"Unauthorized."},{status:401});
  return NextResponse.json({message:"BLOCKED — SQL TODO required: account-wise summary report query."},{status:501});
}
