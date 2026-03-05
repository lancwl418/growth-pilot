import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { parseDateRangeParams } from "@/lib/validators/date-range";
import { getProductsMetrics } from "@/lib/queries/products";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const params = parseDateRangeParams(request.nextUrl.searchParams);
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);
    const data = await getProductsMetrics(params.startDate, params.endDate, limit);
    return jsonResponse(data);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Invalid date parameters", 400);
    }
    console.error("Products API error:", error);
    return errorResponse("Internal server error", 500);
  }
}
