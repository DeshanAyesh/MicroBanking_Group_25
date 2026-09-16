import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";

export async function GET(request: NextRequest) {
  if (!requireRole(request, ["ADMIN","AGENT"])) return NextResponse.json({message:"Unauthorized."},{status:401});
  return NextResponse.json({message:"BLOCKED — SQL TODO required: customer list/search/filter query."},{status:501});
}

export async function POST(request: NextRequest) {
  if (!requireRole(request, ["ADMIN","AGENT"])) return NextResponse.json({message:"Unauthorized."},{status:401});
  return NextResponse.json({message:"BLOCKED — SQL TODO required: create customer operation."},{status:501});
}
