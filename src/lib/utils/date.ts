import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subYears,
  format,
} from "date-fns";

export type DatePreset =
  | "today"
  | "yesterday"
  | "last7d"
  | "last30d"
  | "thisMonth"
  | "lastMonth"
  | "last90d"
  | "custom";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function getDateRange(preset: DatePreset, now = new Date()): DateRange {
  switch (preset) {
    case "today":
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
    }
    case "last7d":
      return { startDate: startOfDay(subDays(now, 6)), endDate: endOfDay(now) };
    case "last30d":
      return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now) };
    case "thisMonth":
      return { startDate: startOfMonth(now), endDate: endOfDay(now) };
    case "lastMonth": {
      const lastMonth = subMonths(now, 1);
      return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
    }
    case "last90d":
      return { startDate: startOfDay(subDays(now, 89)), endDate: endOfDay(now) };
    default:
      return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now) };
  }
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const days = Math.ceil(
    (range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return {
    startDate: startOfDay(subDays(range.startDate, days)),
    endDate: endOfDay(subDays(range.startDate, 1)),
  };
}

export function getLastYearPeriod(range: DateRange): DateRange {
  return {
    startDate: subYears(range.startDate, 1),
    endDate: subYears(range.endDate, 1),
  };
}

export function formatDateRange(range: DateRange): string {
  return `${format(range.startDate, "MMM d, yyyy")} - ${format(range.endDate, "MMM d, yyyy")}`;
}

export function formatDateParam(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getWeekRange(now = new Date()): DateRange {
  return {
    startDate: startOfWeek(now, { weekStartsOn: 1 }),
    endDate: endOfDay(now),
  };
}
