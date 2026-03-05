// GA4 Data API client scaffold
// This will be activated once GA4 credentials are configured

export function isGa4Configured(): boolean {
  return !!(process.env.GA4_PROPERTY_ID && process.env.GA4_CREDENTIALS_JSON);
}

export function getGa4PropertyId(): string {
  return process.env.GA4_PROPERTY_ID || "";
}

// The actual GA4 client will use @google-analytics/data
// import { BetaAnalyticsDataClient } from "@google-analytics/data";
//
// To initialize:
// const credentials = JSON.parse(
//   Buffer.from(process.env.GA4_CREDENTIALS_JSON!, "base64").toString()
// );
// const client = new BetaAnalyticsDataClient({ credentials });
