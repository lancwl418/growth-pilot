import { z } from "zod";

export const alertRuleSchema = z.object({
  ruleType: z.string().min(1),
  metric: z.string().min(1),
  operator: z.enum(["gt", "lt"]),
  thresholdPct: z.number().min(1).max(1000),
  comparisonPeriod: z.enum(["yesterday", "same_day_last_week"]),
});

export type AlertRuleInput = z.infer<typeof alertRuleSchema>;
