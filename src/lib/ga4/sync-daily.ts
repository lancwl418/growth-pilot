import { prisma } from "@/lib/prisma";
import { isGa4Configured, getGa4Client, getGa4PropertyId } from "./client";
import { format } from "date-fns";

const GA4_DIMENSIONS = [
  { name: "date" },
  { name: "sessionDefaultChannelGroup" },
  { name: "sessionSourceMedium" },
  { name: "sessionCampaignName" },
];

const GA4_METRICS = [
  { name: "sessions" },
  { name: "totalUsers" },
  { name: "newUsers" },
  { name: "engagedSessions" },
  { name: "ecommercePurchases" },
  { name: "purchaseRevenue" },
  { name: "advertiserAdCost" },
  { name: "advertiserAdClicks" },
  { name: "advertiserAdImpressions" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertRows(rows: any[], fallbackDate: string): Promise<number> {
  let total = 0;

  for (const row of rows) {
    const dims = row.dimensionValues || [];
    const vals = row.metricValues || [];

    const rowDate = dims[0]?.value || fallbackDate.replace(/-/g, "");
    const parsedDate = `${rowDate.slice(0, 4)}-${rowDate.slice(4, 6)}-${rowDate.slice(6, 8)}`;
    const channelGroup = dims[1]?.value || "(not set)";
    const sourceMedium = dims[2]?.value || null;
    const campaignName = dims[3]?.value || null;

    const data = {
      sessions: parseInt(vals[0]?.value || "0", 10),
      users: parseInt(vals[1]?.value || "0", 10),
      newUsers: parseInt(vals[2]?.value || "0", 10),
      engagedSessions: parseInt(vals[3]?.value || "0", 10),
      purchaseEvents: parseInt(vals[4]?.value || "0", 10),
      purchaseRevenue: parseFloat(vals[5]?.value || "0"),
      adCost: parseFloat(vals[6]?.value || "0"),
      adClicks: parseInt(vals[7]?.value || "0", 10),
      adImpressions: parseInt(vals[8]?.value || "0", 10),
    };

    await prisma.factGa4Daily.upsert({
      where: {
        date_channelGroup_sourceMedium_campaignName: {
          date: new Date(`${parsedDate}T00:00:00.000Z`),
          channelGroup,
          sourceMedium: sourceMedium || "",
          campaignName: campaignName || "",
        },
      },
      create: {
        date: new Date(`${parsedDate}T00:00:00.000Z`),
        channelGroup,
        sourceMedium,
        campaignName,
        ...data,
      },
      update: {
        ...data,
        syncedAt: new Date(),
      },
    });

    total++;
  }

  return total;
}

export async function syncGa4Daily(targetDate: Date): Promise<number> {
  if (!isGa4Configured()) {
    console.log("GA4 not configured, skipping sync");
    return 0;
  }

  const syncLog = await prisma.syncLog.create({
    data: { source: "ga4", syncType: "daily", status: "running" },
  });

  try {
    const client = getGa4Client();
    const dateStr = format(targetDate, "yyyy-MM-dd");

    const [response] = await client.runReport({
      property: getGa4PropertyId(),
      dateRanges: [{ startDate: dateStr, endDate: dateStr }],
      dimensions: GA4_DIMENSIONS,
      metrics: GA4_METRICS,
    });

    const total = await upsertRows(response.rows || [], dateStr);

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

/** Backfill multiple days at once (for initial setup) */
export async function syncGa4Range(startDate: Date, endDate: Date): Promise<number> {
  if (!isGa4Configured()) return 0;

  const syncLog = await prisma.syncLog.create({
    data: { source: "ga4", syncType: "backfill", status: "running" },
  });

  try {
    const client = getGa4Client();
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");

    const [response] = await client.runReport({
      property: getGa4PropertyId(),
      dateRanges: [{ startDate: startStr, endDate: endStr }],
      dimensions: GA4_DIMENSIONS,
      metrics: GA4_METRICS,
      limit: 100000,
    });

    const total = await upsertRows(response.rows || [], startStr);

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
