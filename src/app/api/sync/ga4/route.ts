import { NextRequest } from "next/server";
import { syncGa4Daily, syncGa4Range } from "@/lib/ga4/sync-daily";
import { isGa4Configured } from "@/lib/ga4/client";
import { prisma } from "@/lib/prisma";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { subDays } from "date-fns";

export async function POST(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  if (!isGa4Configured()) {
    return errorResponse("GA4 not configured", 400);
  }

  try {
    const lastSync = await prisma.syncLog.findFirst({
      where: { source: "ga4", status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    let count: number;

    if (!lastSync) {
      // First time: backfill last 90 days
      const endDate = subDays(new Date(), 1);
      const startDate = subDays(endDate, 89);
      count = await syncGa4Range(startDate, endDate);
    } else {
      // Incremental: sync yesterday (GA4 data has ~24h delay)
      const yesterday = subDays(new Date(), 1);
      count = await syncGa4Daily(yesterday);
    }

    return jsonResponse({ success: true, recordsProcessed: count });
  } catch (error) {
    console.error("GA4 sync failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Sync failed",
      500
    );
  }
}
