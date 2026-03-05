import { NextRequest } from "next/server";
import { evaluateAlerts } from "@/lib/alerts/engine";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const alerts = await evaluateAlerts();
    return jsonResponse({
      success: true,
      alertsGenerated: alerts.length,
      alerts: alerts.map((a) => ({ ruleType: a.ruleType, title: a.title, severity: a.severity })),
    });
  } catch (error) {
    console.error("Alert evaluation failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Alert evaluation failed",
      500
    );
  }
}
