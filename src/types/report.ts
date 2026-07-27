import type { CategoryRevenue } from "@/lib/queries/product-category";

/** A metric value with its previous-period counterpart and % change. */
export interface Kpi {
  value: number;
  prev: number | null;
  change: number | null; // percent change vs previous period
}

export interface ReportTrendPoint {
  date: string; // "MMM dd"
  revenue: number;
  orders: number;
  sessions: number;
}

export interface ShopifyPeriodBlock {
  revenue: Kpi;
  orders: Kpi;
  aov: Kpi;
  conversionRate: Kpi; // %
  sessions: Kpi;
  refundRate: Kpi; // %
  freeSampleRate: Kpi; // % of orders with total = 0
  trend: ReportTrendPoint[];
  categoryRevenue: CategoryRevenue[];
}

export interface OrderNumberBucket {
  bucket: string; // "1".."6+"
  customers: number;
  pctCustomers: number;
  pctRevenue: number;
}

export interface OrderValueBucket {
  bucket: string; // "<$10", ...
  orders: number;
  pctOrders: number;
  pctRevenue: number;
}

export interface ShopifyLifetimeBlock {
  customers: number; // placed >= 1 order
  avgLtv: number;
  orderNumberDist: OrderNumberBucket[];
  freeSampleConversion: { total: number; paid: number; rate: number } | null;
  orderValueDist: OrderValueBucket[];
}

/** Shared shape for Google + Meta "Sales" conversion blocks. */
export interface AdBlock {
  spend: Kpi;
  conversions: Kpi;
  roas: Kpi;
  convValue: Kpi;
  impressions: Kpi;
  cpm: Kpi; // spend / impressions * 1000
  ctr: Kpi; // clicks / impressions * 100
  clicks: Kpi;
}

export interface MetaIgBlock {
  spend: Kpi;
  profileVisits: Kpi; // proxied by link clicks (not in the CSV export)
  followers: Kpi;
}

export interface MetaFbBlock {
  spend: Kpi;
  likes: Kpi;
}

export interface ReportData {
  period: {
    startDate: string;
    endDate: string;
    compareStart: string;
    compareEnd: string;
  };
  shopify: ShopifyPeriodBlock;
  lifetime: ShopifyLifetimeBlock;
  google: AdBlock | null;
  metaSales: AdBlock | null;
  metaIg: MetaIgBlock | null;
  metaFb: MetaFbBlock | null;
}
