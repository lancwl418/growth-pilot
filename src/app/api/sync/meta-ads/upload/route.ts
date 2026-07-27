import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/utils/api-helpers";
import { importMetaAdsCsv } from "@/lib/meta-ads/csv-import";

// Uploaded by a logged-in user from Settings, so this uses session auth
// (unlike the cron-protected /api/sync/meta-ads API sync).
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return errorResponse("No file uploaded. Attach a CSV as the \"file\" field.", 400);
    }

    const name = (file as File).name?.toLowerCase() ?? "";
    if (name && !name.endsWith(".csv")) {
      return errorResponse("Please upload a .csv file exported from Meta Ads Manager.", 400);
    }

    const text = await (file as File).text();
    const result = await importMetaAdsCsv(text);

    if (result.recordsProcessed === 0) {
      return errorResponse(result.errors[0] ?? "No valid rows found in the file.", 400);
    }

    return jsonResponse({
      success: true,
      recordsProcessed: result.recordsProcessed,
      warnings: result.errors,
    });
  } catch (error) {
    console.error("Meta Ads CSV upload failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Upload failed",
      500
    );
  }
}
