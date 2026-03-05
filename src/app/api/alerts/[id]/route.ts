import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!["acknowledged", "dismissed"].includes(status)) {
      return errorResponse("Invalid status. Must be 'acknowledged' or 'dismissed'", 400);
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status,
        acknowledgedAt: status === "acknowledged" ? new Date() : undefined,
      },
    });

    return jsonResponse(alert);
  } catch (error) {
    console.error("Update alert error:", error);
    return errorResponse("Alert not found or update failed", 404);
  }
}
