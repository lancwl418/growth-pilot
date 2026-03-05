import { prisma } from "@/lib/prisma";
import { isGa4Configured } from "./client";
import { format } from "date-fns";

export async function syncGa4Daily(targetDate: Date): Promise<number> {
  if (!isGa4Configured()) {
    console.log("GA4 not configured, skipping sync");
    return 0;
  }

  const syncLog = await prisma.syncLog.create({
    data: { source: "ga4", syncType: "full", status: "running" },
  });

  try {
    // TODO: Implement when GA4 credentials are available
    //
    // 1. Initialize BetaAnalyticsDataClient with service account credentials:
    //    const credentials = JSON.parse(
    //      Buffer.from(process.env.GA4_CREDENTIALS_JSON!, "base64").toString()
    //    );
    //    const client = new BetaAnalyticsDataClient({ credentials });
    //
    // 2. Call runReport:
    //    const [response] = await client.runReport({
    //      property: process.env.GA4_PROPERTY_ID,
    //      dateRanges: [{ startDate: formatDate(targetDate), endDate: formatDate(targetDate) }],
    //      dimensions: [
    //        { name: "date" },
    //        { name: "sessionDefaultChannelGroup" },
    //        { name: "sessionSourceMedium" },
    //        { name: "sessionCampaignName" },
    //      ],
    //      metrics: [
    //        { name: "sessions" },
    //        { name: "totalUsers" },
    //        { name: "newUsers" },
    //        { name: "engagedSessions" },
    //        { name: "ecommercePurchases" },
    //        { name: "purchaseRevenue" },
    //      ],
    //    });
    //
    // 3. Parse rows and upsert into FactGa4Daily
    //    for (const row of response.rows || []) {
    //      await prisma.factGa4Daily.upsert({
    //        where: { date_channelGroup_sourceMedium_campaignName: { ... } },
    //        create: { ... },
    //        update: { ... },
    //      });
    //    }

    const dateStr = format(targetDate, "yyyy-MM-dd");
    console.log(`GA4 sync placeholder for ${dateStr} - implement when credentials ready`);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: "completed", completedAt: new Date(), recordsProcessed: 0 },
    });

    return 0;
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
