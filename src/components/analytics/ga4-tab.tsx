"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { DashboardLineChart } from "@/components/charts/line-chart";
import { DashboardDonutChart } from "@/components/charts/donut-chart";
import { DashboardBarChart } from "@/components/charts/bar-chart";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useT } from "@/hooks/use-language";
import { formatCurrency } from "@/lib/utils/currency";
import { Globe, MousePointerClick, TrendingUp, DollarSign } from "lucide-react";
import type { TrafficMetrics, AdSummary } from "@/types/dashboard";

const CHANNEL_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

interface Ga4TabProps {
  queryParams: Record<string, string>;
}

export function Ga4Tab({ queryParams }: Ga4TabProps) {
  const t = useT();
  const { data, isLoading } = useDashboardData<TrafficMetrics | null>(
    "/api/dashboard/traffic",
    queryParams
  );
  const { data: adData } = useDashboardData<AdSummary | null>(
    "/api/dashboard/ad-summary",
    queryParams
  );

  if (!isLoading && data === null) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium mb-2">{t.analytics.noAdData}</h2>
          <p
            className="text-muted-foreground max-w-md mx-auto"
            dangerouslySetInnerHTML={{ __html: t.analytics.noAdDataDesc }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : (
        <>
          <KpiGrid className="mb-6">
            <KpiCard
              title={t.common.sessions}
              value={data.totals.sessions.toLocaleString()}
              icon={<MousePointerClick className="h-4 w-4" />}
            />
            <KpiCard
              title={t.common.conversionRate}
              value={`${data.totals.conversionRate.toFixed(2)}%`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <KpiCard
              title={t.common.adSpend}
              value={formatCurrency(data.totals.adSpend)}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <KpiCard
              title={t.common.roas}
              value={data.totals.adSpend > 0 ? `${data.totals.roas.toFixed(2)}x` : t.common.na}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </KpiGrid>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{t.traffic.trafficTrend}</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardLineChart
                data={data.timeSeries}
                xKey="date"
                lines={[
                  { key: "sessions", label: t.common.sessions, color: "#3b82f6" },
                  { key: "users", label: t.common.users, color: "#10b981" },
                ]}
                height={300}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.traffic.whereFrom}</CardTitle>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.traffic.revenueByChannel}</CardTitle>
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
                  bars={[{ key: "revenue", label: t.common.revenue, color: "#10b981" }]}
                  formatY={(v) => `$${(v / 1000).toFixed(0)}K`}
                  height={250}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{t.traffic.channelPerformance}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-3 px-2 font-medium">{t.traffic.channel}</th>
                      <th className="text-right py-3 px-2 font-medium">{t.common.sessions}</th>
                      <th className="text-right py-3 px-2 font-medium">{t.traffic.convRate}</th>
                      <th className="text-right py-3 px-2 font-medium">{t.common.revenue}</th>
                      <th className="text-right py-3 px-2 font-medium">{t.common.adSpend}</th>
                      <th className="text-right py-3 px-2 font-medium">{t.common.roas}</th>
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

          {/* Ad Performance by Platform & Campaign */}
          {adData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.analytics.adPerformance}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 px-2 font-medium">{t.analytics.platform}</th>
                        <th className="text-left py-3 px-2 font-medium">{t.analytics.campaign}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.analytics.spend}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.analytics.purchases}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.analytics.purchaseValue}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.common.roas}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.analytics.impressions}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.analytics.reach}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.analytics.linkClicks}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.analytics.ctr}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.analytics.cpm}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adData.platformTotals.map((pt) => (
                        <>
                          {/* Platform subtotal row */}
                          <tr key={`total-${pt.platform}`} className="bg-gray-50 font-semibold border-b">
                            <td className="py-2.5 px-2" colSpan={2}>{pt.platform}</td>
                            <td className="py-2.5 px-2 text-right">{formatCurrency(pt.spend)}</td>
                            <td className="py-2.5 px-2 text-right">{pt.purchases.toLocaleString()}</td>
                            <td className="py-2.5 px-2 text-right">{formatCurrency(pt.purchaseValue)}</td>
                            <td className="py-2.5 px-2 text-right">
                              <span className={pt.roas >= 3 ? "text-green-600" : pt.roas < 1 ? "text-red-500" : ""}>
                                {pt.spend > 0 ? `${pt.roas.toFixed(2)}x` : "—"}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-right">{pt.impressions.toLocaleString()}</td>
                            <td className="py-2.5 px-2 text-right">{pt.reach !== null ? pt.reach.toLocaleString() : "—"}</td>
                            <td className="py-2.5 px-2 text-right">{pt.linkClicks.toLocaleString()}</td>
                            <td className="py-2.5 px-2 text-right">{pt.ctr.toFixed(2)}%</td>
                            <td className="py-2.5 px-2 text-right">{formatCurrency(pt.cpm)}</td>
                          </tr>
                          {/* Campaign rows under this platform */}
                          {adData.campaigns
                            .filter((c) => c.platform === pt.platform)
                            .map((c) => (
                              <tr key={`${c.platform}-${c.campaignName}`} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="py-2.5 px-2 pl-6 text-muted-foreground text-xs">↳</td>
                                <td className="py-2.5 px-2 max-w-[200px] truncate">{c.campaignName}</td>
                                <td className="py-2.5 px-2 text-right">{formatCurrency(c.spend)}</td>
                                <td className="py-2.5 px-2 text-right">{c.purchases.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right">{formatCurrency(c.purchaseValue)}</td>
                                <td className="py-2.5 px-2 text-right">
                                  <span className={c.roas >= 3 ? "text-green-600 font-medium" : c.roas < 1 ? "text-red-500 font-medium" : ""}>
                                    {c.spend > 0 ? `${c.roas.toFixed(2)}x` : "—"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-right">{c.impressions.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right">{c.reach !== null ? c.reach.toLocaleString() : "—"}</td>
                                <td className="py-2.5 px-2 text-right">{c.linkClicks.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right">{c.ctr.toFixed(2)}%</td>
                                <td className="py-2.5 px-2 text-right">{formatCurrency(c.cpm)}</td>
                              </tr>
                            ))}
                        </>
                      ))}
                      {/* Grand total */}
                      <tr className="bg-gray-100 font-bold border-t-2">
                        <td className="py-3 px-2" colSpan={2}>{t.analytics.total}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(adData.grandTotal.spend)}</td>
                        <td className="py-3 px-2 text-right">{adData.grandTotal.purchases.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(adData.grandTotal.purchaseValue)}</td>
                        <td className="py-3 px-2 text-right">
                          {adData.grandTotal.spend > 0 ? `${adData.grandTotal.roas.toFixed(2)}x` : "—"}
                        </td>
                        <td className="py-3 px-2 text-right">{adData.grandTotal.impressions.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">—</td>
                        <td className="py-3 px-2 text-right">{adData.grandTotal.linkClicks.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">{adData.grandTotal.ctr.toFixed(2)}%</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(adData.grandTotal.cpm)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
