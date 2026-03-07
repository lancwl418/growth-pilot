import { prisma } from "@/lib/prisma";
import { paidOrderFilter, ga4DateFilter } from "./common";
import { calcPercentChange } from "@/lib/utils/percentage";
import { format, eachDayOfInterval } from "date-fns";
import type { OverviewMetrics } from "@/types/dashboard";

export async function getOverviewMetrics(
  startDate: string,
  endDate: string,
  compareStart?: string,
  compareEnd?: string
): Promise<OverviewMetrics> {
  // Current period
  const orderAgg = await prisma.factOrder.aggregate({
    where: paidOrderFilter(startDate, endDate),
    _sum: { totalPrice: true },
    _count: true,
  });

  const revenue = Number(orderAgg._sum.totalPrice || 0);
  const orders = orderAgg._count;
  const aov = orders > 0 ? revenue / orders : 0;

  // Sessions from GA4
  const sessionsAgg = await prisma.factGa4Daily.aggregate({
    where: ga4DateFilter(startDate, endDate),
    _sum: { sessions: true },
  });
  const sessions = sessionsAgg._sum.sessions;
  const cr = sessions && sessions > 0 ? (orders / sessions) * 100 : null;

  // Comparison period
  let comparison: OverviewMetrics["comparison"] = {
    revenue: null,
    orders: null,
    aov: null,
    sessions: null,
    cr: null,
  };

  if (compareStart && compareEnd) {
    const compOrderAgg = await prisma.factOrder.aggregate({
      where: paidOrderFilter(compareStart, compareEnd),
      _sum: { totalPrice: true },
      _count: true,
    });

    const compRevenue = Number(compOrderAgg._sum.totalPrice || 0);
    const compOrders = compOrderAgg._count;
    const compAov = compOrders > 0 ? compRevenue / compOrders : 0;

    const compSessionsAgg = await prisma.factGa4Daily.aggregate({
      where: ga4DateFilter(compareStart, compareEnd),
      _sum: { sessions: true },
    });
    const compSessions = compSessionsAgg._sum.sessions;
    const compCr =
      compSessions && compSessions > 0 ? (compOrders / compSessions) * 100 : null;

    comparison = {
      revenue: calcPercentChange(revenue, compRevenue),
      orders: calcPercentChange(orders, compOrders),
      aov: calcPercentChange(aov, compAov),
      sessions:
        sessions !== null && compSessions !== null
          ? calcPercentChange(sessions, compSessions)
          : null,
      cr: cr !== null && compCr !== null ? calcPercentChange(cr, compCr) : null,
    };
  }

  // Sparklines: daily revenue and orders for the period
  const days = eachDayOfInterval({
    start: new Date(`${startDate}T00:00:00.000Z`),
    end: new Date(`${endDate}T00:00:00.000Z`),
  });

  const dailyOrders = await prisma.factOrder.groupBy({
    by: ["orderDate"],
    where: paidOrderFilter(startDate, endDate),
    _sum: { totalPrice: true },
    _count: true,
  });

  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (const d of dailyOrders) {
    const key = format(d.orderDate, "yyyy-MM-dd");
    const existing = dailyMap.get(key);
    const revenue = Number(d._sum.totalPrice || 0);
    if (existing) {
      existing.revenue += revenue;
      existing.orders += d._count;
    } else {
      dailyMap.set(key, { revenue, orders: d._count });
    }
  }

  const revenueSparkline = days.map(
    (d) => dailyMap.get(format(d, "yyyy-MM-dd"))?.revenue || 0
  );
  const ordersSparkline = days.map(
    (d) => dailyMap.get(format(d, "yyyy-MM-dd"))?.orders || 0
  );

  return {
    revenue,
    orders,
    aov,
    sessions,
    cr,
    comparison,
    sparklines: {
      revenue: revenueSparkline,
      orders: ordersSparkline,
    },
  };
}
