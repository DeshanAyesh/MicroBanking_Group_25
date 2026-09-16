import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
export async function GET(request: NextRequest, {params}:{params:Promise<{id:string}>}) {
  if (!requireRole(request, ["ADMIN","AGENT","CUSTOMER"])) return NextResponse.json({message:"Unauthorized."},{status:401});
  const {id}=await params;
  return NextResponse.json({message:"BLOCKED — SQL TODO required: fixed deposit details query.",fdId:id},{status:501});
}
