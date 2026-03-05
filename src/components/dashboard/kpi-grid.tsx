"use client";

import { cn } from "@/lib/utils";

interface KpiGridProps {
  children: React.ReactNode;
  className?: string;
}

export function KpiGrid({ children, className }: KpiGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
