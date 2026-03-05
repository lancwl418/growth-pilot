"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { DashboardDonutChart } from "@/components/charts/donut-chart";
import { CustomersTable } from "@/components/tables/customers-table";
import { useDateRange } from "@/hooks/use-date-range";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrency } from "@/lib/utils/currency";
import { UserPlus, UserCheck, Repeat } from "lucide-react";
import type { CustomerMetrics } from "@/types/dashboard";

export default function CustomersPage() {
  const { preset, dateRange, setPreset, queryParams } = useDateRange("last30d");

  const { data, isLoading } = useDashboardData<CustomerMetrics>(
    "/api/dashboard/customers",
    queryParams
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <DateRangePicker preset={preset} dateRange={dateRange} onPresetChange={setPreset} />
      </div>

      {isLoading || !data ? (
        <MetricSkeletonGrid />
      ) : (
        <>
          <KpiGrid className="mb-6">
            <KpiCard
              title="New Customers"
              value={data.newVsReturning.newCustomers.toLocaleString()}
              icon={<UserPlus className="h-4 w-4" />}
            />
            <KpiCard
              title="Returning Customers"
              value={data.newVsReturning.returningCustomers.toLocaleString()}
              icon={<UserCheck className="h-4 w-4" />}
            />
            <KpiCard
              title="Repeat Rate (30d)"
              value={`${data.repeatRate.days30.toFixed(1)}%`}
              icon={<Repeat className="h-4 w-4" />}
            />
            <KpiCard
              title="Repeat Rate (90d)"
              value={`${data.repeatRate.days90.toFixed(1)}%`}
              icon={<Repeat className="h-4 w-4" />}
            />
          </KpiGrid>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New vs Returning (Orders)</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardDonutChart
                  data={[
                    { name: "New", value: data.newVsReturning.newCustomers, color: "#3b82f6" },
                    { name: "Returning", value: data.newVsReturning.returningCustomers, color: "#10b981" },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New vs Returning (Revenue)</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardDonutChart
                  data={[
                    { name: "New", value: data.newVsReturning.newRevenue, color: "#3b82f6" },
                    { name: "Returning", value: data.newVsReturning.returningRevenue, color: "#10b981" },
                  ]}
                  formatValue={(v) => formatCurrency(v)}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomersTable data={data.topCustomers} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
