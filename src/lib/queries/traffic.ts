import { prisma } from "@/lib/prisma";
import { ga4DateFilter } from "./common";
import { format, eachDayOfInterval } from "date-fns";
import type { TrafficMetrics } from "@/types/dashboard";

export async function getTrafficMetrics(
  startDate: string,
  endDate: string
): Promise<TrafficMetrics | null> {
  const count = await prisma.factGa4Daily.count();
  if (count === 0) return null;

  const where = ga4DateFilter(startDate, endDate);

  // Totals
  const totalsAgg = await prisma.factGa4Daily.aggregate({
    where,
    _sum: {
      sessions: true,
      users: true,
      newUsers: true,
      engagedSessions: true,
      purchaseEvents: true,
      purchaseRevenue: true,
      adCost: true,
    },
  });

  const totalSessions = totalsAgg._sum.sessions || 0;
  const totalEngaged = totalsAgg._sum.engagedSessions || 0;
  const totalPurchases = totalsAgg._sum.purchaseEvents || 0;
  const totalRevenue = Number(totalsAgg._sum.purchaseRevenue || 0);
  const totalAdSpend = Number(totalsAgg._sum.adCost || 0);

  // ROAS uses revenue attributed to Google paid channels only — dividing
  // sitewide revenue by Google-only ad cost would overstate it
  const paidAgg = await prisma.factGa4Daily.aggregate({
    where: { ...where, channelGroup: { in: ["Paid Search", "Cross-network"] } },
    _sum: { purchaseRevenue: true },
  });
  const paidRevenue = Number(paidAgg._sum.purchaseRevenue || 0);

  const totals = {
    sessions: totalSessions,
    users: totalsAgg._sum.users || 0,
    newUsers: totalsAgg._sum.newUsers || 0,
    engagementRate: totalSessions > 0 ? (totalEngaged / totalSessions) * 100 : 0,
    conversionRate: totalSessions > 0 ? (totalPurchases / totalSessions) * 100 : 0,
    revenue: totalRevenue,
    adSpend: totalAdSpend,
    roas: totalAdSpend > 0 ? paidRevenue / totalAdSpend : 0,
  };

  // Daily time series
  const days = eachDayOfInterval({
    start: new Date(`${startDate}T00:00:00.000Z`),
    end: new Date(`${endDate}T00:00:00.000Z`),
  });

  const dailyAgg = await prisma.factGa4Daily.groupBy({
    by: ["date"],
    where,
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

  // Channel mix (for donut chart)
  const channelAgg = await prisma.factGa4Daily.groupBy({
    by: ["channelGroup"],
    where,
    _sum: { sessions: true, users: true, engagedSessions: true, purchaseEvents: true, purchaseRevenue: true, adCost: true },
    orderBy: { _sum: { sessions: "desc" } },
  });

  const channelMix = channelAgg.map((c) => ({
    channel: c.channelGroup,
    sessions: c._sum.sessions || 0,
    percentage: totalSessions > 0 ? ((c._sum.sessions || 0) / totalSessions) * 100 : 0,
  }));

  // Channel performance (for table — boss wants to see which channels convert)
  const channelPerformance = channelAgg.map((c) => {
    const chSessions = c._sum.sessions || 0;
    const chEngaged = c._sum.engagedSessions || 0;
    const chPurchases = c._sum.purchaseEvents || 0;
    const chRevenue = Number(c._sum.purchaseRevenue || 0);
    const chAdSpend = Number(c._sum.adCost || 0);
    return {
      channel: c.channelGroup,
      sessions: chSessions,
      users: c._sum.users || 0,
      engagementRate: chSessions > 0 ? (chEngaged / chSessions) * 100 : 0,
      conversionRate: chSessions > 0 ? (chPurchases / chSessions) * 100 : 0,
      revenue: chRevenue,
      adSpend: chAdSpend,
      roas: chAdSpend > 0 ? chRevenue / chAdSpend : 0,
    };
  });

  // Top sources
  const sourceAgg = await prisma.factGa4Daily.groupBy({
    by: ["sourceMedium"],
    where: { ...where, sourceMedium: { not: null } },
    _sum: { sessions: true, users: true },
    orderBy: { _sum: { sessions: "desc" } },
    take: 20,
  });

  const topSources = sourceAgg.map((s) => ({
    source: s.sourceMedium || "Unknown",
    sessions: s._sum.sessions || 0,
    users: s._sum.users || 0,
  }));

  return { totals, timeSeries, channelMix, channelPerformance, topSources };
}
