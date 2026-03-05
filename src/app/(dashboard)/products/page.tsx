"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { DashboardBarChart } from "@/components/charts/bar-chart";
import { ProductsTable } from "@/components/tables/products-table";
import { useDateRange } from "@/hooks/use-date-range";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrency } from "@/lib/utils/currency";
import { Package, Hash } from "lucide-react";
import type { ProductsMetrics } from "@/types/dashboard";

export default function ProductsPage() {
  const { preset, dateRange, setPreset, queryParams } = useDateRange("last30d");

  const { data, isLoading } = useDashboardData<ProductsMetrics>(
    "/api/dashboard/products",
    queryParams
  );

  const totalProducts = data?.topProducts.length || 0;
  const totalUnits = data?.topProducts.reduce((s, p) => s + p.unitsSold, 0) || 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <DateRangePicker preset={preset} dateRange={dateRange} onPresetChange={setPreset} />
      </div>

      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : (
        <>
          <KpiGrid className="mb-6">
            <KpiCard
              title="Active Products"
              value={totalProducts.toString()}
              icon={<Package className="h-4 w-4" />}
            />
            <KpiCard
              title="Total Units Sold"
              value={totalUnits.toLocaleString()}
              icon={<Hash className="h-4 w-4" />}
            />
          </KpiGrid>

          {data.topProducts.length > 0 && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Top Products by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <DashboardBarChart
                    data={data.topProducts.slice(0, 10).map((p) => ({
                      name: p.title.length > 25 ? p.title.slice(0, 25) + "..." : p.title,
                      revenue: p.revenue,
                    }))}
                    xKey="name"
                    bars={[{ key: "revenue", label: "Revenue", color: "#8b5cf6" }]}
                    formatY={(v) => formatCurrency(v)}
                    height={300}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductsTable data={data.topProducts} />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
