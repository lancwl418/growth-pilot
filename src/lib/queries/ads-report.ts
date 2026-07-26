import { prisma } from "@/lib/prisma";
import { ga4DateFilter } from "./common";
import { format, startOfWeek, differenceInCalendarDays } from "date-fns";
import type {
  AdsMetric,
  AdsReport,
  AdsTrendPoint,
  FreeSampleBucket,
  GoogleAdsBlock,
  MetaConversionBlock,
  MetaFanBlock,
} from "@/types/dashboard";

const GOOGLE_CHANNEL_GROUPS = ["Paid Search", "Cross-network"];

// Meta campaign objectives that indicate fan-growth (engagement) campaigns
const FAN_OBJECTIVES = ["OUTCOME_ENGAGEMENT", "PAGE_LIKES", "POST_ENGAGEMENT"];
const FAN_NAME_RE = /fan|follow|like|粉/i;

function metric(current: number, previous: number | null): AdsMetric {
  if (previous === null || previous === 0) return { value: current, change: null };
  return { value: current, change: ((current - previous) / previous) * 100 };
}

interface GoogleTotals {
  cost: number;
  conversions: number;
  convValue: number;
  impressions: number;
  clicks: number;
}

async function googleTotals(startDate: string, endDate: string): Promise<GoogleTotals> {
  const agg = await prisma.factGa4Daily.aggregate({
    where: {
      ...ga4DateFilter(startDate, endDate),
      channelGroup: { in: GOOGLE_CHANNEL_GROUPS },
    },
    _sum: {
      adCost: true,
      adClicks: true,
      adImpressions: true,
      purchaseEvents: true,
      purchaseRevenue: true,
    },
  });
  return {
    cost: Number(agg._sum.adCost || 0),
    conversions: agg._sum.purchaseEvents || 0,
    convValue: Number(agg._sum.purchaseRevenue || 0),
    impressions: agg._sum.adImpressions || 0,
    clicks: agg._sum.adClicks || 0,
  };
}

interface MetaCampaignAgg {
  campaignName: string;
  objective: string | null;
  spend: number;
  impressions: number;
  linkClicks: number;
  purchases: number;
  purchaseValue: number;
  follows: number;
  pageLikes: number;
}

function isFanCampaign(c: MetaCampaignAgg): boolean {
  if (c.objective && FAN_OBJECTIVES.includes(c.objective)) return true;
  if (c.follows > 0 || c.pageLikes > 0) return true;
  return FAN_NAME_RE.test(c.campaignName);
}

async function metaCampaigns(startDate: string, endDate: string): Promise<MetaCampaignAgg[]> {
  const agg = await prisma.factMetaAdsDaily.groupBy({
    by: ["campaignName", "objective"],
    where: {
      date: {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      },
    },
    _sum: {
      spend: true,
      impressions: true,
      linkClicks: true,
      purchases: true,
      purchaseValue: true,
      follows: true,
      pageLikes: true,
    },
  });
  return agg.map((m) => ({
    campaignName: m.campaignName,
    objective: m.objective,
    spend: Number(m._sum.spend || 0),
    impressions: m._sum.impressions || 0,
    linkClicks: m._sum.linkClicks || 0,
    purchases: m._sum.purchases || 0,
    purchaseValue: Number(m._sum.purchaseValue || 0),
    follows: m._sum.follows || 0,
    pageLikes: m._sum.pageLikes || 0,
  }));
}

function sumMeta(campaigns: MetaCampaignAgg[]) {
  return campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      linkClicks: acc.linkClicks + c.linkClicks,
      purchases: acc.purchases + c.purchases,
      purchaseValue: acc.purchaseValue + c.purchaseValue,
      follows: acc.follows + c.follows,
      pageLikes: acc.pageLikes + c.pageLikes,
    }),
    { spend: 0, impressions: 0, linkClicks: 0, purchases: 0, purchaseValue: 0, follows: 0, pageLikes: 0 }
  );
}

async function buildTrend(startDate: string, endDate: string): Promise<AdsTrendPoint[]> {
  // Daily buckets for ranges <= 31 days, weekly (Mon-start) otherwise
  const weekly =
    differenceInCalendarDays(new Date(endDate), new Date(startDate)) > 31;

  const [googleDaily, metaDaily] = await Promise.all([
    prisma.factGa4Daily.groupBy({
      by: ["date"],
      where: {
        ...ga4DateFilter(startDate, endDate),
        channelGroup: { in: GOOGLE_CHANNEL_GROUPS },
      },
      _sum: { adCost: true, purchaseRevenue: true },
    }),
    prisma.factMetaAdsDaily.groupBy({
      by: ["date"],
      where: {
        date: {
          gte: new Date(`${startDate}T00:00:00.000Z`),
          lte: new Date(`${endDate}T23:59:59.999Z`),
        },
      },
      _sum: { spend: true, purchaseValue: true },
    }),
  ]);

  const buckets = new Map<
    string,
    { googleCost: number; googleValue: number; metaSpend: number; metaValue: number }
  >();

  const bucketKey = (d: Date) =>
    weekly
      ? format(startOfWeek(d, { weekStartsOn: 1 }), "MMM d")
      : format(d, "MMM d");

  const getBucket = (key: string) => {
    let b = buckets.get(key);
    if (!b) {
      b = { googleCost: 0, googleValue: 0, metaSpend: 0, metaValue: 0 };
      buckets.set(key, b);
    }
    return b;
  };

  for (const g of googleDaily) {
    const b = getBucket(bucketKey(g.date));
    b.googleCost += Number(g._sum.adCost || 0);
    b.googleValue += Number(g._sum.purchaseRevenue || 0);
  }
  for (const m of metaDaily) {
    const b = getBucket(bucketKey(m.date));
    b.metaSpend += Number(m._sum.spend || 0);
    b.metaValue += Number(m._sum.purchaseValue || 0);
  }

  const dates = [...new Set([...googleDaily, ...metaDaily].map((r) => r.date.getTime()))]
    .sort((a, b) => a - b)
    .map((t) => bucketKey(new Date(t)));
  const orderedKeys = [...new Set(dates)];

  return orderedKeys.map((period) => {
    const b = buckets.get(period)!;
    return {
      period,
      googleCost: Number(b.googleCost.toFixed(2)),
      googleRoas: b.googleCost > 0 ? Number((b.googleValue / b.googleCost).toFixed(2)) : 0,
      metaSpend: Number(b.metaSpend.toFixed(2)),
      metaRoas: b.metaSpend > 0 ? Number((b.metaValue / b.metaSpend).toFixed(2)) : 0,
    };
  });
}

async function freeSampleBreakdown(): Promise<{ total: number; buckets: FreeSampleBucket[] } | null> {
  const customers = await prisma.dimCustomer.findMany({
    where: { tags: { has: "freesample" }, isInternal: false },
    select: { ordersCount: true },
  });
  if (customers.length === 0) return null;

  const counts = new Map<string, number>();
  for (const c of customers) {
    const key = c.ordersCount >= 6 ? "6+" : String(Math.max(c.ordersCount, 1));
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const total = customers.length;
  const buckets: FreeSampleBucket[] = ["1", "2", "3", "4", "5", "6+"].map((k) => ({
    lifetimeOrders: k,
    customers: counts.get(k) || 0,
    pct: Number((((counts.get(k) || 0) / total) * 100).toFixed(1)),
  }));

  return { total, buckets };
}

export async function getAdsReport(
  startDate: string,
  endDate: string,
  compareStart?: string,
  compareEnd?: string
): Promise<AdsReport> {
  const hasCompare = !!(compareStart && compareEnd);

  const [gCur, gPrev, mCur, mPrev, trend, freeSample] = await Promise.all([
    googleTotals(startDate, endDate),
    hasCompare ? googleTotals(compareStart!, compareEnd!) : Promise.resolve(null),
    metaCampaigns(startDate, endDate),
    hasCompare ? metaCampaigns(compareStart!, compareEnd!) : Promise.resolve(null),
    buildTrend(startDate, endDate),
    freeSampleBreakdown(),
  ]);

  // ---- Google block (GA4-attributed; no impression share until Ads API) ----
  let google: GoogleAdsBlock | null = null;
  if (gCur.cost > 0 || gCur.clicks > 0 || gCur.impressions > 0) {
    const p = gPrev;
    const ratio = (num: number, den: number) => (den > 0 ? num / den : 0);
    google = {
      cost: metric(gCur.cost, p ? p.cost : null),
      conversions: metric(gCur.conversions, p ? p.conversions : null),
      convValue: metric(gCur.convValue, p ? p.convValue : null),
      costPerConv: metric(
        ratio(gCur.cost, gCur.conversions),
        p ? ratio(p.cost, p.conversions) : null
      ),
      roas: metric(ratio(gCur.convValue, gCur.cost), p ? ratio(p.convValue, p.cost) : null),
      avgConvValue: metric(
        ratio(gCur.convValue, gCur.conversions),
        p ? ratio(p.convValue, p.conversions) : null
      ),
      impressions: metric(gCur.impressions, p ? p.impressions : null),
      clicks: metric(gCur.clicks, p ? p.clicks : null),
      clickConvRate: metric(
        ratio(gCur.conversions, gCur.clicks) * 100,
        p ? ratio(p.conversions, p.clicks) * 100 : null
      ),
    };
  }

  // ---- Meta blocks ----
  let metaConversion: MetaConversionBlock | null = null;
  let metaFans: MetaFanBlock | null = null;

  if (mCur.length > 0) {
    const conv = sumMeta(mCur.filter((c) => !isFanCampaign(c)));
    const fanCampaigns = mCur.filter(isFanCampaign);
    const prevConv = mPrev ? sumMeta(mPrev.filter((c) => !isFanCampaign(c))) : null;
    const ratio = (num: number, den: number) => (den > 0 ? num / den : 0);

    if (conv.spend > 0 || conv.impressions > 0) {
      metaConversion = {
        spend: metric(conv.spend, prevConv ? prevConv.spend : null),
        purchases: metric(conv.purchases, prevConv ? prevConv.purchases : null),
        purchaseValue: metric(conv.purchaseValue, prevConv ? prevConv.purchaseValue : null),
        costPerPurchase: metric(
          ratio(conv.spend, conv.purchases),
          prevConv ? ratio(prevConv.spend, prevConv.purchases) : null
        ),
        roas: metric(
          ratio(conv.purchaseValue, conv.spend),
          prevConv ? ratio(prevConv.purchaseValue, prevConv.spend) : null
        ),
        avgPurchaseValue: metric(
          ratio(conv.purchaseValue, conv.purchases),
          prevConv ? ratio(prevConv.purchaseValue, prevConv.purchases) : null
        ),
        impressions: metric(conv.impressions, prevConv ? prevConv.impressions : null),
        linkClicks: metric(conv.linkClicks, prevConv ? prevConv.linkClicks : null),
        ctr: metric(
          ratio(conv.linkClicks, conv.impressions) * 100,
          prevConv ? ratio(prevConv.linkClicks, prevConv.impressions) * 100 : null
        ),
        cpm: metric(
          ratio(conv.spend, conv.impressions) * 1000,
          prevConv ? ratio(prevConv.spend, prevConv.impressions) * 1000 : null
        ),
        convRateFromAd: metric(
          ratio(conv.purchases, conv.linkClicks) * 100,
          prevConv ? ratio(prevConv.purchases, prevConv.linkClicks) * 100 : null
        ),
      };
    }

    if (fanCampaigns.length > 0) {
      // Split fan campaigns between IG and FB: prefer explicit naming, fall back
      // to which fan metric the campaign actually drives
      const ig = { spend: 0, follows: 0 };
      const fb = { spend: 0, likes: 0 };
      for (const c of fanCampaigns) {
        const name = c.campaignName.toLowerCase();
        const isIg =
          /instagram|\big\b/.test(name) ||
          (!/facebook|\bfb\b/.test(name) && c.follows >= c.pageLikes);
        if (isIg) {
          ig.spend += c.spend;
          ig.follows += c.follows;
        } else {
          fb.spend += c.spend;
          fb.likes += c.pageLikes;
        }
      }
      metaFans = { instagram: ig, facebook: fb };
    }
  }

  return { google, metaConversion, metaFans, trend, freeSample };
}
