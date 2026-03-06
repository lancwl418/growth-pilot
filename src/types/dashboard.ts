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
    ordersCount: number;
    totalSpent: number;
    lastOrderAt: string | null;
  }[];
}
