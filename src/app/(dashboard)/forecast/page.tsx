"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ForecastChart } from "@/components/forecast/forecast-chart";
import { ForecastTable } from "@/components/forecast/forecast-table";
import { AlertBadge } from "@/components/alerts/alert-badge";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrency } from "@/lib/utils/currency";
import { TrendingUp } from "lucide-react";

interface ForecastData {
  forecasts: {
    date: string;
    predicted: number;
    actual: number | null;
    deviation: number | null;
    isFuture: boolean;
  }[];
  deviationAlerts: {
    date: string;
    deviation: number;
  }[];
  metric: string;
}

export default function ForecastPage() {
  const [metric, setMetric] = useState("revenue");

  const { data, isLoading } = useDashboardData<ForecastData>(
    "/api/dashboard/forecast",
    { metric }
  );

  const formatY = metric === "revenue"
    ? (v: number) => `$${(v / 1000).toFixed(0)}K`
    : (v: number) => v.toFixed(0);

  const formatVal = metric === "revenue"
    ? (v: number) => formatCurrency(v)
    : (v: number) => v.toLocaleString();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Forecast</h1>
          {data && data.deviationAlerts.length > 0 && (
            <AlertBadge severity="warning" />
          )}
        </div>
      </div>

      <Tabs value={metric} onValueChange={setMetric}>
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value={metric} className="mt-4">
          {isLoading || !data ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : data.forecasts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-medium mb-2">No Forecast Data</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Forecasts will be generated daily after order data is synced.
                  Run the initial Shopify sync first.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {metric === "revenue" ? "Revenue" : "Orders"} Forecast vs Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ForecastChart data={data.forecasts} formatY={formatY} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Forecast Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <ForecastTable data={data.forecasts} formatValue={formatVal} />
                </CardContent>
              </Card>

              {data.deviationAlerts.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg text-amber-700">
                      Deviation Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.deviationAlerts.map((alert) => (
                        <li
                          key={alert.date}
                          className="text-sm text-muted-foreground"
                        >
                          <span className="font-medium">{alert.date}</span>: Actual
                          deviated{" "}
                          <span
                            className={
                              alert.deviation > 0 ? "text-green-600" : "text-red-600"
                            }
                          >
                            {alert.deviation > 0 ? "+" : ""}
                            {alert.deviation.toFixed(1)}%
                          </span>{" "}
                          from prediction
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
