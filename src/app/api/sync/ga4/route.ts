import { NextRequest } from "next/server";
import { syncGa4Daily } from "@/lib/ga4/sync-daily";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { subDays } from "date-fns";

export async function POST(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    // GA4 data is typically delayed by ~24 hours, so sync yesterday's data
    const targetDate = subDays(new Date(), 1);
    const count = await syncGa4Daily(targetDate);
    return jsonResponse({ success: true, recordsProcessed: count });
  } catch (error) {
    console.error("GA4 sync failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Sync failed",
      500
    );
  }
}
