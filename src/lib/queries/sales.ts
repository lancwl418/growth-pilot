import { prisma } from "@/lib/prisma";
import { paidOrderFilter } from "./common";
import { format, eachDayOfInterval } from "date-fns";
import type { SalesMetrics } from "@/types/dashboard";

export async function getSalesMetrics(
  startDate: string,
  endDate: string
): Promise<SalesMetrics> {
  // Totals via aggregate (accurate, not affected by DateTime grouping)
  const orderAgg = await prisma.factOrder.aggregate({
    where: paidOrderFilter(startDate, endDate),
    _sum: { totalPrice: true },
    _count: true,
  });

  const totalRevenue = Number(orderAgg._sum.totalPrice || 0);
  const totalOrders = orderAgg._count;

  // Daily time series
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

  // Accumulate into daily buckets (orderDate is DateTime, multiple per day)
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

  const timeSeries = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return {
      date: format(d, "MMM dd"),
      revenue: dailyMap.get(key)?.revenue || 0,
      orders: dailyMap.get(key)?.orders || 0,
    };
  });

  // Channel breakdown using referringSite
  const channelOrders = await prisma.factOrder.groupBy({
    by: ["sourceName"],
    where: paidOrderFilter(startDate, endDate),
    _sum: { totalPrice: true },
    _count: true,
    orderBy: { _sum: { totalPrice: "desc" } },
  });

  const channelBreakdown = channelOrders.map((c) => ({
    channel: c.sourceName || "Unknown",
    revenue: Number(c._sum.totalPrice || 0),
    orders: c._count,
  }));

  // Refund summary
  const refundAgg = await prisma.factOrder.aggregate({
    where: {
      orderDate: {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      },
      financialStatus: { in: ["refunded", "partially_refunded"] },
    },
    _sum: { totalRefund: true },
    _count: true,
  });

  const totalOrdersInPeriod = await prisma.factOrder.count({
    where: {
      orderDate: {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      },
    },
  });

  const refundSummary = {
    totalRefunds: Number(refundAgg._sum.totalRefund || 0),
    refundCount: refundAgg._count,
    refundRate:
      totalOrdersInPeriod > 0 ? (refundAgg._count / totalOrdersInPeriod) * 100 : 0,
  };

  return { totalRevenue, totalOrders, timeSeries, channelBreakdown, refundSummary };
}
