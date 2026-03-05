"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface BarConfig {
  key: string;
  label: string;
  color: string;
  stackId?: string;
}

interface DashboardBarChartProps<T> {
  data: T[];
  xKey: string;
  bars: BarConfig[];
  height?: number;
  showLegend?: boolean;
  formatY?: (value: number) => string;
}

export function DashboardBarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  bars,
  height = 300,
  showLegend = true,
  formatY,
}: DashboardBarChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatY}
        />
        <Tooltip content={<ChartTooltip formatValue={formatY} />} />
        {showLegend && <Legend />}
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.label}
            fill={bar.color}
            stackId={bar.stackId}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
