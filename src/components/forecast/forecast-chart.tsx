"use client";

import { DashboardLineChart } from "@/components/charts/line-chart";

interface ForecastPoint {
  date: string;
  predicted: number;
  actual: number | null;
  isFuture: boolean;
}

interface ForecastChartProps {
  data: ForecastPoint[];
  formatY?: (value: number) => string;
}

export function ForecastChart({ data, formatY }: ForecastChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    predicted: d.predicted,
    actual: d.actual ?? undefined,
  }));

  return (
    <DashboardLineChart
      data={chartData}
      xKey="date"
      lines={[
        { key: "actual", label: "Actual", color: "#3b82f6" },
        { key: "predicted", label: "Predicted", color: "#f59e0b", dashed: true },
      ]}
      formatY={formatY}
      height={350}
    />
  );
}
