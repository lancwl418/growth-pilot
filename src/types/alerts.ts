export interface AlertData {
  id: string;
  ruleType: string;
  severity: string;
  title: string;
  message: string;
  metricValue: number | null;
  thresholdValue: number | null;
  comparisonPeriod: string | null;
  status: string;
  notifiedAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface AlertRuleData {
  id: string;
  ruleType: string;
  metric: string;
  operator: string;
  thresholdPct: number;
  comparisonPeriod: string;
  enabled: boolean;
}
