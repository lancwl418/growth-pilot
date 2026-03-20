import { prisma } from "@/lib/prisma";
import { paidOrderFilter, ga4DateFilter } from "./common";
import type { ShopifySummary } from "@/types/dashboard";

export async function getShopifySummary(
  startDate: string,
  endDate: string
): Promise<ShopifySummary> {
  const dateGte = new Date(`${startDate}T00:00:00.000Z`);
  const dateLte = new Date(`${endDate}T23:59:59.999Z`);

  // All paid orders in date range
  const allOrders = await prisma.factOrder.aggregate({
    where: paidOrderFilter(startDate, endDate),
    _sum: { totalPrice: true },
    _count: true,
  });

  const totalSales = Number(allOrders._sum.totalPrice || 0);
  const numberOfSales = allOrders._count;
  const avgOrderSpend = numberOfSales > 0 ? totalSales / numberOfSales : 0;

  // Get customer IDs who have purchased 1-2 times (lifetime)
  const lowFreqCustomers = await prisma.dimCustomer.findMany({
    where: { ordersCount: { gte: 1, lte: 2 } },
    select: { id: true },
  });

  const lowFreqIds = lowFreqCustomers.map((c) => c.id);

  // Orders from 1-2 time buyers within the date range
  const lowFreqOrders = await prisma.factOrder.aggregate({
    where: {
      ...paidOrderFilter(startDate, endDate),
      customerId: { in: lowFreqIds },
    },
    _sum: { totalPrice: true },
    _count: true,
  });

  const lowFreqSales = Number(lowFreqOrders._sum.totalPrice || 0);
  const lowFreqCount = lowFreqOrders._count;
  const lowFreqAvgOrderSpend = lowFreqCount > 0 ? lowFreqSales / lowFreqCount : 0;

  // Total ad spend: Google (from GA4) + Meta Ads
  const googleSpend = await prisma.factGa4Daily.aggregate({
    where: {
      ...ga4DateFilter(startDate, endDate),
      adCost: { gt: 0 },
    },
    _sum: { adCost: true },
  });

  const metaSpend = await prisma.factMetaAdsDaily.aggregate({
    where: { date: { gte: dateGte, lte: dateLte } },
    _sum: { spend: true },
  });

  const totalAdSpend =
    Number(googleSpend._sum.adCost || 0) + Number(metaSpend._sum.spend || 0);

  const lowFreqRoas = totalAdSpend > 0 ? lowFreqSales / totalAdSpend : 0;

  return {
    totalSales,
    numberOfSales,
    avgOrderSpend,
    lowFreqSales,
    lowFreqCount,
    lowFreqAvgOrderSpend,
    totalAdSpend,
    lowFreqRoas,
  };
}
