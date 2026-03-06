import { NextRequest } from "next/server";
import { syncOrders } from "@/lib/shopify/sync-orders";
import { prisma } from "@/lib/prisma";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function POST(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const lastSync = await prisma.syncLog.findFirst({
      where: { source: "shopify_orders", status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    const updatedSince = lastSync?.completedAt
      ? new Date(lastSync.completedAt.getTime() - 60 * 60 * 1000)
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
