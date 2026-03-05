import { NextRequest } from "next/server";
import { syncOrders } from "@/lib/shopify/sync-orders";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const updatedSince = body.updatedSince
      ? new Date(body.updatedSince)
      : undefined;

    const count = await syncOrders(updatedSince ? { updatedSince } : undefined);
    return jsonResponse({ success: true, recordsProcessed: count });
  } catch (error) {
    console.error("Order sync failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Sync failed",
      500
    );
  }
}
