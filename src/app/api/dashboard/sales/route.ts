import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { parseDateRangeParams } from "@/lib/validators/date-range";
import { getSalesMetrics } from "@/lib/queries/sales";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const params = parseDateRangeParams(request.nextUrl.searchParams);
    const data = await getSalesMetrics(params.startDate, params.endDate);
    return jsonResponse(data);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Invalid date parameters", 400);
    }
    console.error("Sales API error:", error);
    return errorResponse("Internal server error", 500);
  }
}
