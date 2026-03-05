// Shopify GraphQL API response types

export interface ShopifyConnection<T> {
  edges: {
    node: T;
    cursor: string;
  }[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface ShopifyProduct {
  id: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  variants: ShopifyConnection<ShopifyVariant>;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number | null;
}

export interface ShopifyCustomer {
  id: string;
  email: string | null;
  ordersCount: string;
  totalSpentV2: { amount: string };
  tags: string[];
  createdAt: string;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  orderNumber: number;
  createdAt: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  subtotalPriceSet: { shopMoney: { amount: string } };
  totalDiscountsSet: { shopMoney: { amount: string } };
  totalTaxSet: { shopMoney: { amount: string } };
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  cancelledAt: string | null;
  tags: string[];
  landingSite: string | null;
  referringSite: string | null;
  sourceName: string;
  customer: { id: string; email: string | null } | null;
  lineItems: ShopifyConnection<ShopifyLineItem>;
  refunds: ShopifyRefund[];
}

export interface ShopifyLineItem {
  id: string;
  title: string;
  variantTitle: string | null;
  quantity: number;
  originalUnitPriceSet: { shopMoney: { amount: string } };
  totalDiscountSet: { shopMoney: { amount: string } };
  vendor: string | null;
  sku: string | null;
  product: { id: string } | null;
  variant: { id: string } | null;
}

export interface ShopifyRefund {
  id: string;
  totalRefundedSet: { shopMoney: { amount: string } };
}

// Extract numeric ID from Shopify GID
export function extractShopifyId(gid: string): string {
  return gid.split("/").pop() || gid;
}
