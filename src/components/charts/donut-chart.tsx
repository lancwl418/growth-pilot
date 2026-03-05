"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface DonutData {
  name: string;
  value: number;
  color: string;
}

interface DashboardDonutChartProps {
  data: DonutData[];
  height?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
}

export function DashboardDonutChart({
  data,
  height = 250,
  showLegend = true,
  formatValue,
}: DashboardDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => {
            const num = Number(value);
            return formatValue ? formatValue(num) : num.toLocaleString();
          }}
        />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
}
