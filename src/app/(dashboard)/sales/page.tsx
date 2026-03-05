"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { DashboardAreaChart } from "@/components/charts/area-chart";
import { DashboardBarChart } from "@/components/charts/bar-chart";
import { useDateRange } from "@/hooks/use-date-range";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrency } from "@/lib/utils/currency";
import { DollarSign, ShoppingCart, RotateCcw } from "lucide-react";
import type { SalesMetrics } from "@/types/dashboard";

export default function SalesPage() {
  const { preset, dateRange, setPreset, queryParams } = useDateRange("last30d");

  const { data, isLoading } = useDashboardData<SalesMetrics>(
    "/api/dashboard/sales",
    queryParams
  );

  const totalRevenue = data?.timeSeries.reduce((s, d) => s + d.revenue, 0) || 0;
  const totalOrders = data?.timeSeries.reduce((s, d) => s + d.orders, 0) || 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Sales</h1>
        <DateRangePicker preset={preset} dateRange={dateRange} onPresetChange={setPreset} />
      </div>

      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : (
        <KpiGrid className="mb-6">
          <KpiCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <KpiCard
            title="Total Orders"
            value={totalOrders.toLocaleString()}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <KpiCard
            title="Refund Rate"
            value={`${data.refundSummary.refundRate.toFixed(1)}%`}
            icon={<RotateCcw className="h-4 w-4" />}
          />
          <KpiCard
            title="Total Refunds"
            value={formatCurrency(data.refundSummary.totalRefunds)}
            icon={<RotateCcw className="h-4 w-4" />}
          />
        </KpiGrid>
      )}

      {data && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Revenue & Orders Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardAreaChart
                data={data.timeSeries}
                xKey="date"
                areas={[
                  { key: "revenue", label: "Revenue", color: "#3b82f6" },
                ]}
                formatY={(v) => `$${(v / 1000).toFixed(0)}K`}
                height={300}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardBarChart
                data={data.channelBreakdown}
                xKey="channel"
                bars={[
                  { key: "revenue", label: "Revenue", color: "#3b82f6" },
                ]}
                formatY={(v) => `$${(v / 1000).toFixed(0)}K`}
                height={300}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
