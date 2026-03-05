import { NextRequest } from "next/server";
import { generateForecasts } from "@/lib/forecast/engine";
import { requireCronSecret, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const count = await generateForecasts();
    return jsonResponse({ success: true, forecastsGenerated: count });
  } catch (error) {
    console.error("Forecast generation failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Forecast generation failed",
      500
    );
  }
}
