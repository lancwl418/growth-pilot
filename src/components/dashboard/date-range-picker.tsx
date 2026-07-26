"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DatePreset } from "@/lib/utils/date";
import { formatDateRange, formatDateParam } from "@/lib/utils/date";
import type { DateRange } from "@/lib/utils/date";

const presets: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7d", label: "Last 7 Days" },
  { value: "last30d", label: "Last 30 Days" },
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "last90d", label: "Last 90 Days" },
];

interface DateRangePickerProps {
  preset: DatePreset;
  dateRange: DateRange;
  onPresetChange: (preset: DatePreset) => void;
  onCustomRange?: (range: DateRange) => void;
}

export function DateRangePicker({
  preset,
  dateRange,
  onPresetChange,
  onCustomRange,
}: DateRangePickerProps) {
  const handleCustomDate = (which: "start" | "end", value: string) => {
    if (!onCustomRange || !value) return;
    const next: DateRange =
      which === "start"
        ? { startDate: new Date(`${value}T00:00:00`), endDate: dateRange.endDate }
        : { startDate: dateRange.startDate, endDate: new Date(`${value}T23:59:59`) };
    if (next.startDate <= next.endDate) onCustomRange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={preset} onValueChange={(v) => onPresetChange(v as DatePreset)}>
        <SelectTrigger className="w-[150px] sm:w-[180px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
          {onCustomRange && <SelectItem value="custom">Custom</SelectItem>}
        </SelectContent>
      </Select>
      {preset === "custom" && onCustomRange ? (
        <div className="flex items-center gap-1">
          <input
            type="date"
            className="h-9 rounded-md border px-2 text-sm"
            value={formatDateParam(dateRange.startDate)}
            max={formatDateParam(dateRange.endDate)}
            onChange={(e) => handleCustomDate("start", e.target.value)}
          />
          <span className="text-muted-foreground text-sm">–</span>
          <input
            type="date"
            className="h-9 rounded-md border px-2 text-sm"
            value={formatDateParam(dateRange.endDate)}
            min={formatDateParam(dateRange.startDate)}
            onChange={(e) => handleCustomDate("end", e.target.value)}
          />
        </div>
      ) : (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {formatDateRange(dateRange)}
        </span>
      )}
    </div>
  );
}
