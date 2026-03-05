"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AlertBadgeProps {
  severity: string;
}

export function AlertBadge({ severity }: AlertBadgeProps) {
  return (
    <Badge
      className={cn(
        "text-xs",
        severity === "critical" && "bg-red-100 text-red-800 hover:bg-red-100",
        severity === "warning" && "bg-amber-100 text-amber-800 hover:bg-amber-100",
        severity === "info" && "bg-blue-100 text-blue-800 hover:bg-blue-100"
      )}
    >
      {severity}
    </Badge>
  );
}
