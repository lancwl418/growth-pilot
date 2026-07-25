import { prisma } from "@/lib/prisma";
import { marketingOrderFilter, ga4DateFilter } from "./common";
import type { FunnelData } from "@/types/dashboard";

/**
 * Marketing funnel for the selected range: Sessions -> First Orders -> Repeat.
 * - sessions: sum of GA4 sessions (null when no GA4 data, so the page can
 *   gracefully degrade to the last two stages).
 * - firstOrders: non-internal new customers whose first order is in range.
 * - repeatInPeriod: customers who placed a non-first order within the range.
 */
export async function getFunnel(startDate: string, endDate: string): Promise<FunnelData> {
  const rangeStart = new Date(`${startDate}T00:00:00.000Z`);
  const rangeEnd = new Date(`${endDate}T23:59:59.999Z`);

  // Sessions (GA4). null when there is no GA4 data at all for the range.
  const ga4Count = await prisma.factGa4Daily.count({ where: ga4DateFilter(startDate, endDate) });
  let sessions: number | null = null;
  if (ga4Count > 0) {
    const agg = await prisma.factGa4Daily.aggregate({
      where: ga4DateFilter(startDate, endDate),
      _sum: { sessions: true },
    });
    sessions = agg._sum.sessions ?? 0;
  }

  // First orders = non-internal new customers in range.
  const firstOrders = await prisma.dimCustomer.count({
    where: { isInternal: false, firstOrderAt: { gte: rangeStart, lte: rangeEnd } },
  });

  // Repeat in period = customers with an in-range order that is not their first.
  const ordersInRange = await prisma.factOrder.findMany({
    where: { ...marketingOrderFilter(startDate, endDate), customerId: { not: null } },
    select: { customerId: true, orderDate: true },
  });

  let repeatInPeriod = 0;
  const involvedIds = [...new Set(ordersInRange.map((o) => o.customerId!))];
  if (involvedIds.length > 0) {
    const customers = await prisma.dimCustomer.findMany({
      where: { id: { in: involvedIds } },
      select: { id: true, firstOrderAt: true },
    });
    const firstOrderAtById = new Map(customers.map((c) => [c.id, c.firstOrderAt]));

    const repeatCustomerIds = new Set<string>();
    for (const o of ordersInRange) {
      const firstAt = firstOrderAtById.get(o.customerId!);
      if (firstAt && o.orderDate > firstAt) {
        repeatCustomerIds.add(o.customerId!);
      }
    }
    repeatInPeriod = repeatCustomerIds.size;
  }

  const visitToOrder =
    sessions !== null && sessions > 0 ? (firstOrders / sessions) * 100 : sessions !== null ? 0 : null;
  const orderToRepeat = firstOrders > 0 ? (repeatInPeriod / firstOrders) * 100 : 0;

  return { sessions, firstOrders, repeatInPeriod, visitToOrder, orderToRepeat };
}
