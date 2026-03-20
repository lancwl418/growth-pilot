import { prisma } from "@/lib/prisma";
import { fetchCampaignInsights, parseInsightRow, isMetaAdsConfigured } from "./client";
import { format, subDays, eachDayOfInterval } from "date-fns";

export async function syncMetaAdsDaily(targetDate: Date): Promise<number> {
  if (!isMetaAdsConfigured()) {
    console.log("Meta Ads not configured, skipping sync");
    return 0;
  }

  const dateStr = format(targetDate, "yyyy-MM-dd");

  const syncLog = await prisma.syncLog.create({
    data: { source: "meta_ads", syncType: "daily", status: "running" },
  });

  try {
    const rows = await fetchCampaignInsights(dateStr, dateStr);
    let total = 0;

    for (const row of rows) {
      const parsed = parseInsightRow(row);
      const date = new Date(`${row.date_start}T00:00:00.000Z`);

      await prisma.factMetaAdsDaily.upsert({
        where: {
          date_campaignId: { date, campaignId: parsed.campaignId },
        },
        create: {
          date,
          campaignId: parsed.campaignId,
          campaignName: parsed.campaignName,
          adsetName: parsed.adsetName,
          spend: parsed.spend,
          impressions: parsed.impressions,
          reach: parsed.reach,
          linkClicks: parsed.linkClicks,
          purchases: parsed.purchases,
          purchaseValue: parsed.purchaseValue,
        },
        update: {
          campaignName: parsed.campaignName,
          adsetName: parsed.adsetName,
          spend: parsed.spend,
          impressions: parsed.impressions,
          reach: parsed.reach,
          linkClicks: parsed.linkClicks,
          purchases: parsed.purchases,
          purchaseValue: parsed.purchaseValue,
          syncedAt: new Date(),
        },
      });
      total++;
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: "completed", completedAt: new Date(), recordsProcessed: total },
    });

    return total;
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

export async function syncMetaAdsRange(startDate: Date, endDate: Date): Promise<number> {
  if (!isMetaAdsConfigured()) return 0;

  const syncLog = await prisma.syncLog.create({
    data: { source: "meta_ads", syncType: "backfill", status: "running" },
  });

  try {
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");
    const rows = await fetchCampaignInsights(startStr, endStr);
    let total = 0;

    for (const row of rows) {
      const parsed = parseInsightRow(row);
      const date = new Date(`${row.date_start}T00:00:00.000Z`);

      await prisma.factMetaAdsDaily.upsert({
        where: {
          date_campaignId: { date, campaignId: parsed.campaignId },
        },
        create: {
          date,
          campaignId: parsed.campaignId,
          campaignName: parsed.campaignName,
          adsetName: parsed.adsetName,
          spend: parsed.spend,
          impressions: parsed.impressions,
          reach: parsed.reach,
          linkClicks: parsed.linkClicks,
          purchases: parsed.purchases,
          purchaseValue: parsed.purchaseValue,
        },
        update: {
          campaignName: parsed.campaignName,
          adsetName: parsed.adsetName,
          spend: parsed.spend,
          impressions: parsed.impressions,
          reach: parsed.reach,
          linkClicks: parsed.linkClicks,
          purchases: parsed.purchases,
          purchaseValue: parsed.purchaseValue,
          syncedAt: new Date(),
        },
      });
      total++;
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: "completed", completedAt: new Date(), recordsProcessed: total },
    });

    return total;
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}
