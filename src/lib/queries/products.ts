import { prisma } from "@/lib/prisma";
import { paidOrderFilter } from "./common";
import type { ProductsMetrics, ProductMetric } from "@/types/dashboard";

export async function getProductsMetrics(
  startDate: string,
  endDate: string,
  limit = 20
): Promise<ProductsMetrics> {
  // Get order IDs in the date range
  const orders = await prisma.factOrder.findMany({
    where: paidOrderFilter(startDate, endDate),
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);

  if (orderIds.length === 0) {
    return { topProducts: [], productTrends: [] };
  }

  // Aggregate line items by product
  const productAgg = await prisma.factOrderItem.groupBy({
    by: ["productId"],
    where: {
      orderId: { in: orderIds },
      productId: { not: null },
    },
    _sum: { quantity: true },
    _count: { orderId: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  // Get product details and calculate revenue
  const topProducts: ProductMetric[] = [];

  for (const agg of productAgg) {
    if (!agg.productId) continue;

    const product = await prisma.dimProduct.findUnique({
      where: { id: agg.productId },
    });

    // Calculate revenue for this product
    const revenueAgg = await prisma.factOrderItem.aggregate({
      where: {
        orderId: { in: orderIds },
        productId: agg.productId,
      },
      _sum: { price: true, quantity: true },
    });

    // Revenue = sum(price * quantity) - approximate since price is per unit
    const items = await prisma.factOrderItem.findMany({
      where: {
        orderId: { in: orderIds },
        productId: agg.productId,
      },
      select: { price: true, quantity: true, totalDiscount: true },
    });

    const revenue = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity - Number(item.totalDiscount),
      0
    );

    topProducts.push({
      id: agg.productId,
      title: product?.title || "Unknown Product",
      vendor: product?.vendor || null,
      revenue,
      unitsSold: Number(revenueAgg._sum.quantity || 0),
      orders: agg._count.orderId,
    });
  }

  // Sort by revenue descending
  topProducts.sort((a, b) => b.revenue - a.revenue);

  return {
    topProducts,
    productTrends: [], // Simplified for MVP; can add daily breakdown later
  };
}
