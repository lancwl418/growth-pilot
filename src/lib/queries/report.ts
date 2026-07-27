import { prisma } from "@/lib/prisma";
import { paidOrderFilter, dateFilter, ga4DateFilter } from "./common";
import { getCategoryRevenue } from "./product-category";
import { format, eachDayOfInterval } from "date-fns";
import type {
  AdBlock,
  Kpi,
  MetaFbBlock,
  MetaIgBlock,
  OrderNumberBucket,
  OrderValueBucket,
  ReportData,
  ReportTrendPoint,
  ShopifyLifetimeBlock,
  ShopifyPeriodBlock,
} from "@/types/report";

const GOOGLE_CHANNEL_GROUPS = ["Paid Search", "Cross-network"];

function kpi(value: number, prev: number | null): Kpi {
  const change =
    prev === null || prev === 0 ? null : ((value - prev) / prev) * 100;
  return { value, prev, change };
}

const ratio = (num: number, den: number) => (den > 0 ? num / den : 0);

// ---------------------------------------------------------------------------
// Shopify — selected period
// ---------------------------------------------------------------------------

interface PeriodScalars {
  revenue: number;
  orders: number;
  aov: number;
  sessions: number;
  cr: number;
  refundRate: number;
  freeSampleRate: number;
}

async function periodScalars(startDate: string, endDate: string): Promise<PeriodScalars> {
  const [paidAgg, allOrders, refundCount, zeroCount, sessionAgg] = await Promise.all([
    prisma.factOrder.aggregate({
      where: paidOrderFilter(startDate, endDate),
      _sum: { totalPrice: true },
      _count: true,
    }),
    prisma.factOrder.count({ where: dateFilter(startDate, endDate) }),
    prisma.factOrder.count({
      where: { ...dateFilter(startDate, endDate), financialStatus: { in: ["refunded", "partially_refunded"] } },
    }),
    prisma.factOrder.count({ where: { ...dateFilter(startDate, endDate), totalPrice: 0 } }),
    prisma.factGa4Daily.aggregate({
      where: ga4DateFilter(startDate, endDate),
      _sum: { sessions: true },
    }),
  ]);

  const revenue = Number(paidAgg._sum.totalPrice || 0);
  const orders = paidAgg._count;
  const sessions = sessionAgg._sum.sessions || 0;

  return {
    revenue,
    orders,
    aov: ratio(revenue, orders),
    sessions,
    cr: ratio(orders, sessions) * 100,
    refundRate: ratio(refundCount, allOrders) * 100,
    freeSampleRate: ratio(zeroCount, allOrders) * 100,
  };
}

async function shopifyTrend(startDate: string, endDate: string): Promise<ReportTrendPoint[]> {
  const days = eachDayOfInterval({
    start: new Date(`${startDate}T00:00:00.000Z`),
    end: new Date(`${endDate}T00:00:00.000Z`),
  });

  const [dailyOrders, dailySessions] = await Promise.all([
    prisma.factOrder.groupBy({
      by: ["orderDate"],
      where: paidOrderFilter(startDate, endDate),
      _sum: { totalPrice: true },
      _count: true,
    }),
    prisma.factGa4Daily.groupBy({
      by: ["date"],
      where: ga4DateFilter(startDate, endDate),
      _sum: { sessions: true },
    }),
  ]);

  const map = new Map<string, { revenue: number; orders: number; sessions: number }>();
  const bump = (key: string) => {
    let b = map.get(key);
    if (!b) { b = { revenue: 0, orders: 0, sessions: 0 }; map.set(key, b); }
    return b;
  };
  for (const d of dailyOrders) {
    const b = bump(format(d.orderDate, "yyyy-MM-dd"));
    b.revenue += Number(d._sum.totalPrice || 0);
    b.orders += d._count;
  }
  for (const s of dailySessions) {
    bump(format(s.date, "yyyy-MM-dd")).sessions += s._sum.sessions || 0;
  }

  return days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const b = map.get(key);
    return {
      date: format(d, "MMM dd"),
      revenue: Number((b?.revenue || 0).toFixed(2)),
      orders: b?.orders || 0,
      sessions: b?.sessions || 0,
    };
  });
}

async function shopifyBlock(
  startDate: string,
  endDate: string,
  compareStart: string,
  compareEnd: string
): Promise<ShopifyPeriodBlock> {
  const [cur, prev, trend, categoryRevenue] = await Promise.all([
    periodScalars(startDate, endDate),
    periodScalars(compareStart, compareEnd),
    shopifyTrend(startDate, endDate),
    getCategoryRevenue(startDate, endDate),
  ]);

  return {
    revenue: kpi(cur.revenue, prev.revenue),
    orders: kpi(cur.orders, prev.orders),
    aov: kpi(cur.aov, prev.aov),
    conversionRate: kpi(cur.cr, prev.cr),
    sessions: kpi(cur.sessions, prev.sessions),
    refundRate: kpi(cur.refundRate, prev.refundRate),
    freeSampleRate: kpi(cur.freeSampleRate, prev.freeSampleRate),
    trend,
    categoryRevenue,
  };
}

// ---------------------------------------------------------------------------
// Shopify — lifetime (first order ever -> selected end date)
// ---------------------------------------------------------------------------

async function lifetimeBlock(endDate: string): Promise<ShopifyLifetimeBlock> {
  // Customer-level lifetime aggregates (from Shopify), excluding internal.
  const customers = await prisma.dimCustomer.findMany({
    where: { isInternal: false, ordersCount: { gt: 0 } },
    select: { ordersCount: true, totalSpent: true },
  });

  const custCount = customers.length;
  const totalSpent = customers.reduce((a, c) => a + Number(c.totalSpent), 0);
  const avgLtv = ratio(totalSpent, custCount);

  // Lifetime order-number distribution (1..6+): % of customers, % of revenue.
  const buckets = ["1", "2", "3", "4", "5", "6+"];
  const bCust = new Map<string, number>();
  const bRev = new Map<string, number>();
  for (const c of customers) {
    const key = c.ordersCount >= 6 ? "6+" : String(Math.max(c.ordersCount, 1));
    bCust.set(key, (bCust.get(key) || 0) + 1);
    bRev.set(key, (bRev.get(key) || 0) + Number(c.totalSpent));
  }
  const orderNumberDist: OrderNumberBucket[] = buckets.map((k) => ({
    bucket: k,
    customers: bCust.get(k) || 0,
    pctCustomers: custCount > 0 ? Number((((bCust.get(k) || 0) / custCount) * 100).toFixed(1)) : 0,
    pctRevenue: totalSpent > 0 ? Number((((bRev.get(k) || 0) / totalSpent) * 100).toFixed(1)) : 0,
  }));

  // Free sample buyers -> paid conversion.
  const fsCustomers = await prisma.dimCustomer.findMany({
    where: { isInternal: false, tags: { has: "freesample" } },
    select: { totalSpent: true },
  });
  const freeSampleConversion =
    fsCustomers.length > 0
      ? {
          total: fsCustomers.length,
          paid: fsCustomers.filter((c) => Number(c.totalSpent) > 0).length,
          rate: Number(
            ((fsCustomers.filter((c) => Number(c.totalSpent) > 0).length / fsCustomers.length) * 100).toFixed(1)
          ),
        }
      : null;

  // Order value distribution across all paid orders up to endDate.
  const orders = await prisma.factOrder.findMany({
    where: {
      financialStatus: { in: ["paid", "partially_refunded"] },
      cancelledAt: null,
      orderDate: { lte: new Date(`${endDate}T23:59:59.999Z`) },
      totalPrice: { gt: 0 },
    },
    select: { totalPrice: true },
  });

  const valueBuckets: { label: string; test: (v: number) => boolean }[] = [
    { label: "<$10", test: (v) => v < 10 },
    { label: "$10 - $49.99", test: (v) => v >= 10 && v < 50 },
    { label: "$50 - $69.99", test: (v) => v >= 50 && v < 70 },
    { label: "$70 - $99.99", test: (v) => v >= 70 && v < 100 },
    { label: "$100 - $149.99", test: (v) => v >= 100 && v < 150 },
    { label: "$150 and more", test: (v) => v >= 150 },
  ];
  const vbCount = new Map<string, number>();
  const vbRev = new Map<string, number>();
  let ordTotal = 0;
  let revTotal = 0;
  for (const o of orders) {
    const v = Number(o.totalPrice);
    const b = valueBuckets.find((x) => x.test(v));
    if (!b) continue;
    vbCount.set(b.label, (vbCount.get(b.label) || 0) + 1);
    vbRev.set(b.label, (vbRev.get(b.label) || 0) + v);
    ordTotal++;
    revTotal += v;
  }
  const orderValueDist: OrderValueBucket[] = valueBuckets.map((b) => ({
    bucket: b.label,
    orders: vbCount.get(b.label) || 0,
    pctOrders: ordTotal > 0 ? Number((((vbCount.get(b.label) || 0) / ordTotal) * 100).toFixed(1)) : 0,
    pctRevenue: revTotal > 0 ? Number((((vbRev.get(b.label) || 0) / revTotal) * 100).toFixed(1)) : 0,
  }));

  return { customers: custCount, avgLtv, orderNumberDist, freeSampleConversion, orderValueDist };
}

// ---------------------------------------------------------------------------
// Ads — Google (GA4-attributed)
// ---------------------------------------------------------------------------

interface AdTotals {
  spend: number;
  conversions: number;
  convValue: number;
  impressions: number;
  clicks: number;
}

function adBlock(cur: AdTotals, prev: AdTotals | null): AdBlock {
  const p = prev;
  return {
    spend: kpi(cur.spend, p ? p.spend : null),
    conversions: kpi(cur.conversions, p ? p.conversions : null),
    roas: kpi(ratio(cur.convValue, cur.spend), p ? ratio(p.convValue, p.spend) : null),
    convValue: kpi(cur.convValue, p ? p.convValue : null),
    impressions: kpi(cur.impressions, p ? p.impressions : null),
    cpm: kpi(ratio(cur.spend, cur.impressions) * 1000, p ? ratio(p.spend, p.impressions) * 1000 : null),
    ctr: kpi(ratio(cur.clicks, cur.impressions) * 100, p ? ratio(p.clicks, p.impressions) * 100 : null),
    clicks: kpi(cur.clicks, p ? p.clicks : null),
  };
}

async function googleTotals(startDate: string, endDate: string): Promise<AdTotals> {
  const agg = await prisma.factGa4Daily.aggregate({
    where: { ...ga4DateFilter(startDate, endDate), channelGroup: { in: GOOGLE_CHANNEL_GROUPS } },
    _sum: { adCost: true, adClicks: true, adImpressions: true, purchaseEvents: true, purchaseRevenue: true },
  });
  return {
    spend: Number(agg._sum.adCost || 0),
    conversions: agg._sum.purchaseEvents || 0,
    convValue: Number(agg._sum.purchaseRevenue || 0),
    impressions: agg._sum.adImpressions || 0,
    clicks: agg._sum.adClicks || 0,
  };
}

// ---------------------------------------------------------------------------
// Ads — Meta, split by campaign name (Sales / IG / FB)
// ---------------------------------------------------------------------------

interface MetaGroupSums {
  spend: number;
  impressions: number;
  linkClicks: number;
  purchases: number;
  purchaseValue: number;
  follows: number;
  pageLikes: number;
}

const emptyMeta = (): MetaGroupSums => ({
  spend: 0, impressions: 0, linkClicks: 0, purchases: 0, purchaseValue: 0, follows: 0, pageLikes: 0,
});

function metaGroupOf(name: string): "sales" | "ig" | "fb" | null {
  const n = name.toLowerCase();
  if (n.includes("sales")) return "sales";
  if (n.includes("ig")) return "ig";
  if (n.includes("fb")) return "fb";
  return null;
}

async function metaGroups(startDate: string, endDate: string) {
  const agg = await prisma.factMetaAdsDaily.groupBy({
    by: ["campaignName"],
    where: {
      date: {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      },
    },
    _sum: { spend: true, impressions: true, linkClicks: true, purchases: true, purchaseValue: true, follows: true, pageLikes: true },
  });

  const groups = { sales: emptyMeta(), ig: emptyMeta(), fb: emptyMeta() };
  for (const m of agg) {
    const g = metaGroupOf(m.campaignName);
    if (!g) continue;
    const t = groups[g];
    t.spend += Number(m._sum.spend || 0);
    t.impressions += m._sum.impressions || 0;
    t.linkClicks += m._sum.linkClicks || 0;
    t.purchases += m._sum.purchases || 0;
    t.purchaseValue += Number(m._sum.purchaseValue || 0);
    t.follows += m._sum.follows || 0;
    t.pageLikes += m._sum.pageLikes || 0;
  }
  return groups;
}

function metaToAdTotals(m: MetaGroupSums): AdTotals {
  return {
    spend: m.spend,
    conversions: m.purchases,
    convValue: m.purchaseValue,
    impressions: m.impressions,
    clicks: m.linkClicks,
  };
}

// ---------------------------------------------------------------------------
// Top-level assembler
// ---------------------------------------------------------------------------

export async function getReport(
  startDate: string,
  endDate: string,
  compareStart: string,
  compareEnd: string
): Promise<ReportData> {
  const [shopify, lifetime, gCur, gPrev, mCur, mPrev] = await Promise.all([
    shopifyBlock(startDate, endDate, compareStart, compareEnd),
    lifetimeBlock(endDate),
    googleTotals(startDate, endDate),
    googleTotals(compareStart, compareEnd),
    metaGroups(startDate, endDate),
    metaGroups(compareStart, compareEnd),
  ]);

  const google =
    gCur.spend > 0 || gCur.clicks > 0 || gCur.impressions > 0 ? adBlock(gCur, gPrev) : null;

  const metaSales =
    mCur.sales.spend > 0 || mCur.sales.impressions > 0
      ? adBlock(metaToAdTotals(mCur.sales), metaToAdTotals(mPrev.sales))
      : null;

  const metaIg: MetaIgBlock | null =
    mCur.ig.spend > 0 || mCur.ig.follows > 0 || mCur.ig.linkClicks > 0
      ? {
          spend: kpi(mCur.ig.spend, mPrev.ig.spend),
          profileVisits: kpi(mCur.ig.linkClicks, mPrev.ig.linkClicks),
          followers: kpi(mCur.ig.follows, mPrev.ig.follows),
        }
      : null;

  const metaFb: MetaFbBlock | null =
    mCur.fb.spend > 0 || mCur.fb.pageLikes > 0
      ? {
          spend: kpi(mCur.fb.spend, mPrev.fb.spend),
          likes: kpi(mCur.fb.pageLikes, mPrev.fb.pageLikes),
        }
      : null;

  return {
    period: { startDate, endDate, compareStart, compareEnd },
    shopify,
    lifetime,
    google,
    metaSales,
    metaIg,
    metaFb,
  };
}
