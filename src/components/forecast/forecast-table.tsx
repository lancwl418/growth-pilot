"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ForecastRow {
  date: string;
  predicted: number;
  actual: number | null;
  deviation: number | null;
  isFuture: boolean;
}

interface ForecastTableProps {
  data: ForecastRow[];
  formatValue?: (value: number) => string;
}

export function ForecastTable({ data, formatValue }: ForecastTableProps) {
  const fmt = formatValue || ((v: number) => v.toFixed(2));

  return (
    <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Predicted</TableHead>
          <TableHead className="text-right">Actual</TableHead>
          <TableHead className="text-right">Deviation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.date} className={row.isFuture ? "bg-blue-50/50" : ""}>
            <TableCell className="font-medium">
              {row.date}
              {row.isFuture && (
                <span className="ml-2 text-xs text-blue-600">(forecast)</span>
              )}
            </TableCell>
            <TableCell className="text-right">{fmt(row.predicted)}</TableCell>
            <TableCell className="text-right">
              {row.actual !== null ? fmt(row.actual) : "-"}
            </TableCell>
            <TableCell
              className={cn(
                "text-right",
                row.deviation !== null && Math.abs(row.deviation) > 20 && "font-medium",
                row.deviation !== null && row.deviation > 20 && "text-green-600",
                row.deviation !== null && row.deviation < -20 && "text-red-600"
              )}
            >
              {row.deviation !== null
                ? `${row.deviation > 0 ? "+" : ""}${row.deviation.toFixed(1)}%`
                : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
