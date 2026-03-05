"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PeriodComparisonProps {
  value: number;
  className?: string;
}

export function PeriodComparison({ value, className }: PeriodComparisonProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const sign = isPositive ? "+" : "";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
        isPositive && "bg-green-50 text-green-700",
        !isPositive && !isNeutral && "bg-red-50 text-red-700",
        isNeutral && "bg-gray-50 text-gray-600",
        className
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {sign}
      {value.toFixed(1)}%
    </div>
  );
}
