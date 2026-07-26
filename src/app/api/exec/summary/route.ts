import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { getOverviewMetrics } from "@/lib/queries/overview";
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * 高管视图(admin-view)只读聚合接口。
 * ?period=mtd(默认,本月至今 vs 上月同期)| last(上月全月 vs 前月全月)
 *        | lifetime(全部历史,无对比)
 * 鉴权走共享 SSO 会话;复用 dashboard 已验证的 getOverviewMetrics。
 */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const period = request.nextUrl.searchParams.get("period") ?? "mtd";
    const now = new Date();
    const fmt = (d: Date) => format(d, "yyyy-MM-dd");

    let start: Date, end: Date;
    let compareStart: string | undefined, compareEnd: string | undefined;
    let monthLabel: string;

    if (period === "last") {
      const lastM = subMonths(now, 1);
      start = startOfMonth(lastM);
      end = endOfMonth(lastM);
      const prevM = subMonths(now, 2);
      compareStart = fmt(startOfMonth(prevM));
      compareEnd = fmt(endOfMonth(prevM));
      monthLabel = format(lastM, "yyyy-MM");
    } else if (period === "lifetime") {
      const min = await prisma.factOrder.aggregate({ _min: { orderDate: true } });
      start = min._min.orderDate ?? now;
      end = now;
      monthLabel = "lifetime";
    } else {
      start = startOfMonth(now);
      end = now;
      const prevNow = subMonths(now, 1);
      compareStart = fmt(startOfMonth(prevNow));
      compareEnd = fmt(prevNow);
      monthLabel = format(now, "yyyy-MM");
    }

    const metrics = await getOverviewMetrics(fmt(start), fmt(end), compareStart, compareEnd);

    return jsonResponse({
      line: "usa",
      period,
      month: monthLabel,
      asOf: now.toISOString(),
      metrics,
    });
  } catch (error) {
    console.error("Exec summary API error:", error);
    return errorResponse("Internal server error", 500);
  }
}
