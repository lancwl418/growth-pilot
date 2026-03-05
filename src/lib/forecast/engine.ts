import { prisma } from "@/lib/prisma";
import { subDays, addDays, format, getDay } from "date-fns";
import { generatePredictions } from "./moving-average";

export async function generateForecasts(): Promise<number> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let total = 0;

  for (const metric of ["revenue", "orders"] as const) {
    const predictions = await forecastMetric(metric, today);
    total += predictions;
  }

  // Update actual values for past forecasts
  await updateActuals();

  return total;
}

async function forecastMetric(
  metric: "revenue" | "orders",
  today: Date
): Promise<number> {
  // Get last 28 days of data for moving average and DOW calculation
  const startDate = subDays(today, 28);

  const whereClause = {
    orderDate: { gte: startDate, lt: today },
    financialStatus: { in: ["paid", "partially_refunded"] as string[] },
    cancelledAt: null as Date | null,
  };

  const dailyRevenue = await prisma.factOrder.groupBy({
    by: ["orderDate"],
    where: whereClause,
    _sum: { totalPrice: true },
    _count: true,
  });

  // Build recent values array (last 28 days, chronological)
  const recentValues: number[] = [];
  const historicalByDow = new Map<number, number[]>();

  for (let i = 27; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayData = dailyRevenue.find(
      (d) => format(d.orderDate, "yyyy-MM-dd") === dateStr
    );

    const value =
      metric === "revenue"
        ? Number(dayData?._sum?.totalPrice || 0)
        : (dayData?._count || 0);

    recentValues.push(value);

    const dow = getDay(date);
    const existing = historicalByDow.get(dow) || [];
    existing.push(value);
    historicalByDow.set(dow, existing);
  }

  // Generate predictions for next 7 days
  const tomorrowDow = getDay(addDays(today, 1));
  const predictions = generatePredictions(
    recentValues,
    historicalByDow,
    tomorrowDow,
    7
  );

  // Store predictions
  for (let i = 0; i < predictions.length; i++) {
    const forecastDate = addDays(today, i + 1);
    const ma7 =
      recentValues.slice(-7).reduce((s, v) => s + v, 0) /
      Math.min(7, recentValues.length);

    await prisma.forecastDaily.upsert({
      where: {
        date_metric: {
          date: forecastDate,
          metric,
        },
      },
      create: {
        date: forecastDate,
        metric,
        predictedValue: predictions[i],
        movingAvg7d: ma7,
      },
      update: {
        predictedValue: predictions[i],
        movingAvg7d: ma7,
      },
    });
  }

  return predictions.length;
}

async function updateActuals(): Promise<void> {
  // Find forecasts without actual values for dates that have passed
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const pendingForecasts = await prisma.forecastDaily.findMany({
    where: {
      date: { lt: today },
      actualValue: null,
    },
  });

  for (const forecast of pendingForecasts) {
    const startOfDay = new Date(forecast.date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(forecast.date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    let actualValue: number;

    if (forecast.metric === "revenue") {
      const agg = await prisma.factOrder.aggregate({
        where: {
          orderDate: { gte: startOfDay, lte: endOfDay },
          financialStatus: { in: ["paid", "partially_refunded"] },
          cancelledAt: null,
        },
        _sum: { totalPrice: true },
      });
      actualValue = Number(agg._sum.totalPrice || 0);
    } else {
      actualValue = await prisma.factOrder.count({
        where: {
          orderDate: { gte: startOfDay, lte: endOfDay },
          financialStatus: { in: ["paid", "partially_refunded"] },
          cancelledAt: null,
        },
      });
    }

    const predicted = Number(forecast.predictedValue);
    const deviation =
      predicted > 0 ? ((actualValue - predicted) / predicted) * 100 : null;

    await prisma.forecastDaily.update({
      where: { id: forecast.id },
      data: {
        actualValue,
        deviationPct: deviation,
      },
    });
  }
}
