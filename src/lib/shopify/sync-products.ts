import { prisma } from "@/lib/prisma";
import { shopifyGraphQL } from "./client";
import { PRODUCTS_QUERY } from "./queries";
import { extractShopifyId, type ShopifyProduct, type ShopifyConnection } from "@/types/shopify";

interface ProductsResponse {
  products: ShopifyConnection<ShopifyProduct>;
}

export async function syncProducts(): Promise<number> {
  let hasNextPage = true;
  let cursor: string | null = null;
  let total = 0;

  const syncLog = await prisma.syncLog.create({
    data: { source: "shopify_products", syncType: "full", status: "running" },
  });

  try {
    while (hasNextPage) {
      const variables: Record<string, unknown> = { first: 50, after: cursor };
      const data = await shopifyGraphQL<ProductsResponse>(PRODUCTS_QUERY, variables);

      for (const edge of data.products.edges) {
        const product = edge.node;
        const shopifyId = extractShopifyId(product.id);

        const dbProduct = await prisma.dimProduct.upsert({
          where: { shopifyId },
          create: {
            shopifyId,
            title: product.title,
            vendor: product.vendor || null,
            productType: product.productType || null,
            tags: product.tags,
            status: product.status.toLowerCase(),
            createdAt: new Date(product.createdAt),
            updatedAt: new Date(product.updatedAt),
          },
          update: {
            title: product.title,
            vendor: product.vendor || null,
            productType: product.productType || null,
            tags: product.tags,
            status: product.status.toLowerCase(),
            updatedAt: new Date(product.updatedAt),
            syncedAt: new Date(),
          },
        });

        // Sync variants
        for (const variantEdge of product.variants.edges) {
          const variant = variantEdge.node;
          const variantShopifyId = extractShopifyId(variant.id);

          await prisma.dimVariant.upsert({
            where: { shopifyId: variantShopifyId },
            create: {
              shopifyId: variantShopifyId,
              productId: dbProduct.id,
              title: variant.title,
              sku: variant.sku,
              price: parseFloat(variant.price),
              compareAtPrice: variant.compareAtPrice
                ? parseFloat(variant.compareAtPrice)
                : null,
              inventoryQty: variant.inventoryQuantity,
            },
            update: {
              title: variant.title,
              sku: variant.sku,
              price: parseFloat(variant.price),
              compareAtPrice: variant.compareAtPrice
                ? parseFloat(variant.compareAtPrice)
                : null,
              inventoryQty: variant.inventoryQuantity,
              syncedAt: new Date(),
            },
          });
        }

        total++;
      }

      hasNextPage = data.products.pageInfo.hasNextPage;
      cursor = data.products.pageInfo.endCursor;

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
