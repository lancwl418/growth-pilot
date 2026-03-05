import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { subDays, addDays, format } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const metric = request.nextUrl.searchParams.get("metric") || "revenue";

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Get forecasts: past 14 days (for actuals) + next 7 days (predictions)
  const forecasts = await prisma.forecastDaily.findMany({
    where: {
      metric,
      date: {
        gte: subDays(today, 14),
        lte: addDays(today, 7),
      },
    },
    orderBy: { date: "asc" },
  });

  const data = forecasts.map((f) => ({
    date: format(f.date, "MMM dd"),
    predicted: Number(f.predictedValue),
    actual: f.actualValue !== null ? Number(f.actualValue) : null,
    deviation: f.deviationPct !== null ? Number(f.deviationPct) : null,
    isFuture: f.date >= today,
  }));

  // Find deviation alerts (actual deviated more than 20% from prediction)
  const deviationAlerts = data.filter(
    (d) => d.deviation !== null && Math.abs(d.deviation) > 20
  );

  return jsonResponse({ forecasts: data, deviationAlerts, metric });
}
