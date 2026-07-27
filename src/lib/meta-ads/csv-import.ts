import { prisma } from "@/lib/prisma";

/**
 * Meta Ads CSV import.
 *
 * Meta's API is not available for this account, so campaign data is loaded by
 * uploading the daily "Campaign name" breakdown exported from Ads Manager.
 * Expected header (order-independent, matched case-insensitively):
 *
 *   Day, Campaign name, Reach, Impressions, Amount spent (USD),
 *   Attribution setting, Link clicks, Purchases, Purchases conversion value,
 *   Facebook Likes, Instagram Follows, Reporting starts, Reporting ends
 *
 * The export has no real campaign id, so the campaign name doubles as the id
 * (the table's unique key is date + campaignId). Re-uploading the same day
 * overwrites (upsert) rather than accumulating.
 */

export interface MetaCsvRow {
  date: Date;
  campaignId: string;
  campaignName: string;
  reach: number;
  impressions: number;
  spend: number;
  linkClicks: number;
  purchases: number;
  purchaseValue: number;
  pageLikes: number;
  follows: number;
}

export interface ParseResult {
  rows: MetaCsvRow[];
  errors: string[];
}

// Normalized (lower-cased) header name -> canonical field key.
const COLUMN_ALIASES: Record<string, string> = {
  "day": "date",
  "date": "date",
  "campaign name": "campaignName",
  "reach": "reach",
  "impressions": "impressions",
  "amount spent (usd)": "spend",
  "amount spent": "spend",
  "link clicks": "linkClicks",
  "purchases": "purchases",
  "purchases conversion value": "purchaseValue",
  "facebook likes": "pageLikes",
  "instagram follows": "follows",
};

/** Parse a single CSV line, honoring double-quoted fields that contain commas. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'; // escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

function toInt(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function toDecimal(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value.replace(/[,$]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function parseMetaAdsCsv(text: string): ParseResult {
  const errors: string[] = [];
  // Strip BOM and split on either line ending.
  const clean = text.replace(/^﻿/, "");
  const lines = clean.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return { rows: [], errors: ["File is empty or has no data rows."] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const colIndex: Partial<Record<string, number>> = {};
  header.forEach((name, idx) => {
    const key = COLUMN_ALIASES[name];
    if (key && colIndex[key] === undefined) colIndex[key] = idx;
  });

  if (colIndex.date === undefined || colIndex.campaignName === undefined) {
    return {
      rows: [],
      errors: [
        'Missing required columns. The file must have "Day" and "Campaign name" columns.',
      ],
    };
  }

  const rows: MetaCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const cell = (key: string) => {
      const idx = colIndex[key];
      return idx === undefined ? undefined : cells[idx];
    };

    const dateStr = cell("date");
    const campaignName = cell("campaignName");

    if (!dateStr || !campaignName) continue; // skip blank/incomplete rows silently

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      errors.push(`Row ${i + 1}: invalid date "${dateStr}", expected YYYY-MM-DD.`);
      continue;
    }

    rows.push({
      date: new Date(`${dateStr}T00:00:00.000Z`),
      campaignId: campaignName,
      campaignName,
      reach: toInt(cell("reach")),
      impressions: toInt(cell("impressions")),
      spend: toDecimal(cell("spend")),
      linkClicks: toInt(cell("linkClicks")),
      purchases: toInt(cell("purchases")),
      purchaseValue: toDecimal(cell("purchaseValue")),
      pageLikes: toInt(cell("pageLikes")),
      follows: toInt(cell("follows")),
    });
  }

  return { rows, errors };
}

export interface ImportResult {
  recordsProcessed: number;
  errors: string[];
}

/** Parse + upsert a Meta Ads CSV, recording a SyncLog entry. */
export async function importMetaAdsCsv(text: string): Promise<ImportResult> {
  const { rows, errors } = parseMetaAdsCsv(text);

  const syncLog = await prisma.syncLog.create({
    data: { source: "meta_ads", syncType: "csv_upload", status: "running" },
  });

  try {
    if (rows.length === 0) {
      const message =
        errors[0] ?? "No valid rows found in the uploaded file.";
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: "failed", completedAt: new Date(), errorMessage: message },
      });
      return { recordsProcessed: 0, errors: errors.length ? errors : [message] };
    }

    for (const row of rows) {
      const { date, campaignId, ...data } = row;
      await prisma.factMetaAdsDaily.upsert({
        where: { date_campaignId: { date, campaignId } },
        create: { date, campaignId, adsetName: null, objective: null, ...data },
        update: { ...data, syncedAt: new Date() },
      });
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        recordsProcessed: rows.length,
        errorMessage: errors.length ? errors.slice(0, 5).join(" ") : null,
      },
    });

    return { recordsProcessed: rows.length, errors };
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}
