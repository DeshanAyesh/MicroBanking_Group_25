import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
export async function POST(request: NextRequest) {
  if (!requireRole(request, ["ADMIN"])) return NextResponse.json({message:"Unauthorized."},{status:401});
  return NextResponse.json({message:"BLOCKED — SQL TODO required: monthly FD interest processing transaction."},{status:501});
}
