import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { getReport } from "@/lib/queries/report";
import { differenceInCalendarDays, subDays, format } from "date-fns";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const sp = request.nextUrl.searchParams;
  const startDate = sp.get("startDate");
  const endDate = sp.get("endDate");

  if (!startDate || !endDate || !DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return errorResponse("startDate and endDate (YYYY-MM-DD) are required", 400);
  }
  if (startDate > endDate) {
    return errorResponse("startDate must be on or before endDate", 400);
  }

  // Auto-derive the immediately preceding period of equal length.
  const lengthDays = differenceInCalendarDays(new Date(endDate), new Date(startDate));
  const compareEnd = format(subDays(new Date(startDate), 1), "yyyy-MM-dd");
  const compareStart = format(subDays(new Date(startDate), lengthDays + 1), "yyyy-MM-dd");

  try {
    const data = await getReport(startDate, endDate, compareStart, compareEnd);
    return jsonResponse(data);
  } catch (error) {
    console.error("Report API error:", error);
    return errorResponse("Internal server error", 500);
  }
}
