"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";
import { PeriodComparison } from "./period-comparison";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number | null;
  sparklineData?: number[];
  icon?: React.ReactNode;
  className?: string;
}

export function KpiCard({
  title,
  value,
  change,
  sparklineData,
  icon,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && change !== null && (
              <PeriodComparison value={change} className="mt-1" />
            )}
          </div>
          {sparklineData && sparklineData.length > 1 && (
            <Sparkline data={sparklineData} className="h-10 w-20" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
