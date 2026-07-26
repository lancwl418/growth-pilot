import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { getOverviewMetrics } from "@/lib/queries/overview";
import { format, startOfMonth, subMonths } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * 高管视图(admin-view)只读聚合接口:本月至今 vs 上月同期。
 * 鉴权走共享 SSO 会话(admin-view 服务端转发用户 cookie),
 * 复用 dashboard 已验证的 getOverviewMetrics,不引入新逻辑。
 */
export async function GET() {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const now = new Date();
    const start = startOfMonth(now);
    const prevNow = subMonths(now, 1);
    const prevStart = startOfMonth(prevNow);

    const metrics = await getOverviewMetrics(
      format(start, "yyyy-MM-dd"),
      format(now, "yyyy-MM-dd"),
      format(prevStart, "yyyy-MM-dd"),
      format(prevNow, "yyyy-MM-dd"),
    );

    return jsonResponse({
      line: "usa",
      month: format(now, "yyyy-MM"),
      asOf: now.toISOString(),
      metrics,
    });
  } catch (error) {
    console.error("Exec summary API error:", error);
    return errorResponse("Internal server error", 500);
  }
}
