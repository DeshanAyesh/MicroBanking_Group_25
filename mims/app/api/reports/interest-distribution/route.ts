import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/auth/authorization";
import { getDbPool } from "@/lib/db/mysql";

// GET /api/reports/interest-distribution            -> every month
// GET /api/reports/interest-distribution?month=2023-11 -> one month (YYYY-MM)
// Report 4 (SRS 4.7.3 #4): interest distributed, grouped by savings plan type.
// The month is the payout date (cycle_end_date), which is also the credit's date.
export async function GET(request: NextRequest) {
  // Aggregates the whole bank, so staff only
  const session = requireRole(request, ["ADMIN", "AGENT"]);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month");
  if (month !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json(
      { message: "Month must look like 2023-11 (YYYY-MM)." },
      { status: 400 }
    );
  }

  let monthFilter = "";
  const params: string[] = [];

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const start = `${month}-01`;
    const next =
      mon === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(mon + 1).padStart(2, "0")}-01`;

    monthFilter = "WHERE idist.cycle_end_date >= ? AND idist.cycle_end_date < ?";
    params.push(start, next);
  }

  try {
    const [rows] = await getDbPool().execute<RowDataPacket[]>(
      `SELECT
          DATE_FORMAT(idist.cycle_end_date, '%Y-%m') AS month,
          sp.plan_name AS account_type,
          COUNT(*) AS interest_credits,
          SUM(idist.interest_amount) AS total_interest
       FROM interest_distribution idist
       JOIN fixed_deposit fd ON fd.fd_id = idist.fd_id
       JOIN savings_account sa ON sa.account_id = fd.linked_account_id
       JOIN savings_plan sp ON sp.plan_id = sa.plan_id
       ${monthFilter}
       GROUP BY DATE_FORMAT(idist.cycle_end_date, '%Y-%m'), sp.plan_id, sp.plan_name
       ORDER BY month, sp.plan_id`,
      params
    );

    return NextResponse.json({ month: month ?? "all", rows });
  } catch (error) {
    console.error("Interest distribution report failed:", error);
    return NextResponse.json(
      { message: "Unable to load the interest distribution report." },
      { status: 500 }
    );
  }
}