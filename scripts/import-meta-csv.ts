/**
 * One-off / ad-hoc script: import a Meta Ads Manager CSV export into
 * fact_meta_ads_daily via the same code path the Settings upload button uses.
 *
 * Run with: npx tsx scripts/import-meta-csv.ts "/path/to/export.csv"
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";
import { importMetaAdsCsv } from "../src/lib/meta-ads/csv-import";

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npx tsx scripts/import-meta-csv.ts <csv-path>");
    process.exit(1);
  }

  const text = readFileSync(path, "utf8");
  console.log(`Importing ${path} ...`);
  const result = await importMetaAdsCsv(text);
  console.log(`Rows processed: ${result.recordsProcessed}`);
  if (result.errors.length) {
    console.log(`Warnings (${result.errors.length}):`);
    result.errors.slice(0, 10).forEach((e) => console.log("  - " + e));
  }

  const total = await prisma.factMetaAdsDaily.count();
  const withSpend = await prisma.factMetaAdsDaily.aggregate({
    _sum: { spend: true, purchases: true, purchaseValue: true },
  });
  console.log(`\nfact_meta_ads_daily total rows: ${total}`);
  console.log(
    `Sum spend: ${withSpend._sum.spend}  purchases: ${withSpend._sum.purchases}  purchaseValue: ${withSpend._sum.purchaseValue}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
