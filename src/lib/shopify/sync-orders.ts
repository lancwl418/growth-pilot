import { prisma } from "@/lib/prisma";
import { shopifyGraphQL } from "./client";
import { ORDERS_QUERY } from "./queries";
import { hashEmail } from "@/lib/utils/hash";
import { extractShopifyId, type ShopifyOrder, type ShopifyConnection } from "@/types/shopify";

interface OrdersResponse {
  orders: ShopifyConnection<ShopifyOrder>;
}

export async function syncOrders(options?: {
  updatedSince?: Date;
}): Promise<number> {
  let hasNextPage = true;
  let cursor: string | null = null;
  let total = 0;

  const syncType = options?.updatedSince ? "incremental" : "full";
  const queryFilter = options?.updatedSince
    ? `updated_at:>'${options.updatedSince.toISOString()}'`
    : undefined;

  const syncLog = await prisma.syncLog.create({
    data: { source: "shopify_orders", syncType, status: "running" },
  });

  try {
    while (hasNextPage) {
      const variables: Record<string, unknown> = { first: 50, after: cursor, query: queryFilter };
      const data = await shopifyGraphQL<OrdersResponse>(ORDERS_QUERY, variables);

      for (const edge of data.orders.edges) {
        await upsertOrder(edge.node);
        total++;
      }

      hasNextPage = data.orders.pageInfo.hasNextPage;
      cursor = data.orders.pageInfo.endCursor;

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { recordsProcessed: total, cursor },
      });
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: "completed", completedAt: new Date(), recordsProcessed: total },
    });

    return total;
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

export async function upsertOrder(order: ShopifyOrder) {
  const shopifyId = extractShopifyId(order.id);

  // Resolve customer
  let customerId: string | null = null;
  if (order.customer) {
    const customerShopifyId = extractShopifyId(order.customer.id);
    const emailHash = order.customer.email
      ? hashEmail(order.customer.email)
      : `no-email-${customerShopifyId}`;

    const customer = await prisma.dimCustomer.upsert({
      where: { shopifyId: customerShopifyId },
      create: {
        shopifyId: customerShopifyId,
        emailHash,
        createdAt: new Date(),
      },
      update: {
        syncedAt: new Date(),
      },
    });
    customerId = customer.id;
  }

  // Calculate total refund
  const totalRefund = order.refunds.reduce(
    (sum, r) => sum + parseFloat(r.totalRefundedSet.shopMoney.amount),
    0
  );

  const lineItems = order.lineItems.edges.map((e) => e.node);

  // Map financial status
  const financialStatus = order.displayFinancialStatus?.toLowerCase().replace(/ /g, "_") || "unknown";

  // Upsert order
  const dbOrder = await prisma.factOrder.upsert({
    where: { shopifyId },
    create: {
      shopifyId,
      orderNumber: order.orderNumber,
      customerId,
      orderDate: new Date(order.createdAt),
      financialStatus,
      fulfillmentStatus: order.displayFulfillmentStatus?.toLowerCase().replace(/ /g, "_") || null,
      totalPrice: parseFloat(order.totalPriceSet.shopMoney.amount),
      subtotalPrice: parseFloat(order.subtotalPriceSet.shopMoney.amount),
      totalDiscount: parseFloat(order.totalDiscountsSet.shopMoney.amount),
      totalTax: parseFloat(order.totalTaxSet.shopMoney.amount),
      totalRefund,
      currency: order.totalPriceSet.shopMoney.currencyCode,
      itemCount: lineItems.reduce((sum, li) => sum + li.quantity, 0),
      landingSite: order.landingSite,
      referringSite: order.referringSite,
      sourceName: order.sourceName,
      tags: order.tags,
      cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : null,
      createdAt: new Date(order.createdAt),
    },
    update: {
      financialStatus,
      fulfillmentStatus: order.displayFulfillmentStatus?.toLowerCase().replace(/ /g, "_") || null,
      totalPrice: parseFloat(order.totalPriceSet.shopMoney.amount),
      subtotalPrice: parseFloat(order.subtotalPriceSet.shopMoney.amount),
      totalDiscount: parseFloat(order.totalDiscountsSet.shopMoney.amount),
      totalTax: parseFloat(order.totalTaxSet.shopMoney.amount),
      totalRefund,
      itemCount: lineItems.reduce((sum, li) => sum + li.quantity, 0),
      cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : null,
      syncedAt: new Date(),
    },
  });

  // Delete existing line items and recreate (simpler than individual upserts)
  await prisma.factOrderItem.deleteMany({ where: { orderId: dbOrder.id } });

  for (const li of lineItems) {
    // Resolve product/variant IDs
    let productId: string | null = null;
    let variantId: string | null = null;

    if (li.product?.id) {
      const productShopifyId = extractShopifyId(li.product.id);
      const product = await prisma.dimProduct.findUnique({
        where: { shopifyId: productShopifyId },
      });
      if (product) productId = product.id;
    }

    if (li.variant?.id) {
      const variantShopifyId = extractShopifyId(li.variant.id);
      const variant = await prisma.dimVariant.findUnique({
        where: { shopifyId: variantShopifyId },
      });
      if (variant) variantId = variant.id;
    }

    await prisma.factOrderItem.create({
      data: {
        orderId: dbOrder.id,
        productId,
        variantId,
        title: li.title,
        variantTitle: li.variantTitle,
        quantity: li.quantity,
        price: parseFloat(li.originalUnitPriceSet.shopMoney.amount),
        totalDiscount: parseFloat(li.totalDiscountSet.shopMoney.amount),
        vendor: li.vendor,
        sku: li.sku,
      },
    });
  }

  // Update customer aggregates
  if (customerId) {
    const customerOrders = await prisma.factOrder.aggregate({
      where: { customerId, financialStatus: { not: "refunded" } },
      _count: true,
      _sum: { totalPrice: true },
      _min: { orderDate: true },
      _max: { orderDate: true },
    });

    await prisma.dimCustomer.update({
      where: { id: customerId },
      data: {
        ordersCount: customerOrders._count,
        totalSpent: customerOrders._sum.totalPrice || 0,
        firstOrderAt: customerOrders._min.orderDate,
        lastOrderAt: customerOrders._max.orderDate,
      },
    });
  }
}
