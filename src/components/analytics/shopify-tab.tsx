"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DashboardAreaChart } from "@/components/charts/area-chart";
import { DashboardBarChart } from "@/components/charts/bar-chart";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useT } from "@/hooks/use-language";
import { formatCurrency } from "@/lib/utils/currency";
import { DollarSign, ShoppingCart, RotateCcw, Users } from "lucide-react";
import type { SalesMetrics, ShopifySummary } from "@/types/dashboard";

interface ShopifyTabProps {
  queryParams: Record<string, string>;
}

export function ShopifyTab({ queryParams }: ShopifyTabProps) {
  const t = useT();
  const { data, isLoading } = useDashboardData<SalesMetrics>(
    "/api/dashboard/sales",
    queryParams
  );
  const { data: summary } = useDashboardData<ShopifySummary>(
    "/api/dashboard/shopify-summary",
    queryParams
  );

  const totalRevenue = data?.totalRevenue || 0;
  const totalOrders = data?.totalOrders || 0;

  return (
    <div>
      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : (
        <KpiGrid className="mb-6">
          <KpiCard
            title={t.sales.totalRevenue}
            value={formatCurrency(totalRevenue)}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <KpiCard
            title={t.sales.totalOrders}
            value={totalOrders.toLocaleString()}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <KpiCard
            title={t.sales.refundRate}
            value={`${data.refundSummary.refundRate.toFixed(1)}%`}
            icon={<RotateCcw className="h-4 w-4" />}
          />
          <KpiCard
            title={t.sales.totalRefunds}
            value={formatCurrency(data.refundSummary.totalRefunds)}
            icon={<RotateCcw className="h-4 w-4" />}
          />
        </KpiGrid>
      )}

      {data && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{t.sales.revenueOrdersOverTime}</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardAreaChart
                data={data.timeSeries}
                xKey="date"
                areas={[
                  { key: "revenue", label: t.common.revenue, color: "#3b82f6" },
                ]}
                formatY={(v) => `$${(v / 1000).toFixed(0)}K`}
                height={300}
              />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{t.sales.revenueByChannel}</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardBarChart
                data={data.channelBreakdown}
                xKey="channel"
                bars={[
                  { key: "revenue", label: t.common.revenue, color: "#3b82f6" },
                ]}
                formatY={(v) => `$${(v / 1000).toFixed(0)}K`}
                height={300}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Customer Purchase Frequency Analysis */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.analytics.customerAnalysis}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-1">{t.analytics.totalSales}</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalSales)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-1">{t.analytics.numberOfSales}</p>
                <p className="text-xl font-bold">{summary.numberOfSales.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-1">{t.analytics.avgOrderSpend}</p>
                <p className="text-xl font-bold">{formatCurrency(summary.avgOrderSpend)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-1">{t.common.adSpend}</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalAdSpend)}</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t.analytics.lowFreqBuyers}
            </h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="rounded-lg border p-4 bg-blue-50/50">
                <p className="text-xs text-muted-foreground mb-1">{t.analytics.lowFreqSales}</p>
                <p className="text-xl font-bold">{formatCurrency(summary.lowFreqSales)}</p>
              </div>
              <div className="rounded-lg border p-4 bg-blue-50/50">
                <p className="text-xs text-muted-foreground mb-1">{t.analytics.lowFreqCount}</p>
                <p className="text-xl font-bold">{summary.lowFreqCount.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4 bg-blue-50/50">
                <p className="text-xs text-muted-foreground mb-1">{t.analytics.lowFreqAvgSpend}</p>
                <p className="text-xl font-bold">{formatCurrency(summary.lowFreqAvgOrderSpend)}</p>
              </div>
              <div className="rounded-lg border p-4 bg-blue-50/50">
                <p className="text-xs text-muted-foreground mb-1">{t.analytics.lowFreqRoas}</p>
                <p className="text-xl font-bold">
                  {summary.totalAdSpend > 0 ? `${summary.lowFreqRoas.toFixed(2)}x` : t.common.na}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
