"use client";

import { useState, useCallback, useMemo } from "react";
import { type DatePreset, type DateRange, getDateRange, getPreviousPeriod, formatDateParam } from "@/lib/utils/date";

export type CompareMode = "none" | "previousPeriod" | "lastYear";

interface UseDateRangeReturn {
  preset: DatePreset;
  dateRange: DateRange;
  compareMode: CompareMode;
  comparisonRange: DateRange | null;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (range: DateRange) => void;
  setCompareMode: (mode: CompareMode) => void;
  queryParams: Record<string, string>;
}

export function useDateRange(defaultPreset: DatePreset = "last30d"): UseDateRangeReturn {
  const [preset, setPresetState] = useState<DatePreset>(defaultPreset);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [compareMode, setCompareMode] = useState<CompareMode>("previousPeriod");

  const dateRange = useMemo(() => {
    if (preset === "custom" && customRange) return customRange;
    return getDateRange(preset);
  }, [preset, customRange]);

  const comparisonRange = useMemo(() => {
    if (compareMode === "none") return null;
    return getPreviousPeriod(dateRange);
  }, [compareMode, dateRange]);

  const setPreset = useCallback((p: DatePreset) => {
    setPresetState(p);
    if (p !== "custom") setCustomRange(null);
  }, []);

  const handleSetCustomRange = useCallback((range: DateRange) => {
    setPresetState("custom");
    setCustomRange(range);
  }, []);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      startDate: formatDateParam(dateRange.startDate),
      endDate: formatDateParam(dateRange.endDate),
    };
    if (comparisonRange) {
      params.compareStart = formatDateParam(comparisonRange.startDate);
      params.compareEnd = formatDateParam(comparisonRange.endDate);
    }
    return params;
  }, [dateRange, comparisonRange]);

  return {
    preset,
    dateRange,
    compareMode,
    comparisonRange,
    setPreset,
    setCustomRange: handleSetCustomRange,
    setCompareMode,
    queryParams,
  };
}
