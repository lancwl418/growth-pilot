import { NextRequest } from "next/server";
import { syncCustomers } from "@/lib/shopify/sync-customers";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const count = await syncCustomers();
    return jsonResponse({ success: true, recordsProcessed: count });
  } catch (error) {
    console.error("Customer sync failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Sync failed",
      500
    );
  }
}
