import { NextResponse } from "next/server";
import { signSession } from "@/lib/auth/jwt";
import { requireNonEmpty } from "@/lib/validation/common";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = requireNonEmpty(body.identifier, "Username/email");
    requireNonEmpty(body.password, "Password");

    /*
      SQL TODO:
      Tables: users, roles (and any employee/customer relationship tables).
      Purpose: find the active user by username/email and retrieve the password hash and role.
      Conditions: active account; unique identifier.
      Expected result: one user record containing id, password_hash and role.
      Transaction: no.
    */
    console.log("LOGIN SQL TODO", identifier);

    return NextResponse.json({
      message: "BLOCKED — SQL TODO required: user lookup/authentication query is not implemented."
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
}
