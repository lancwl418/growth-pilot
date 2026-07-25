"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { DashboardBarChart } from "@/components/charts/bar-chart";
import { useDateRange } from "@/hooks/use-date-range";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useT } from "@/hooks/use-language";
import { formatCurrency } from "@/lib/utils/currency";
import { UserPlus, Repeat, DollarSign, Award } from "lucide-react";
import type { ChannelQuality } from "@/types/dashboard";

function repeatRateClass(rate: number): string {
  if (rate >= 20) return "text-green-600 font-medium";
  if (rate < 10) return "text-red-500 font-medium";
  return "";
}

export default function ChannelsPage() {
  const t = useT();
  const { preset, dateRange, setPreset, queryParams } = useDateRange("last30d");

  const { data, isLoading } = useDashboardData<ChannelQuality>(
    "/api/dashboard/channel-quality",
    queryParams
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{t.channels.title}</h1>
          <p className="text-sm text-muted-foreground">{t.channels.subtitle}</p>
        </div>
        <DateRangePicker preset={preset} dateRange={dateRange} onPresetChange={setPreset} />
      </div>

      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : data.channels.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {t.channels.noData}
          </CardContent>
        </Card>
      ) : (
        <>
          <KpiGrid className="mb-6">
            <KpiCard
              title={t.channels.totalNewCustomers}
              value={data.totals.newCustomers.toLocaleString()}
              icon={<UserPlus className="h-4 w-4" />}
            />
            <KpiCard
              title={t.channels.overallRepeatRate}
              value={`${data.totals.repeatRate.toFixed(1)}%`}
              icon={<Repeat className="h-4 w-4" />}
            />
            <KpiCard
              title={t.channels.avgLtv}
              value={formatCurrency(data.totals.avgLtv)}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <KpiCard
              title={t.channels.bestChannel}
              value={data.totals.bestChannel ?? t.common.na}
              icon={<Award className="h-4 w-4" />}
            />
          </KpiGrid>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{t.channels.repeatRateByChannel}</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardBarChart
                data={data.channels.map((c) => ({
                  channel: c.channel.length > 18 ? c.channel.slice(0, 18) + "…" : c.channel,
                  repeatRate: Number(c.repeatRate.toFixed(1)),
                }))}
                xKey="channel"
                bars={[{ key: "repeatRate", label: t.channels.repeatRate, color: "#10b981" }]}
                formatY={(v) => `${v}%`}
                showLegend={false}
                height={260}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.channels.tableTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-3 px-2 font-medium">{t.channels.channel}</th>
                      <th className="text-right py-3 px-2 font-medium">{t.channels.newCustomers}</th>
                      <th className="text-right py-3 px-2 font-medium">{t.channels.repeatRate}</th>
                      <th className="text-right py-3 px-2 font-medium">{t.channels.avgLtvCol}</th>
                      <th className="text-right py-3 px-2 font-medium">{t.channels.totalLtv}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.channels.map((c) => (
                      <tr key={c.channel} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 px-2 font-medium">{c.channel}</td>
                        <td className="py-2.5 px-2 text-right">{c.newCustomers.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={repeatRateClass(c.repeatRate)}>
                            {c.repeatRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">{formatCurrency(c.avgLtv)}</td>
                        <td className="py-2.5 px-2 text-right font-medium">
                          {formatCurrency(c.totalLtv)}
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
