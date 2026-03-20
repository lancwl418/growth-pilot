import { prisma } from "@/lib/prisma";
import { ga4DateFilter } from "./common";
import type { AdSummary, AdCampaignRow } from "@/types/dashboard";

export async function getAdSummary(
  startDate: string,
  endDate: string
): Promise<AdSummary | null> {
  const dateGte = new Date(`${startDate}T00:00:00.000Z`);
  const dateLte = new Date(`${endDate}T23:59:59.999Z`);

  // Google Ads data from GA4 (Paid Search / Paid Social via Google)
  const googleAgg = await prisma.factGa4Daily.groupBy({
    by: ["campaignName"],
    where: {
      ...ga4DateFilter(startDate, endDate),
      adCost: { gt: 0 },
      channelGroup: { in: ["Paid Search", "Cross-network"] },
    },
    _sum: {
      adCost: true,
      adClicks: true,
      adImpressions: true,
      purchaseEvents: true,
      purchaseRevenue: true,
    },
  });

  const googleCampaigns: AdCampaignRow[] = googleAgg.map((g) => {
    const spend = Number(g._sum.adCost || 0);
    const impressions = g._sum.adImpressions || 0;
    const clicks = g._sum.adClicks || 0;
    const purchases = g._sum.purchaseEvents || 0;
    const purchaseValue = Number(g._sum.purchaseRevenue || 0);
    return {
      platform: "Google Ads",
      campaignName: g.campaignName || "(not set)",
      spend,
      purchases,
      purchaseValue,
      roas: spend > 0 ? purchaseValue / spend : 0,
      impressions,
      reach: null,
      linkClicks: clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    };
  });

  // Meta Ads data from fact_meta_ads_daily
  const metaAgg = await prisma.factMetaAdsDaily.groupBy({
    by: ["campaignName"],
    where: { date: { gte: dateGte, lte: dateLte } },
    _sum: {
      spend: true,
      impressions: true,
      reach: true,
      linkClicks: true,
      purchases: true,
      purchaseValue: true,
    },
  });

  const metaCampaigns: AdCampaignRow[] = metaAgg.map((m) => {
    const spend = Number(m._sum.spend || 0);
    const impressions = m._sum.impressions || 0;
    const reach = m._sum.reach || 0;
    const clicks = m._sum.linkClicks || 0;
    const purchases = m._sum.purchases || 0;
    const purchaseValue = Number(m._sum.purchaseValue || 0);
    return {
      platform: "Meta Ads",
      campaignName: m.campaignName,
      spend,
      purchases,
      purchaseValue,
      roas: spend > 0 ? purchaseValue / spend : 0,
      impressions,
      reach,
      linkClicks: clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    };
  });

  const campaigns = [...googleCampaigns, ...metaCampaigns].sort(
    (a, b) => b.spend - a.spend
  );

  if (campaigns.length === 0) return null;

  // Platform totals
  const platformMap = new Map<string, AdCampaignRow[]>();
  for (const c of campaigns) {
    const arr = platformMap.get(c.platform) || [];
    arr.push(c);
    platformMap.set(c.platform, arr);
  }

  const platformTotals = Array.from(platformMap.entries()).map(
    ([platform, rows]) => {
      const spend = rows.reduce((s, r) => s + r.spend, 0);
      const impressions = rows.reduce((s, r) => s + r.impressions, 0);
      const reachSum = platform === "Meta Ads"
        ? rows.reduce((s, r) => s + (r.reach || 0), 0)
        : null;
      const clicks = rows.reduce((s, r) => s + r.linkClicks, 0);
      const purchases = rows.reduce((s, r) => s + r.purchases, 0);
      const purchaseValue = rows.reduce((s, r) => s + r.purchaseValue, 0);
      return {
        platform,
        spend,
        purchases,
        purchaseValue,
        roas: spend > 0 ? purchaseValue / spend : 0,
        impressions,
        reach: reachSum,
        linkClicks: clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      };
    }
  );

  // Grand total
  const totalSpend = campaigns.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = campaigns.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = campaigns.reduce((s, r) => s + r.linkClicks, 0);
  const totalPurchases = campaigns.reduce((s, r) => s + r.purchases, 0);
  const totalPurchaseValue = campaigns.reduce((s, r) => s + r.purchaseValue, 0);

  return {
    campaigns,
    platformTotals,
    grandTotal: {
      spend: totalSpend,
      purchases: totalPurchases,
      purchaseValue: totalPurchaseValue,
      roas: totalSpend > 0 ? totalPurchaseValue / totalSpend : 0,
      impressions: totalImpressions,
      linkClicks: totalClicks,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
    },
  };
}
