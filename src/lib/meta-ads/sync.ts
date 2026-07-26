import { prisma } from "@/lib/prisma";
import { fetchCampaignInsights, parseInsightRow, isMetaAdsConfigured } from "./client";
import { format } from "date-fns";

async function upsertInsightRows(
  rows: Awaited<ReturnType<typeof fetchCampaignInsights>>
): Promise<number> {
  let total = 0;

  for (const row of rows) {
    const parsed = parseInsightRow(row);
    const date = new Date(`${row.date_start}T00:00:00.000Z`);

    const data = {
      campaignName: parsed.campaignName,
      adsetName: parsed.adsetName,
      objective: parsed.objective,
      spend: parsed.spend,
      impressions: parsed.impressions,
      reach: parsed.reach,
      linkClicks: parsed.linkClicks,
      purchases: parsed.purchases,
      purchaseValue: parsed.purchaseValue,
      follows: parsed.follows,
      pageLikes: parsed.pageLikes,
    };

    await prisma.factMetaAdsDaily.upsert({
      where: {
        date_campaignId: { date, campaignId: parsed.campaignId },
      },
      create: { date, campaignId: parsed.campaignId, ...data },
      update: { ...data, syncedAt: new Date() },
    });
    total++;
  }

  return total;
}

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
    const total = await upsertInsightRows(rows);

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
    const total = await upsertInsightRows(rows);

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
