"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { DashboardLineChart } from "@/components/charts/line-chart";
import { useDateRange } from "@/hooks/use-date-range";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useT } from "@/hooks/use-language";
import { formatCurrency } from "@/lib/utils/currency";
import { MousePointerClick, ShoppingCart, Repeat, ArrowRight } from "lucide-react";
import type { FunnelData, CacTrendPoint } from "@/types/dashboard";

function ConversionArrow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-4 text-center shrink-0">
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
      <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value.toFixed(2)}%</span>
    </div>
  );
}

function FunnelStage({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="flex-1 min-w-[160px]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function FunnelPage() {
  const t = useT();
  const { preset, dateRange, setPreset, queryParams } = useDateRange("last30d");

  const { data, isLoading } = useDashboardData<FunnelData>(
    "/api/dashboard/funnel",
    queryParams
  );
  const { data: cac } = useDashboardData<CacTrendPoint[]>("/api/dashboard/cac-trend", {
    months: "6",
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{t.funnel.title}</h1>
          <p className="text-sm text-muted-foreground">{t.funnel.subtitle}</p>
        </div>
        <DateRangePicker preset={preset} dateRange={dateRange} onPresetChange={setPreset} />
      </div>

      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : (
        <>
          {/* Funnel stages */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-stretch gap-2">
                {data.sessions !== null && (
                  <>
                    <FunnelStage
                      title={t.funnel.sessions}
                      value={data.sessions.toLocaleString()}
                      icon={<MousePointerClick className="h-4 w-4" />}
                    />
                    <ConversionArrow
                      label={t.funnel.visitToOrder}
                      value={data.visitToOrder ?? 0}
                    />
                  </>
                )}
                <FunnelStage
                  title={t.funnel.firstOrders}
                  value={data.firstOrders.toLocaleString()}
                  icon={<ShoppingCart className="h-4 w-4" />}
                />
                <ConversionArrow label={t.funnel.orderToRepeat} value={data.orderToRepeat} />
                <FunnelStage
                  title={t.funnel.repeat}
                  value={data.repeatInPeriod.toLocaleString()}
                  icon={<Repeat className="h-4 w-4" />}
                />
              </div>
              {data.sessions === null && (
                <p className="mt-4 text-xs text-muted-foreground">{t.funnel.noGa4}</p>
              )}
            </CardContent>
          </Card>

          {/* CAC trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.funnel.cacTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              {cac && cac.length > 0 ? (
                <>
                  <DashboardLineChart
                    data={cac.map((p) => ({ month: p.month, cac: Number(p.cac.toFixed(2)) }))}
                    xKey="month"
                    lines={[{ key: "cac", label: t.funnel.cac, color: "#3b82f6" }]}
                    formatY={(v) => formatCurrency(v)}
                    showLegend={false}
                    height={260}
                  />
                  <p className="mt-3 text-xs text-muted-foreground">{t.funnel.metaDisclosure}</p>
                </>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">{t.funnel.noData}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
