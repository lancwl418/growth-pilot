"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { DashboardLineChart } from "@/components/charts/line-chart";
import { DashboardDonutChart } from "@/components/charts/donut-chart";
import { DashboardBarChart } from "@/components/charts/bar-chart";
import { useDateRange } from "@/hooks/use-date-range";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrency } from "@/lib/utils/currency";
import { Globe, Users, MousePointerClick, TrendingUp, DollarSign, UserPlus } from "lucide-react";
import type { TrafficMetrics } from "@/types/dashboard";

const CHANNEL_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default function TrafficPage() {
  const { preset, dateRange, setPreset, queryParams } = useDateRange("last30d");

  const { data, isLoading } = useDashboardData<TrafficMetrics | null>(
    "/api/dashboard/traffic",
    queryParams
  );

  if (!isLoading && data === null) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Traffic</h1>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">No Traffic Data Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Go to <strong>Settings</strong> and click <strong>Sync GA4 Traffic</strong> to pull in your Google Analytics data. First sync will backfill the last 90 days.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Traffic</h1>
        <DateRangePicker preset={preset} dateRange={dateRange} onPresetChange={setPreset} />
      </div>

      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : (
        <>
          {/* KPI row — the numbers a boss looks at first */}
          <KpiGrid className="mb-6">
            <KpiCard
              title="Sessions"
              value={data.totals.sessions.toLocaleString()}
              icon={<MousePointerClick className="h-4 w-4" />}
            />
            <KpiCard
              title="Conversion Rate"
              value={`${data.totals.conversionRate.toFixed(2)}%`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <KpiCard
              title="Ad Spend"
              value={formatCurrency(data.totals.adSpend)}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <KpiCard
              title="ROAS"
              value={data.totals.adSpend > 0 ? `${data.totals.roas.toFixed(2)}x` : "N/A"}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </KpiGrid>

          {/* Traffic trend — is it growing or shrinking? */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Traffic Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardLineChart
                data={data.timeSeries}
                xKey="date"
                lines={[
                  { key: "sessions", label: "Sessions", color: "#3b82f6" },
                  { key: "users", label: "Users", color: "#10b981" },
                ]}
                height={300}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            {/* Channel split — where is traffic coming from? */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Where Traffic Comes From</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardDonutChart
                  data={data.channelMix.slice(0, 8).map((c, i) => ({
                    name: c.channel,
                    value: c.sessions,
                    color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                  }))}
                />
              </CardContent>
            </Card>

            {/* Channel revenue — which channels make money? */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardBarChart
                  data={data.channelPerformance
                    .filter((c) => c.revenue > 0)
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 8)
                    .map((c) => ({
                      channel: c.channel.length > 15 ? c.channel.slice(0, 15) + "..." : c.channel,
                      revenue: c.revenue,
                    }))}
                  xKey="channel"
                  bars={[{ key: "revenue", label: "Revenue", color: "#10b981" }]}
                  formatY={(v) => `$${(v / 1000).toFixed(0)}K`}
                  height={250}
                />
              </CardContent>
            </Card>
          </div>

          {/* Channel performance table — the detail view */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Channel Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-3 px-2 font-medium">Channel</th>
                      <th className="text-right py-3 px-2 font-medium">Sessions</th>
                      <th className="text-right py-3 px-2 font-medium">Conv. Rate</th>
                      <th className="text-right py-3 px-2 font-medium">Revenue</th>
                      <th className="text-right py-3 px-2 font-medium">Ad Spend</th>
                      <th className="text-right py-3 px-2 font-medium">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.channelPerformance.map((ch) => (
                      <tr key={ch.channel} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 px-2 font-medium">{ch.channel}</td>
                        <td className="py-2.5 px-2 text-right">{ch.sessions.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={ch.conversionRate >= 2 ? "text-green-600 font-medium" : ""}>
                            {ch.conversionRate.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium">
                          {formatCurrency(ch.revenue)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {ch.adSpend > 0 ? formatCurrency(ch.adSpend) : "—"}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {ch.adSpend > 0 ? (
                            <span className={ch.roas >= 3 ? "text-green-600 font-medium" : ch.roas < 1 ? "text-red-500 font-medium" : ""}>
                              {ch.roas.toFixed(2)}x
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
