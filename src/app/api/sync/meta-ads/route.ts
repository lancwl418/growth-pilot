import { NextRequest } from "next/server";
import { syncMetaAdsDaily, syncMetaAdsRange } from "@/lib/meta-ads/sync";
import { isMetaAdsConfigured } from "@/lib/meta-ads/client";
import { prisma } from "@/lib/prisma";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { subDays } from "date-fns";

export async function POST(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  if (!isMetaAdsConfigured()) {
    return errorResponse("Meta Ads not configured", 400);
  }

  try {
    const lastSync = await prisma.syncLog.findFirst({
      where: { source: "meta_ads", status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    let count: number;

    if (!lastSync) {
      // First time: backfill last 90 days
      const endDate = subDays(new Date(), 1);
      const startDate = subDays(endDate, 89);
      count = await syncMetaAdsRange(startDate, endDate);
    } else {
      // Incremental: sync yesterday
      const yesterday = subDays(new Date(), 1);
      count = await syncMetaAdsDaily(yesterday);
    }

    return jsonResponse({ success: true, recordsProcessed: count });
  } catch (error) {
    console.error("Meta Ads sync failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Sync failed",
      500
    );
  }
}
