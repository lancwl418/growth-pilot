import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const logs = await prisma.syncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
    select: {
      id: true,
      source: true,
      syncType: true,
      status: true,
      recordsProcessed: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
    },
  });

  // Summary counts
  const [productCount, customerCount, orderCount] = await Promise.all([
    prisma.dimProduct.count(),
    prisma.dimCustomer.count(),
    prisma.factOrder.count(),
  ]);

  return jsonResponse({
    logs,
    summary: {
      products: productCount,
      customers: customerCount,
      orders: orderCount,
    },
  });
}
