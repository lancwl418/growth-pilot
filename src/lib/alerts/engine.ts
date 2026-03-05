import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { format } from "date-fns";
import { getSeverity } from "./rules";
import { sendAlertEmail } from "./notify";

interface AlertResult {
  ruleType: string;
  title: string;
  message: string;
  severity: string;
  metricValue: number;
  thresholdValue: number;
}

export async function evaluateAlerts(): Promise<AlertResult[]> {
  const rules = await prisma.alertRule.findMany({
    where: { enabled: true },
  });

  const alerts: AlertResult[] = [];
  const yesterday = subDays(new Date(), 1);
  const yesterdayStr = format(yesterday, "yyyy-MM-dd");

  for (const rule of rules) {
    try {
      const result = await evaluateRule({
        ...rule,
        thresholdPct: Number(rule.thresholdPct),
      }, yesterdayStr);
      if (result) {
        alerts.push(result);

        // Save alert to DB
        const dbAlert = await prisma.alert.create({
          data: {
            ruleType: result.ruleType,
            severity: result.severity,
            title: result.title,
            message: result.message,
            metricValue: result.metricValue,
            thresholdValue: result.thresholdValue,
            comparisonPeriod: rule.comparisonPeriod,
          },
        });

        // Send notification
        try {
          await sendAlertEmail(dbAlert);
          await prisma.alert.update({
            where: { id: dbAlert.id },
            data: { notifiedAt: new Date() },
          });
        } catch (notifyError) {
          console.error("Failed to send alert notification:", notifyError);
        }
      }
    } catch (error) {
      console.error(`Failed to evaluate rule ${rule.ruleType}:`, error);
    }
  }

  return alerts;
}

async function evaluateRule(
  rule: { ruleType: string; metric: string; operator: string; thresholdPct: number; comparisonPeriod: string },
  targetDate: string
): Promise<AlertResult | null> {
  const target = new Date(`${targetDate}T00:00:00.000Z`);
  const comparisonDate = rule.comparisonPeriod === "yesterday"
    ? subDays(target, 1)
    : subDays(target, 7);

  const currentValue = await getMetricValue(rule.metric, target);
  const comparisonValue = await getMetricValue(rule.metric, comparisonDate);

  if (comparisonValue === null || currentValue === null) return null;
  if (comparisonValue === 0) return null;

  const percentChange = ((currentValue - comparisonValue) / comparisonValue) * 100;

  // Check if the change exceeds threshold
  const isTriggered =
    rule.metric === "revenue" || rule.metric === "conversion_rate" || rule.metric === "sessions"
      ? // For drops: negative change exceeding threshold
        (rule.ruleType.includes("drop") && percentChange < -Number(rule.thresholdPct)) ||
        // For spikes: positive change exceeding threshold
        (rule.ruleType.includes("spike") && percentChange > Number(rule.thresholdPct))
      : Math.abs(percentChange) > Number(rule.thresholdPct);

  if (!isTriggered) return null;

  const direction = percentChange > 0 ? "increased" : "decreased";
  const severity = getSeverity(percentChange, Number(rule.thresholdPct));

  return {
    ruleType: rule.ruleType,
    title: `${rule.metric.replace(/_/g, " ")} ${direction} by ${Math.abs(percentChange).toFixed(1)}%`,
    message: `${rule.metric.replace(/_/g, " ")} ${direction} from ${comparisonValue.toFixed(2)} to ${currentValue.toFixed(2)} (${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%) compared to ${rule.comparisonPeriod.replace(/_/g, " ")}.`,
    severity,
    metricValue: currentValue,
    thresholdValue: Number(rule.thresholdPct),
  };
}

async function getMetricValue(metric: string, date: Date): Promise<number | null> {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  switch (metric) {
    case "revenue": {
      const agg = await prisma.factOrder.aggregate({
        where: {
          orderDate: { gte: startOfDay, lte: endOfDay },
          financialStatus: { in: ["paid", "partially_refunded"] },
          cancelledAt: null,
        },
        _sum: { totalPrice: true },
      });
      return Number(agg._sum.totalPrice || 0);
    }
    case "sessions": {
      const agg = await prisma.factGa4Daily.aggregate({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        _sum: { sessions: true },
      });
      return agg._sum.sessions || null;
    }
    case "conversion_rate": {
      const orders = await prisma.factOrder.count({
        where: {
          orderDate: { gte: startOfDay, lte: endOfDay },
          financialStatus: { in: ["paid", "partially_refunded"] },
          cancelledAt: null,
        },
      });
      const sessionsAgg = await prisma.factGa4Daily.aggregate({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        _sum: { sessions: true },
      });
      const sessions = sessionsAgg._sum.sessions;
      if (!sessions || sessions === 0) return null;
      return (orders / sessions) * 100;
    }
    default:
      return null;
  }
}
