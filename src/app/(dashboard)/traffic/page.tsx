"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { DashboardLineChart } from "@/components/charts/line-chart";
import { DashboardDonutChart } from "@/components/charts/donut-chart";
import { DataTable, type Column } from "@/components/tables/data-table";
import { useDateRange } from "@/hooks/use-date-range";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Globe, Users, MousePointerClick } from "lucide-react";
import type { TrafficMetrics } from "@/types/dashboard";

const CHANNEL_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

const sourceColumns: Column<Record<string, unknown>>[] = [
  { key: "source", label: "Source / Medium", sortable: true },
  { key: "sessions", label: "Sessions", sortable: true, align: "right" },
  { key: "users", label: "Users", sortable: true, align: "right" },
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
            <h2 className="text-lg font-medium mb-2">GA4 Not Configured</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              To see traffic data, configure your GA4 API credentials in the environment variables
              (GA4_PROPERTY_ID and GA4_CREDENTIALS_JSON).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSessions = data?.timeSeries.reduce((s, d) => s + d.sessions, 0) || 0;
  const totalUsers = data?.timeSeries.reduce((s, d) => s + d.users, 0) || 0;

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
          <KpiGrid className="mb-6">
            <KpiCard
              title="Sessions"
              value={totalSessions.toLocaleString()}
              icon={<MousePointerClick className="h-4 w-4" />}
            />
            <KpiCard
              title="Users"
              value={totalUsers.toLocaleString()}
              icon={<Users className="h-4 w-4" />}
            />
          </KpiGrid>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Sessions Over Time</CardTitle>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Channel Mix</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardDonutChart
                  data={data.channelMix.map((c, i) => ({
                    name: c.channel,
                    value: c.sessions,
                    color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={data.topSources as unknown as Record<string, unknown>[]}
                  columns={sourceColumns}
                  pageSize={8}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
