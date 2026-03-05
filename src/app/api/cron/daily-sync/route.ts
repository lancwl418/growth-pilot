import { NextRequest } from "next/server";
import { syncProducts } from "@/lib/shopify/sync-products";
import { syncCustomers } from "@/lib/shopify/sync-customers";
import { syncOrders } from "@/lib/shopify/sync-orders";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { subHours } from "date-fns";

export async function GET(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  const results: Record<string, unknown> = {};

  try {
    // Sync products first (needed for order line item resolution)
    results.products = await syncProducts();
  } catch (error) {
    results.products = { error: error instanceof Error ? error.message : "Failed" };
  }

  try {
    results.customers = await syncCustomers();
  } catch (error) {
    results.customers = { error: error instanceof Error ? error.message : "Failed" };
  }

  try {
    // Incremental: orders updated in last 48 hours
    const updatedSince = subHours(new Date(), 48);
    results.orders = await syncOrders({ updatedSince });
  } catch (error) {
    results.orders = { error: error instanceof Error ? error.message : "Failed" };
  }

  return jsonResponse({ success: true, results });
}
