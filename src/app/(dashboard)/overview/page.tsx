"use client";

import { DollarSign, ShoppingCart, TrendingUp, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { DashboardLineChart } from "@/components/charts/line-chart";
import { useDateRange } from "@/hooks/use-date-range";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrency } from "@/lib/utils/currency";
import type { OverviewMetrics } from "@/types/dashboard";

export default function OverviewPage() {
  const { preset, dateRange, setPreset, queryParams } = useDateRange("last30d");

  const { data, isLoading } = useDashboardData<OverviewMetrics>(
    "/api/dashboard/overview",
    queryParams
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <DateRangePicker
          preset={preset}
          dateRange={dateRange}
          onPresetChange={setPreset}
        />
      </div>

      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : (
        <KpiGrid>
          <KpiCard
            title="Revenue"
            value={formatCurrency(data.revenue)}
            change={data.comparison.revenue}
            sparklineData={data.sparklines.revenue}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <KpiCard
            title="Orders"
            value={data.orders.toLocaleString()}
            change={data.comparison.orders}
            sparklineData={data.sparklines.orders}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <KpiCard
            title="AOV"
            value={formatCurrency(data.aov)}
            change={data.comparison.aov}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KpiCard
            title={data.cr !== null ? "Conversion Rate" : "Sessions"}
            value={
              data.cr !== null
                ? `${data.cr.toFixed(2)}%`
                : data.sessions !== null
                  ? data.sessions.toLocaleString()
                  : "No GA4 data"
            }
            change={data.cr !== null ? data.comparison.cr : data.comparison.sessions}
            icon={<Globe className="h-4 w-4" />}
          />
        </KpiGrid>
      )}

      {data && data.sparklines.revenue.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardLineChart
              data={data.sparklines.revenue.map((v, i) => ({
                day: `Day ${i + 1}`,
                revenue: v,
              }))}
              xKey="day"
              lines={[{ key: "revenue", label: "Revenue", color: "#3b82f6" }]}
              formatY={(v) => `$${(v / 1000).toFixed(0)}K`}
              height={300}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
