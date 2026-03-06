import { NextRequest } from "next/server";
import { syncProducts } from "@/lib/shopify/sync-products";
import { prisma } from "@/lib/prisma";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    // Check last successful sync for incremental mode
    const lastSync = await prisma.syncLog.findFirst({
      where: { source: "shopify_products", status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    // Subtract 1 hour as safety overlap to avoid missing edge-case updates
    const updatedSince = lastSync?.completedAt
      ? new Date(lastSync.completedAt.getTime() - 60 * 60 * 1000)
      : undefined;
    const count = await syncProducts(updatedSince ? { updatedSince } : undefined);
    return jsonResponse({ success: true, recordsProcessed: count });
  } catch (error) {
    console.error("Product sync failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Sync failed",
      500
    );
  }
}
