import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getAnalyticsReport } from "@/lib/reports/analytics";

const millisecondsPerDay = 86_400_000;

function isValidDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

function getDefaultPeriod() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const defaultStart = new Date(`${today}T00:00:00Z`);
  defaultStart.setUTCDate(1);
  defaultStart.setUTCMonth(defaultStart.getUTCMonth() - 5);

  return {
    today,
    start: defaultStart.toISOString().slice(0, 10),
  };
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const session = requireRole(request, ["ADMIN", "AGENT"]);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const defaultPeriod = getDefaultPeriod();
  const start = request.nextUrl.searchParams.get("start") ?? defaultPeriod.start;
  const end = request.nextUrl.searchParams.get("end") ?? defaultPeriod.today;

  if (
    !isValidDate(start) ||
    !isValidDate(end) ||
    start > end ||
    end > defaultPeriod.today ||
    Date.parse(end) - Date.parse(start) > 366 * millisecondsPerDay
  ) {
    return NextResponse.json(
      {
        message:
          "Choose valid dates up to today, in order, within a 366-day period.",
      },
      { status: 400 }
    );
  }

  try {
    const report = await getAnalyticsReport(start, end);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Analytics report failed", {
      requestId,
      durationMs: Date.now() - startedAt,
      error,
    });

    return NextResponse.json(
      {
        message: "Unable to load banking analytics.",
        requestId,
      },
      { status: 500 }
    );
  }
}
