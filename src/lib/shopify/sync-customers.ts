import { prisma } from "@/lib/prisma";
import { shopifyGraphQL } from "./client";
import { CUSTOMERS_QUERY } from "./queries";
import { hashEmail } from "@/lib/utils/hash";
import { extractShopifyId, type ShopifyCustomer, type ShopifyConnection } from "@/types/shopify";

interface CustomersResponse {
  customers: ShopifyConnection<ShopifyCustomer>;
}

export async function syncCustomers(): Promise<number> {
  let hasNextPage = true;
  let cursor: string | null = null;
  let total = 0;

  const syncLog = await prisma.syncLog.create({
    data: { source: "shopify_customers", syncType: "full", status: "running" },
  });

  try {
    while (hasNextPage) {
      const variables: Record<string, unknown> = { first: 50, after: cursor };
      const data = await shopifyGraphQL<CustomersResponse>(CUSTOMERS_QUERY, variables);

      for (const edge of data.customers.edges) {
        const customer = edge.node;
        const shopifyId = extractShopifyId(customer.id);
        const emailHash = customer.email ? hashEmail(customer.email) : `no-email-${shopifyId}`;

        await prisma.dimCustomer.upsert({
          where: { shopifyId },
          create: {
            shopifyId,
            emailHash,
            ordersCount: parseInt(customer.ordersCount, 10) || 0,
            totalSpent: parseFloat(customer.totalSpentV2.amount) || 0,
            tags: customer.tags,
            createdAt: new Date(customer.createdAt),
          },
          update: {
            emailHash,
            ordersCount: parseInt(customer.ordersCount, 10) || 0,
            totalSpent: parseFloat(customer.totalSpentV2.amount) || 0,
            tags: customer.tags,
            syncedAt: new Date(),
          },
        });

        total++;
      }

      hasNextPage = data.customers.pageInfo.hasNextPage;
      cursor = data.customers.pageInfo.endCursor;

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
