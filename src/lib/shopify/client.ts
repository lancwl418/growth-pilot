const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-01";

interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
  extensions?: {
    cost: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}

export async function shopifyGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (response.status === 429) {
      const retryAfter = parseFloat(response.headers.get("Retry-After") || "2");
      await sleep(retryAfter * 1000);
      retries++;
      continue;
    }

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors?.length) {
      const throttled = result.errors.some((e) =>
        e.message.includes("Throttled")
      );
      if (throttled && retries < maxRetries) {
        await sleep(2000);
        retries++;
        continue;
      }
      throw new Error(`Shopify GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`);
    }

    // Check if we're running low on query cost budget
    const available = result.extensions?.cost?.throttleStatus?.currentlyAvailable;
    if (available !== undefined && available < 100) {
      await sleep(1000);
    }

    return result.data;
  }

  throw new Error("Max retries exceeded for Shopify API");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
