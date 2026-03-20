import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { parseDateRangeParams } from "@/lib/validators/date-range";
import { getAdSummary } from "@/lib/queries/ad-summary";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const params = parseDateRangeParams(request.nextUrl.searchParams);
    const data = await getAdSummary(params.startDate, params.endDate);
    return jsonResponse(data);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Invalid date parameters", 400);
    }
    console.error("Ad summary API error:", error);
    return errorResponse("Internal server error", 500);
  }
}
