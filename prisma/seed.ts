import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const DEFAULT_ALERT_RULES = [
  {
    ruleType: "revenue_drop",
    metric: "revenue",
    operator: "gt",
    thresholdPct: 20,
    comparisonPeriod: "same_day_last_week",
  },
  {
    ruleType: "cr_drop",
    metric: "conversion_rate",
    operator: "gt",
    thresholdPct: 15,
    comparisonPeriod: "yesterday",
  },
  {
    ruleType: "sessions_drop",
    metric: "sessions",
    operator: "gt",
    thresholdPct: 30,
    comparisonPeriod: "same_day_last_week",
  },
  {
    ruleType: "sessions_spike",
    metric: "sessions",
    operator: "gt",
    thresholdPct: 50,
    comparisonPeriod: "same_day_last_week",
  },
];

async function main() {
  console.log("Seeding default alert rules...");

  for (const rule of DEFAULT_ALERT_RULES) {
    const existing = await prisma.alertRule.findFirst({
      where: { ruleType: rule.ruleType },
    });

    if (!existing) {
      await prisma.alertRule.create({ data: rule });
      console.log(`  Created rule: ${rule.ruleType}`);
    } else {
      console.log(`  Skipped (exists): ${rule.ruleType}`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
