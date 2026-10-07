import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { requirePositiveAmount } from "@/lib/validation/common";
import { getDbPool } from "@/lib/db/mysql";

export async function POST(request: NextRequest) {
  const session = requireRole(request, ["ADMIN", "AGENT"]);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const accountIdentifier = String(
      body.accountIdentifier ?? body.accountId ?? ""
    ).trim();

    if (!accountIdentifier) {
      return NextResponse.json(
        { message: "Account number or account ID is required." },
        { status: 400 }
      );
    }

    requirePositiveAmount(body.amount);

    const amount = Number(body.amount);

    const pool = getDbPool();

    const [rows] = await pool.query(
      "CALL withdraw(?, ?, ?)",
      [
        accountIdentifier,
        amount,
        session.userId
      ]
    ) as any;

    const result = rows?.[0];

    return NextResponse.json(
      {
        message: "Withdrawal successful.",
        transactionRef: result?.transaction_ref,
        accountId: result?.account_id,
        balanceAfter: result?.balance_after
      },
      { status: 200 }
    );

  } catch (e) {
    return NextResponse.json(
      {
        message:
          e instanceof Error
            ? e.message
            : "Withdrawal failed."
      },
      { status: 400 }
    );
  }
}
