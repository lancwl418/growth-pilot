import { NextRequest } from "next/server";
import { syncProducts } from "@/lib/shopify/sync-products";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const count = await syncProducts();
    return jsonResponse({ success: true, recordsProcessed: count });
  } catch (error) {
    console.error("Product sync failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Sync failed",
      500
    );
  }
}
