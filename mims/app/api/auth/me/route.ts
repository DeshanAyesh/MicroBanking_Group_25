import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/authorization";
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ session });
}
