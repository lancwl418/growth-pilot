import { prisma } from "@/lib/prisma";
import type { CacTrendPoint } from "@/types/dashboard";

/**
 * Monthly customer acquisition cost: CAC = ad spend / new customers.
 * Ad spend = GA4 adCost + Meta Ads spend (Meta currently has no data, so it
 * contributes 0 — this must not error).
 * New customers = dim_customers whose firstOrderAt falls in the month and that
 * are not internal/test accounts.
 */
export async function getCacTrend(months = 6): Promise<CacTrendPoint[]> {
  const now = new Date();

  const buckets = Array.from({ length: months }, (_, idx) => {
    const i = months - 1 - idx;
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    const month = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
    return { month, start, end };
  });

  const points = await Promise.all(
    buckets.map(async ({ month, start, end }) => {
      const [ga4, meta, newCustomers] = await Promise.all([
        prisma.factGa4Daily.aggregate({
          where: { date: { gte: start, lt: end } },
          _sum: { adCost: true },
        }),
        prisma.factMetaAdsDaily.aggregate({
          where: { date: { gte: start, lt: end } },
          _sum: { spend: true },
        }),
        prisma.dimCustomer.count({
          where: { isInternal: false, firstOrderAt: { gte: start, lt: end } },
        }),
      ]);

      const adSpend = Number(ga4._sum.adCost ?? 0) + Number(meta._sum.spend ?? 0);
      const cac = newCustomers > 0 ? adSpend / newCustomers : 0;

      return { month, adSpend, newCustomers, cac };
    })
  );

  return points;
}
