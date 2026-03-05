import { NextRequest, NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/shopify/webhook-verify";
import { upsertOrder } from "@/lib/shopify/sync-orders";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256") || "";
  const topic = request.headers.get("x-shopify-topic") || "";

  if (!verifyShopifyWebhook(body, hmac)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const syncLog = await prisma.syncLog.create({
    data: {
      source: `shopify_webhook_${topic}`,
      syncType: "webhook",
      status: "running",
    },
  });

  try {
    const payload = JSON.parse(body);

    if (topic === "orders/create" || topic === "orders/updated") {
      // Convert REST webhook payload to GraphQL-like shape
      const orderData = mapRestToGraphQL(payload);
      await upsertOrder(orderData);
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: "completed", completedAt: new Date(), recordsProcessed: 1 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRestToGraphQL(rest: any) {
  return {
    id: `gid://shopify/Order/${rest.id}`,
    name: rest.name,
    orderNumber: rest.order_number,
    createdAt: rest.created_at,
    totalPriceSet: { shopMoney: { amount: rest.total_price, currencyCode: rest.currency } },
    subtotalPriceSet: { shopMoney: { amount: rest.subtotal_price } },
    totalDiscountsSet: { shopMoney: { amount: rest.total_discounts } },
    totalTaxSet: { shopMoney: { amount: rest.total_tax } },
    displayFinancialStatus: rest.financial_status,
    displayFulfillmentStatus: rest.fulfillment_status,
    cancelledAt: rest.cancelled_at,
    tags: rest.tags ? rest.tags.split(", ") : [],
    landingSite: rest.landing_site,
    referringSite: rest.referring_site,
    sourceName: rest.source_name,
    customer: rest.customer
      ? { id: `gid://shopify/Customer/${rest.customer.id}`, email: rest.customer.email }
      : null,
    lineItems: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      edges: (rest.line_items || []).map((li: any) => ({
        node: {
          id: `gid://shopify/LineItem/${li.id}`,
          title: li.title,
          variantTitle: li.variant_title,
          quantity: li.quantity,
          originalUnitPriceSet: { shopMoney: { amount: li.price } },
          totalDiscountSet: { shopMoney: { amount: li.total_discount } },
          vendor: li.vendor,
          sku: li.sku,
          product: li.product_id
            ? { id: `gid://shopify/Product/${li.product_id}` }
            : null,
          variant: li.variant_id
            ? { id: `gid://shopify/ProductVariant/${li.variant_id}` }
            : null,
        },
      })),
      pageInfo: { hasNextPage: false, endCursor: null },
    },
    refunds: (rest.refunds || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => ({
        id: `gid://shopify/Refund/${r.id}`,
        totalRefundedSet: {
          shopMoney: {
            amount: (r.refund_line_items || [])
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .reduce((sum: number, rli: any) => sum + parseFloat(rli.subtotal || 0), 0)
              .toString(),
          },
        },
      })
    ),
  };
}
