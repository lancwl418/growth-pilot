import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const [lastSync, activeAlerts] = await Promise.all([
    prisma.syncLog.findFirst({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { source: true, completedAt: true, recordsProcessed: true },
    }),
    prisma.alert.count({ where: { status: "active" } }),
  ]);

  return jsonResponse({
    lastSync: lastSync
      ? {
          source: lastSync.source,
          completedAt: lastSync.completedAt?.toISOString(),
          records: lastSync.recordsProcessed,
        }
      : null,
    activeAlerts,
  });
}
