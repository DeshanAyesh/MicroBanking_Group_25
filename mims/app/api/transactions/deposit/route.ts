import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { requirePositiveAmount } from "@/lib/validation/common";
export async function POST(request: NextRequest) {
  if (!requireRole(request, ["ADMIN","AGENT"])) return NextResponse.json({message:"Unauthorized."},{status:401});
  try {
    const body=await request.json(); requirePositiveAmount(body.amount);
    return NextResponse.json({message:"BLOCKED — SQL TODO required: atomic deposit transaction."},{status:501});
  } catch(e) { return NextResponse.json({message:e instanceof Error?e.message:"Invalid input."},{status:400}); }
}
