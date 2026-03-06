import { BetaAnalyticsDataClient } from "@google-analytics/data";

export function isGa4Configured(): boolean {
  return !!(process.env.GA4_PROPERTY_ID && process.env.GA4_CREDENTIALS_JSON);
}

let _client: BetaAnalyticsDataClient | null = null;

export function getGa4Client(): BetaAnalyticsDataClient {
  if (!_client) {
    const credentials = JSON.parse(
      Buffer.from(process.env.GA4_CREDENTIALS_JSON!, "base64").toString()
    );
    _client = new BetaAnalyticsDataClient({ credentials });
  }
  return _client;
}

export function getGa4PropertyId(): string {
  return process.env.GA4_PROPERTY_ID || "";
}
