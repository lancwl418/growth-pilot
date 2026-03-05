import { createHmac } from "crypto";

export function verifyShopifyWebhook(
  body: string,
  hmacHeader: string
): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return false;

  const hash = createHmac("sha256", secret).update(body, "utf8").digest("base64");
  return hash === hmacHeader;
}
