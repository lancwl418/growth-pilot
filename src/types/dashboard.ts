export interface OverviewMetrics {
  revenue: number;
  orders: number;
  aov: number;
  sessions: number | null;
  cr: number | null;
  comparison: {
    revenue: number | null;
    orders: number | null;
    aov: number | null;
    sessions: number | null;
    cr: number | null;
  };
  sparklines: {
    revenue: number[];
    orders: number[];
  };
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  timeSeries: { date: string; revenue: number; orders: number }[];
  channelBreakdown: { channel: string; revenue: number; orders: number }[];
  refundSummary: {
    totalRefunds: number;
    refundCount: number;
    refundRate: number;
  };
}

export interface TrafficMetrics {
  totals: {
    sessions: number;
    users: number;
    newUsers: number;
    engagementRate: number;
    conversionRate: number;
    revenue: number;
    adSpend: number;
    roas: number;
  };
  timeSeries: { date: string; sessions: number; users: number }[];
  channelMix: { channel: string; sessions: number; percentage: number }[];
  channelPerformance: {
    channel: string;
    sessions: number;
    users: number;
    engagementRate: number;
    conversionRate: number;
    revenue: number;
    adSpend: number;
    roas: number;
  }[];
  topSources: { source: string; sessions: number; users: number }[];
}

export interface ProductMetric {
  id: string;
  title: string;
  vendor: string | null;
  revenue: number;
  unitsSold: number;
  orders: number;
}

export interface ProductsMetrics {
  topProducts: ProductMetric[];
  productTrends: { date: string; productId: string; title: string; revenue: number }[];
}

export interface AdCampaignRow {
  platform: string;
  campaignName: string;
  spend: number;
  purchases: number;
  purchaseValue: number;
  roas: number;
  impressions: number;
  reach: number | null;
  linkClicks: number;
  ctr: number;
  cpm: number;
}

export interface AdSummary {
  campaigns: AdCampaignRow[];
  platformTotals: {
    platform: string;
    spend: number;
    purchases: number;
    purchaseValue: number;
    roas: number;
    impressions: number;
    reach: number | null;
    linkClicks: number;
    ctr: number;
    cpm: number;
  }[];
  grandTotal: {
    spend: number;
    purchases: number;
    purchaseValue: number;
    roas: number;
    impressions: number;
    linkClicks: number;
    ctr: number;
    cpm: number;
  };
}

export interface ShopifySummary {
  totalSales: number;
  numberOfSales: number;
  avgOrderSpend: number;
  lowFreqSales: number;
  lowFreqCount: number;
  lowFreqAvgOrderSpend: number;
  totalAdSpend: number;
  lowFreqRoas: number;
}

export interface ChannelQualityRow {
  channel: string;
  newCustomers: number;
  repeatCustomers: number;
  repeatRate: number; // percentage 0-100
  avgLtv: number;
  totalLtv: number;
}

export interface ChannelQuality {
  channels: ChannelQualityRow[];
  totals: {
    newCustomers: number;
    repeatRate: number; // overall percentage 0-100
    avgLtv: number;
    bestChannel: string | null; // channel with the highest total LTV
  };
}

export interface CacTrendPoint {
  month: string; // YYYY-MM
  adSpend: number;
  newCustomers: number;
  cac: number; // adSpend / newCustomers (0 when no new customers)
}

export interface FunnelData {
  sessions: number | null; // null when no GA4 data
  firstOrders: number;
  repeatInPeriod: number;
  visitToOrder: number | null; // percentage; null when sessions is null
  orderToRepeat: number; // percentage
}

export interface CustomerMetrics {
  newVsReturning: {
    newCustomers: number;
    returningCustomers: number;
    newRevenue: number;
    returningRevenue: number;
  };
  repeatRate: {
    days30: number;
    days60: number;
    days90: number;
  };
  topCustomers: {
    id: string;
    shopifyId: string;
    name: string;
    ordersCount: number;
    totalSpent: number;
    avgOrderValue: number;
    avgDaysBetweenOrders: number | null;
    lastOrderAt: string | null;
  }[];
}

// ============ Ads Report (per-platform performance page) ============

export interface AdsMetric {
  value: number;
  change: number | null; // % vs comparison period; null when no comparison
}

export interface GoogleAdsBlock {
  cost: AdsMetric;
  conversions: AdsMetric;
  convValue: AdsMetric;
  costPerConv: AdsMetric;
  roas: AdsMetric;
  avgConvValue: AdsMetric;
  impressions: AdsMetric;
  clicks: AdsMetric;
  clickConvRate: AdsMetric;
}

export interface MetaConversionBlock {
  spend: AdsMetric;
  purchases: AdsMetric;
  purchaseValue: AdsMetric;
  costPerPurchase: AdsMetric;
  roas: AdsMetric;
  avgPurchaseValue: AdsMetric;
  impressions: AdsMetric;
  linkClicks: AdsMetric;
  ctr: AdsMetric;
  cpm: AdsMetric;
  convRateFromAd: AdsMetric;
}

export interface MetaFanBlock {
  instagram: { spend: number; follows: number };
  facebook: { spend: number; likes: number };
}

export interface AdsTrendPoint {
  period: string; // bucket label (day or ISO week start)
  googleCost: number;
  googleRoas: number;
  metaSpend: number;
  metaRoas: number;
}

export interface FreeSampleBucket {
  lifetimeOrders: string; // "1".."5", "6+"
  customers: number;
  pct: number;
}

export interface AdsReport {
  google: GoogleAdsBlock | null;
  metaConversion: MetaConversionBlock | null;
  metaFans: MetaFanBlock | null;
  trend: AdsTrendPoint[];
  freeSample: { total: number; buckets: FreeSampleBucket[] } | null;
}
