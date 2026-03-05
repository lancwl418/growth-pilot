import { prisma } from "@/lib/prisma";
import { ga4DateFilter } from "./common";
import { format, eachDayOfInterval } from "date-fns";
import type { TrafficMetrics } from "@/types/dashboard";

export async function getTrafficMetrics(
  startDate: string,
  endDate: string
): Promise<TrafficMetrics | null> {
  // Check if we have any GA4 data
  const count = await prisma.factGa4Daily.count();
  if (count === 0) return null;

  // Daily time series
  const days = eachDayOfInterval({
    start: new Date(`${startDate}T00:00:00.000Z`),
    end: new Date(`${endDate}T00:00:00.000Z`),
  });

  const dailyAgg = await prisma.factGa4Daily.groupBy({
    by: ["date"],
    where: ga4DateFilter(startDate, endDate),
    _sum: { sessions: true, users: true },
  });

  const dailyMap = new Map(
    dailyAgg.map((d) => [
      format(d.date, "yyyy-MM-dd"),
      { sessions: d._sum.sessions || 0, users: d._sum.users || 0 },
    ])
  );

  const timeSeries = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return {
      date: format(d, "MMM dd"),
      sessions: dailyMap.get(key)?.sessions || 0,
      users: dailyMap.get(key)?.users || 0,
    };
  });

  // Channel mix
  const channelAgg = await prisma.factGa4Daily.groupBy({
    by: ["channelGroup"],
    where: ga4DateFilter(startDate, endDate),
    _sum: { sessions: true },
    orderBy: { _sum: { sessions: "desc" } },
  });

  const totalSessions = channelAgg.reduce((s, c) => s + (c._sum.sessions || 0), 0);

  const channelMix = channelAgg.map((c) => ({
    channel: c.channelGroup,
    sessions: c._sum.sessions || 0,
    percentage: totalSessions > 0 ? ((c._sum.sessions || 0) / totalSessions) * 100 : 0,
  }));

  // Top sources
  const sourceAgg = await prisma.factGa4Daily.groupBy({
    by: ["sourceMedium"],
    where: {
      ...ga4DateFilter(startDate, endDate),
      sourceMedium: { not: null },
    },
    _sum: { sessions: true, users: true },
    orderBy: { _sum: { sessions: "desc" } },
    take: 20,
  });

  const topSources = sourceAgg.map((s) => ({
    source: s.sourceMedium || "Unknown",
    sessions: s._sum.sessions || 0,
    users: s._sum.users || 0,
  }));

  return { timeSeries, channelMix, topSources };
}
