"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface AreaConfig {
  key: string;
  label: string;
  color: string;
  stackId?: string;
}

interface DashboardAreaChartProps<T> {
  data: T[];
  xKey: string;
  areas: AreaConfig[];
  height?: number;
  showLegend?: boolean;
  formatY?: (value: number) => string;
}

export function DashboardAreaChart<T extends Record<string, unknown>>({
  data,
  xKey,
  areas,
  height = 300,
  showLegend = true,
  formatY,
}: DashboardAreaChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            name={area.label}
            stroke={area.color}
            fill={area.color}
            fillOpacity={0.1}
            stackId={area.stackId}
            strokeWidth={2}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
