import { NextResponse } from "next/server";
import { signSession } from "@/lib/auth/jwt";
import { requireNonEmpty } from "@/lib/validation/common";
import { getDbPool } from "@/lib/db/mysql";
import { verifyPassword } from "@/lib/auth/password";
import { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = requireNonEmpty(body.identifier, "Username/email");
    const password = requireNonEmpty(body.password, "Password");

    const pool = getDbPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.user_id, u.password_hash, r.role_name, u.status 
       FROM user_account u
       JOIN role r ON u.role_id = r.role_id
       WHERE u.username = ?`,
      [identifier]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
    }

    const user = rows[0];

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ message: "Account is not active." }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
    }

    const token = signSession({
      userId: Number(user.user_id),
      role: user.role_name as "ADMIN" | "AGENT" | "CUSTOMER"
    });

    const response = NextResponse.json({ message: "Login successful.", role: user.role_name });
    const secureCookie = process.env.SESSION_COOKIE_SECURE
      ? process.env.SESSION_COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production";

    response.cookies.set("mims_session", token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      path: "/"
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
}
