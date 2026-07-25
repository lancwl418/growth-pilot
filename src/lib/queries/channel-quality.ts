import { prisma } from "@/lib/prisma";
import { marketingOrderFilter } from "./common";
import type { ChannelQuality, ChannelQualityRow } from "@/types/dashboard";

/**
 * Derive the acquisition channel from a customer's first order.
 * Priority: utm_source (/ utm_medium) parsed from the landing site URL,
 * then the Shopify sourceName, then "(direct)".
 */
function parseChannel(landingSite: string | null, sourceName: string | null): string {
  if (landingSite) {
    const qIndex = landingSite.indexOf("?");
    if (qIndex >= 0) {
      const params = new URLSearchParams(landingSite.slice(qIndex + 1));
      const utmSource = params.get("utm_source");
      if (utmSource) {
        const utmMedium = params.get("utm_medium");
        return utmMedium ? `${utmSource} / ${utmMedium}` : utmSource;
      }
    }
  }
  if (sourceName && sourceName.trim()) return sourceName.trim();
  return "(direct)";
}

export async function getChannelQuality(
  startDate: string,
  endDate: string
): Promise<ChannelQuality> {
  const rangeStart = new Date(`${startDate}T00:00:00.000Z`);
  const rangeEnd = new Date(`${endDate}T23:59:59.999Z`);

  // 1. Orders in range (paid, non-internal) -> distinct customer ids.
  const ordersInRange = await prisma.factOrder.findMany({
    where: marketingOrderFilter(startDate, endDate),
    select: { customerId: true },
  });

  const customerIds = [
    ...new Set(ordersInRange.filter((o) => o.customerId).map((o) => o.customerId!)),
  ];

  const empty: ChannelQuality = {
    channels: [],
    totals: { newCustomers: 0, repeatRate: 0, avgLtv: 0, bestChannel: null },
  };

  if (customerIds.length === 0) return empty;

  // 2. Pull lifetime stats for those customers; keep only NEW customers
  //    (first order within the selected range) and non-internal.
  const customers = await prisma.dimCustomer.findMany({
    where: {
      id: { in: customerIds },
      isInternal: false,
      firstOrderAt: { gte: rangeStart, lte: rangeEnd },
    },
    select: { id: true, ordersCount: true, totalSpent: true },
  });

  if (customers.length === 0) return empty;

  const newCustomerIds = customers.map((c) => c.id);

  // 3. Each new customer's first order (earliest) -> landingSite + sourceName.
  const firstOrders = await prisma.factOrder.findMany({
    where: { customerId: { in: newCustomerIds } },
    orderBy: { orderDate: "asc" },
    select: { customerId: true, landingSite: true, sourceName: true },
  });

  const firstOrderByCustomer = new Map<string, { landingSite: string | null; sourceName: string | null }>();
  for (const o of firstOrders) {
    if (!o.customerId) continue;
    if (!firstOrderByCustomer.has(o.customerId)) {
      firstOrderByCustomer.set(o.customerId, {
        landingSite: o.landingSite,
        sourceName: o.sourceName,
      });
    }
  }

  // 4. Aggregate per channel.
  interface Acc {
    newCustomers: number;
    repeatCustomers: number;
    totalLtv: number;
  }
  const byChannel = new Map<string, Acc>();

  for (const c of customers) {
    const first = firstOrderByCustomer.get(c.id);
    const channel = parseChannel(first?.landingSite ?? null, first?.sourceName ?? null);
    const acc = byChannel.get(channel) ?? { newCustomers: 0, repeatCustomers: 0, totalLtv: 0 };
    acc.newCustomers += 1;
    if (c.ordersCount >= 2) acc.repeatCustomers += 1;
    acc.totalLtv += Number(c.totalSpent);
    byChannel.set(channel, acc);
  }

  const channels: ChannelQualityRow[] = [...byChannel.entries()]
    .map(([channel, acc]) => ({
      channel,
      newCustomers: acc.newCustomers,
      repeatCustomers: acc.repeatCustomers,
      repeatRate: acc.newCustomers > 0 ? (acc.repeatCustomers / acc.newCustomers) * 100 : 0,
      avgLtv: acc.newCustomers > 0 ? acc.totalLtv / acc.newCustomers : 0,
      totalLtv: acc.totalLtv,
    }))
    .sort((a, b) => b.totalLtv - a.totalLtv);

  const totalNew = channels.reduce((s, c) => s + c.newCustomers, 0);
  const totalRepeat = channels.reduce((s, c) => s + c.repeatCustomers, 0);
  const totalLtv = channels.reduce((s, c) => s + c.totalLtv, 0);

  return {
    channels,
    totals: {
      newCustomers: totalNew,
      repeatRate: totalNew > 0 ? (totalRepeat / totalNew) * 100 : 0,
      avgLtv: totalNew > 0 ? totalLtv / totalNew : 0,
      bestChannel: channels.length > 0 ? channels[0].channel : null,
    },
  };
}
