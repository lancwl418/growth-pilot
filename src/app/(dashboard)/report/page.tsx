"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DashboardLineChart } from "@/components/charts/line-chart";
import { useDateRange } from "@/hooks/use-date-range";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrency } from "@/lib/utils/currency";
import { Printer } from "lucide-react";
import type { Kpi, ReportData } from "@/types/report";

const money = (v: number) => formatCurrency(v);
const int = (v: number) => Math.round(v).toLocaleString();
const pct = (v: number) => `${v.toFixed(2)}%`;
const roas = (v: number) => `${v.toFixed(2)}x`;

function KpiRow({
  items,
}: {
  items: { title: string; kpi: Kpi; fmt: (v: number) => string }[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((it) => (
        <KpiCard key={it.title} title={it.title} value={it.fmt(it.kpi.value)} change={it.kpi.change} />
      ))}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

const PRINT_CSS = `@media print {
  body * { visibility: hidden; }
  #report-print, #report-print * { visibility: visible; }
  #report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
  .no-print { display: none !important; }
  .report-section { break-inside: avoid; }
}`;

export default function ReportPage() {
  const { preset, dateRange, setPreset, setCustomRange, queryParams } = useDateRange("thisMonth");
  const { data, isLoading } = useDashboardData<ReportData>("/api/report", queryParams);

  return (
    <div id="report-print">
      <style>{PRINT_CSS}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">周期报告 / Report</h1>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.period.startDate} → {data.period.endDate}
              <span className="mx-2">·</span>
              对比上一周期 {data.period.compareStart} → {data.period.compareEnd}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 no-print">
          <DateRangePicker
            preset={preset}
            dateRange={dateRange}
            onPresetChange={setPreset}
            onCustomRange={setCustomRange}
          />
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            导出 PDF
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : (
        <div className="space-y-10">
          {/* ---------------- Shopify — selected period ---------------- */}
          <Section title="Shopify · 本期" subtitle="选定时间段，对比上一周期" >
            <div className="report-section space-y-4">
              <KpiRow
                items={[
                  { title: "Total Revenue 总销售额", kpi: data.shopify.revenue, fmt: money },
                  { title: "Total Orders 总单数", kpi: data.shopify.orders, fmt: int },
                  { title: "Average Order 客单价", kpi: data.shopify.aov, fmt: money },
                  { title: "Conversion Rate 转化率", kpi: data.shopify.conversionRate, fmt: pct },
                  { title: "Total Sessions 总访问量", kpi: data.shopify.sessions, fmt: int },
                  { title: "Refund Rate 退单率", kpi: data.shopify.refundRate, fmt: pct },
                  { title: "Free Sample Rate 免费样品单占比", kpi: data.shopify.freeSampleRate, fmt: pct },
                ]}
              />
              <Card className="report-section">
                <CardHeader>
                  <CardTitle className="text-base">Revenue / Orders / Sessions Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <DashboardLineChart
                    data={data.shopify.trend.map((p) => ({ ...p }))}
                    xKey="date"
                    height={280}
                    lines={[
                      { key: "revenue", label: "Revenue", color: "#2563eb" },
                      { key: "sessions", label: "Sessions", color: "#16a34a" },
                      { key: "orders", label: "Orders", color: "#f59e0b" },
                    ]}
                  />
                </CardContent>
              </Card>
              {data.shopify.categoryRevenue.length > 0 && (
                <Card className="report-section">
                  <CardHeader>
                    <CardTitle className="text-base">Revenue by Category 按品类营收 (DTF / POD / Blanks)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.shopify.categoryRevenue.map((c) => (
                        <div key={c.category} className="flex items-center gap-3">
                          <span className="w-28 text-sm shrink-0">{c.category}</span>
                          <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${c.pct}%` }} />
                          </div>
                          <span className="w-16 text-sm text-right tabular-nums">{c.pct}%</span>
                          <span className="w-24 text-sm text-right text-muted-foreground tabular-nums">{money(c.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </Section>

          {/* ---------------- Shopify — lifetime ---------------- */}
          <Section title="Shopify · 生命周期" subtitle="从开店第一天到本期最后一天（客户级累计）">
            <div className="report-section space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard title="Number of Customers 总顾客数（下过≥1单）" value={int(data.lifetime.customers)} />
                <KpiCard title="Average Lifetime Value 平均LTV" value={money(data.lifetime.avgLtv)} />
                {data.lifetime.freeSampleConversion && (
                  <KpiCard
                    title="Free Sample → Paid 免费样品转化率"
                    value={`${data.lifetime.freeSampleConversion.rate}%`}
                  />
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="report-section">
                  <CardHeader>
                    <CardTitle className="text-base">Lifetime Order Number 下单次数分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Orders</TableHead>
                          <TableHead className="text-right">Customers</TableHead>
                          <TableHead className="text-right">% Customers</TableHead>
                          <TableHead className="text-right">% Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.lifetime.orderNumberDist.map((b) => (
                          <TableRow key={b.bucket}>
                            <TableCell className="font-medium">{b.bucket}</TableCell>
                            <TableCell className="text-right tabular-nums">{int(b.customers)}</TableCell>
                            <TableCell className="text-right tabular-nums">{b.pctCustomers}%</TableCell>
                            <TableCell className="text-right tabular-nums">{b.pctRevenue}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="report-section">
                  <CardHeader>
                    <CardTitle className="text-base">Order Value 客单价分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order Value</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">% Orders</TableHead>
                          <TableHead className="text-right">% Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.lifetime.orderValueDist.map((b) => (
                          <TableRow key={b.bucket}>
                            <TableCell className="font-medium">{b.bucket}</TableCell>
                            <TableCell className="text-right tabular-nums">{int(b.orders)}</TableCell>
                            <TableCell className="text-right tabular-nums">{b.pctOrders}%</TableCell>
                            <TableCell className="text-right tabular-nums">{b.pctRevenue}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Section>

          {/* ---------------- Google ---------------- */}
          <Section title="Google Ads · 本期">
            {data.google ? (
              <div className="report-section">
                <KpiRow
                  items={[
                    { title: "Total Ad Spend 广告费", kpi: data.google.spend, fmt: money },
                    { title: "Total Conversions 转化数", kpi: data.google.conversions, fmt: int },
                    { title: "ROAS 投资回报比", kpi: data.google.roas, fmt: roas },
                    { title: "Conversion Value 转化值", kpi: data.google.convValue, fmt: money },
                    { title: "Impressions 曝光量", kpi: data.google.impressions, fmt: int },
                    { title: "CPM 千展价格", kpi: data.google.cpm, fmt: money },
                    { title: "CTR 点击率", kpi: data.google.ctr, fmt: pct },
                    { title: "Clicks 点击量", kpi: data.google.clicks, fmt: int },
                  ]}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">本期无 Google 广告数据。</p>
            )}
          </Section>

          {/* ---------------- Meta Sales ---------------- */}
          <Section title='Meta · Sales' subtitle='Campaign 名含 "Sales"'>
            {data.metaSales ? (
              <div className="report-section">
                <KpiRow
                  items={[
                    { title: "Total Ad Spend 广告费", kpi: data.metaSales.spend, fmt: money },
                    { title: "Total Conversions 转化数", kpi: data.metaSales.conversions, fmt: int },
                    { title: "ROAS 投资回报比", kpi: data.metaSales.roas, fmt: roas },
                    { title: "Conversion Value 转化值", kpi: data.metaSales.convValue, fmt: money },
                    { title: "Impressions 曝光量", kpi: data.metaSales.impressions, fmt: int },
                    { title: "CPM 千展价格", kpi: data.metaSales.cpm, fmt: money },
                    { title: "CTR 点击率", kpi: data.metaSales.ctr, fmt: pct },
                    { title: "Clicks 点击量", kpi: data.metaSales.clicks, fmt: int },
                  ]}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">本期无 Meta Sales 数据。</p>
            )}
          </Section>

          {/* ---------------- Meta IG & FB ---------------- */}
          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Meta · IG" subtitle='Campaign 名含 "IG"'>
              {data.metaIg ? (
                <div className="report-section grid grid-cols-3 gap-4">
                  <KpiCard title="Ad Spend 广告费" value={money(data.metaIg.spend.value)} change={data.metaIg.spend.change} />
                  <KpiCard title="IG Profile Visits 主页访问*" value={int(data.metaIg.profileVisits.value)} change={data.metaIg.profileVisits.change} />
                  <KpiCard title="IG Followers 涨粉" value={int(data.metaIg.followers.value)} change={data.metaIg.followers.change} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">本期无 Meta IG 数据。</p>
              )}
            </Section>

            <Section title="Meta · FB" subtitle='Campaign 名含 "FB"'>
              {data.metaFb ? (
                <div className="report-section grid grid-cols-2 gap-4">
                  <KpiCard title="Ad Spend 广告费" value={money(data.metaFb.spend.value)} change={data.metaFb.spend.change} />
                  <KpiCard title="Facebook Likes 点赞" value={int(data.metaFb.likes.value)} change={data.metaFb.likes.change} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">本期无 Meta FB 数据。</p>
              )}
            </Section>
          </div>

          <p className="text-xs text-muted-foreground no-print">
            * IG 主页访问用 Meta CSV 中的 link clicks 近似代替（导出无该列）。
          </p>
        </div>
      )}
    </div>
  );
}
