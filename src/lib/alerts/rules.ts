export interface AlertRuleConfig {
  ruleType: string;
  metric: string;
  operator: "gt" | "lt";
  thresholdPct: number;
  comparisonPeriod: "yesterday" | "same_day_last_week";
  description: string;
}

export const DEFAULT_ALERT_RULES: AlertRuleConfig[] = [
  {
    ruleType: "revenue_drop",
    metric: "revenue",
    operator: "gt",
    thresholdPct: 20,
    comparisonPeriod: "same_day_last_week",
    description: "Revenue dropped more than 20% vs same day last week",
  },
  {
    ruleType: "cr_drop",
    metric: "conversion_rate",
    operator: "gt",
    thresholdPct: 15,
    comparisonPeriod: "yesterday",
    description: "Conversion rate dropped more than 15% vs yesterday",
  },
  {
    ruleType: "sessions_drop",
    metric: "sessions",
    operator: "gt",
    thresholdPct: 30,
    comparisonPeriod: "same_day_last_week",
    description: "Sessions dropped more than 30% vs same day last week",
  },
  {
    ruleType: "sessions_spike",
    metric: "sessions",
    operator: "gt",
    thresholdPct: 50,
    comparisonPeriod: "same_day_last_week",
    description: "Sessions spiked more than 50% vs same day last week",
  },
  {
    ruleType: "product_spike",
    metric: "product_sales",
    operator: "gt",
    thresholdPct: 100,
    comparisonPeriod: "same_day_last_week",
    description: "Individual product sales spiked more than 100%",
  },
];

export function getSeverity(percentChange: number, threshold: number): string {
  const ratio = Math.abs(percentChange) / threshold;
  if (ratio >= 2) return "critical";
  if (ratio >= 1.5) return "warning";
  return "info";
}
