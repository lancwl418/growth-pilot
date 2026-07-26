const META_API_VERSION = "v21.0";
const META_BASE_URL = "https://graph.facebook.com";

export function isMetaAdsConfigured(): boolean {
  return !!(process.env.META_ADS_ACCESS_TOKEN && process.env.META_ADS_ACCOUNT_ID);
}

interface MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
  adset_name?: string;
  objective?: string;
  date_start: string;
  spend: string;
  impressions: string;
  reach: string;
  inline_link_clicks?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
}

interface MetaApiResponse {
  data: MetaInsightRow[];
  paging?: { cursors?: { after?: string }; next?: string };
}

export async function fetchCampaignInsights(
  startDate: string,
  endDate: string
): Promise<MetaInsightRow[]> {
  const token = process.env.META_ADS_ACCESS_TOKEN!;
  const accountId = process.env.META_ADS_ACCOUNT_ID!;

  const fields = [
    "campaign_id",
    "campaign_name",
    "adset_name",
    "objective",
    "spend",
    "impressions",
    "reach",
    "inline_link_clicks",
    "actions",
    "action_values",
  ].join(",");

  const allRows: MetaInsightRow[] = [];
  let url: string | null =
    `${META_BASE_URL}/${META_API_VERSION}/act_${accountId}/insights` +
    `?fields=${fields}` +
    `&level=campaign` +
    `&time_range=${encodeURIComponent(JSON.stringify({ since: startDate, until: endDate }))}` +
    `&time_increment=1` +
    `&limit=500` +
    `&access_token=${token}`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Meta Ads API error ${res.status}: ${body}`);
    }
    const json: MetaApiResponse = await res.json();
    allRows.push(...json.data);
    url = json.paging?.next || null;
  }

  return allRows;
}

export function parseInsightRow(row: MetaInsightRow) {
  const purchases =
    row.actions?.find(
      (a) =>
        a.action_type === "offsite_conversion.fb_pixel_purchase" ||
        a.action_type === "purchase"
    )?.value || "0";

  const purchaseValue =
    row.action_values?.find(
      (a) =>
        a.action_type === "offsite_conversion.fb_pixel_purchase" ||
        a.action_type === "purchase"
    )?.value || "0";

  // Fan-growth actions: "like" = FB page likes; follow-type actions = IG follows
  const pageLikes = row.actions?.find((a) => a.action_type === "like")?.value || "0";
  const follows =
    row.actions?.find((a) => a.action_type.includes("follow"))?.value || "0";

  return {
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
    adsetName: row.adset_name || null,
    objective: row.objective || null,
    spend: parseFloat(row.spend || "0"),
    impressions: parseInt(row.impressions || "0", 10),
    reach: parseInt(row.reach || "0", 10),
    linkClicks: parseInt(row.inline_link_clicks || "0", 10),
    purchases: parseInt(purchases, 10),
    purchaseValue: parseFloat(purchaseValue),
    follows: parseInt(follows, 10),
    pageLikes: parseInt(pageLikes, 10),
  };
}
