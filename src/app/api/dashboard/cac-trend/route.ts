import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { getCacTrend } from "@/lib/queries/cac-trend";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const monthsParam = request.nextUrl.searchParams.get("months");
    const parsed = monthsParam ? parseInt(monthsParam, 10) : 6;
    const months = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 24) : 6;
    const data = await getCacTrend(months);
    return jsonResponse(data);
  } catch (error) {
    console.error("CAC trend API error:", error);
    return errorResponse("Internal server error", 500);
  }
}
