"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface LineConfig {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
}

interface DashboardLineChartProps<T> {
  data: T[];
  xKey: string;
  lines: LineConfig[];
  height?: number;
  showLegend?: boolean;
  formatY?: (value: number) => string;
}

export function DashboardLineChart<T extends Record<string, unknown>>({
  data,
  xKey,
  lines,
  height = 300,
  showLegend = true,
  formatY,
}: DashboardLineChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color}
            strokeWidth={2}
            strokeDasharray={line.dashed ? "5 5" : undefined}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
