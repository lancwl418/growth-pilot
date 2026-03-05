"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DatePreset } from "@/lib/utils/date";
import { formatDateRange } from "@/lib/utils/date";
import type { DateRange } from "@/lib/utils/date";

const presets: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7d", label: "Last 7 Days" },
  { value: "last30d", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "last90d", label: "Last 90 Days" },
];

interface DateRangePickerProps {
  preset: DatePreset;
  dateRange: DateRange;
  onPresetChange: (preset: DatePreset) => void;
}

export function DateRangePicker({
  preset,
  dateRange,
  onPresetChange,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
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
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {formatDateRange(dateRange)}
      </span>
    </div>
  );
}
