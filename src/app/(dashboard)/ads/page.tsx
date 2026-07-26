"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DashboardLineChart } from "@/components/charts/line-chart";
import { useDateRange } from "@/hooks/use-date-range";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useT } from "@/hooks/use-language";
import { formatCurrency } from "@/lib/utils/currency";
import type { AdsMetric, AdsReport } from "@/types/dashboard";

function MetricGrid({
  items,
}: {
  items: { title: string; metric: AdsMetric; format: (v: number) => string }[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <KpiCard
          key={item.title}
          title={item.title}
          value={item.format(item.metric.value)}
          change={item.metric.change}
        />
      ))}
    </div>
  );
}

const fmtInt = (v: number) => Math.round(v).toLocaleString();
const fmtPct = (v: number) => `${v.toFixed(2)}%`;
const fmtX = (v: number) => `${v.toFixed(2)}x`;

export default function AdsPage() {
  const t = useT();
  const { preset, dateRange, setPreset, setCustomRange, queryParams } =
    useDateRange("thisMonth");

  const { data, isLoading } = useDashboardData<AdsReport>(
    "/api/dashboard/ads-report",
    queryParams
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{t.ads.title}</h1>
          <p className="text-sm text-muted-foreground">{t.ads.subtitle}</p>
        </div>
        <DateRangePicker
          preset={preset}
          dateRange={dateRange}
          onPresetChange={setPreset}
          onCustomRange={setCustomRange}
        />
      </div>

      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : (
        <div className="space-y-6">
          {/* Google */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.ads.googleTitle}</CardTitle>
              <p className="text-xs text-muted-foreground">{t.ads.googleNote}</p>
            </CardHeader>
            <CardContent>
              {data.google ? (
                <MetricGrid
                  items={[
                    { title: t.ads.cost, metric: data.google.cost, format: formatCurrency },
                    { title: t.ads.conversions, metric: data.google.conversions, format: fmtInt },
                    { title: t.ads.convValue, metric: data.google.convValue, format: formatCurrency },
                    { title: t.ads.costPerConv, metric: data.google.costPerConv, format: formatCurrency },
                    { title: t.ads.roas, metric: data.google.roas, format: fmtX },
                    { title: t.ads.avgConvValue, metric: data.google.avgConvValue, format: formatCurrency },
                    { title: t.ads.impressions, metric: data.google.impressions, format: fmtInt },
                    { title: t.ads.clicks, metric: data.google.clicks, format: fmtInt },
                    { title: t.ads.clickConvRate, metric: data.google.clickConvRate, format: fmtPct },
                  ]}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {t.ads.noGoogleData}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Meta conversion campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.ads.metaConversionTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.metaConversion ? (
                <MetricGrid
                  items={[
                    { title: t.ads.amountSpent, metric: data.metaConversion.spend, format: formatCurrency },
                    { title: t.ads.purchases, metric: data.metaConversion.purchases, format: fmtInt },
                    { title: t.ads.purchaseValue, metric: data.metaConversion.purchaseValue, format: formatCurrency },
                    { title: t.ads.costPerPurchase, metric: data.metaConversion.costPerPurchase, format: formatCurrency },
                    { title: t.ads.roas, metric: data.metaConversion.roas, format: fmtX },
                    { title: t.ads.avgPurchase, metric: data.metaConversion.avgPurchaseValue, format: formatCurrency },
                    { title: t.ads.impressions, metric: data.metaConversion.impressions, format: fmtInt },
                    { title: t.ads.linkClicks, metric: data.metaConversion.linkClicks, format: fmtInt },
                    { title: t.ads.ctr, metric: data.metaConversion.ctr, format: fmtPct },
                    { title: t.ads.cpm, metric: data.metaConversion.cpm, format: formatCurrency },
                    { title: t.ads.convRateFromAd, metric: data.metaConversion.convRateFromAd, format: fmtPct },
                  ]}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {t.ads.noMetaData}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Meta fan growth */}
          {data.metaFans && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.ads.metaFansTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium mb-3">{t.ads.igFollowers}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <KpiCard
                        title={t.ads.amountSpent}
                        value={formatCurrency(data.metaFans.instagram.spend)}
                      />
                      <KpiCard
                        title={t.ads.follows}
                        value={fmtInt(data.metaFans.instagram.follows)}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">{t.ads.fbLikes}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <KpiCard
                        title={t.ads.amountSpent}
                        value={formatCurrency(data.metaFans.facebook.spend)}
                      />
                      <KpiCard
                        title={t.ads.likes}
                        value={fmtInt(data.metaFans.facebook.likes)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spend & ROAS trend */}
          {data.trend.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.ads.spendTrend}</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardLineChart
                  data={data.trend.map((p) => ({ ...p }))}
                  xKey="period"
                  lines={[
                    { key: "googleCost", label: `Google ${t.ads.cost}`, color: "#4285F4" },
                    { key: "metaSpend", label: `Meta ${t.ads.amountSpent}`, color: "#0668E1" },
                    { key: "googleRoas", label: "Google ROAS", color: "#F9AB00", dashed: true },
                    { key: "metaRoas", label: "Meta ROAS", color: "#34A853", dashed: true },
                  ]}
                  height={300}
                />
              </CardContent>
            </Card>
          )}

          {/* Free sample repurchase */}
          {data.freeSample && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.ads.freeSampleTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 px-2 font-medium">{t.ads.lifetimeOrders}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.ads.customersCol}</th>
                        <th className="text-right py-3 px-2 font-medium">{t.ads.pctOfTagged}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.freeSample.buckets.map((b) => (
                        <tr key={b.lifetimeOrders} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2.5 px-2 font-medium">{b.lifetimeOrders}</td>
                          <td className="py-2.5 px-2 text-right">{b.customers.toLocaleString()}</td>
                          <td className="py-2.5 px-2 text-right">{b.pct}%</td>
                        </tr>
                      ))}
                      <tr className="font-medium">
                        <td className="py-2.5 px-2">{t.ads.total}</td>
                        <td className="py-2.5 px-2 text-right">
                          {data.freeSample.total.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
