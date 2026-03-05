import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { alertRuleSchema } from "@/lib/validators/alert-rules";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const status = request.nextUrl.searchParams.get("status") || undefined;
  const ruleType = request.nextUrl.searchParams.get("ruleType") || undefined;
  const page = parseInt(request.nextUrl.searchParams.get("page") || "0", 10);
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);

  const where = {
    ...(status ? { status } : {}),
    ...(ruleType ? { ruleType } : {}),
  };

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page * limit,
      take: limit,
    }),
    prisma.alert.count({ where }),
  ]);

  return jsonResponse({ alerts, total, page });
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const data = alertRuleSchema.parse(body);

    const rule = await prisma.alertRule.create({
      data: {
        ruleType: data.ruleType,
        metric: data.metric,
        operator: data.operator,
        thresholdPct: data.thresholdPct,
        comparisonPeriod: data.comparisonPeriod,
      },
    });

    return jsonResponse(rule, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Invalid alert rule data", 400);
    }
    console.error("Create alert rule error:", error);
    return errorResponse("Internal server error", 500);
  }
}
