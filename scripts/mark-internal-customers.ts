/**
 * One-off script: mark internal/test customers in dim_customers so they are
 * excluded from customer/marketing analytics.
 *
 * Run with: npx tsx scripts/mark-internal-customers.ts
 *
 * Add more emails to INTERNAL_EMAILS below as the internal team grows.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashEmail } from "../src/lib/utils/hash";

// Plain-text internal/test emails. Hashes are computed at runtime.
const INTERNAL_EMAILS = [
  "lancwl418@gmail.com",
];

async function main() {
  const hashes = INTERNAL_EMAILS.map((email) => ({ email, hash: hashEmail(email) }));

  console.log(`Marking ${hashes.length} internal email(s) as is_internal = true...`);

  let totalUpdated = 0;
  for (const { email, hash } of hashes) {
    const result = await prisma.dimCustomer.updateMany({
      where: { emailHash: hash },
      data: { isInternal: true },
    });
    totalUpdated += result.count;
    console.log(`  ${email} -> matched ${result.count} customer row(s)`);
  }

  console.log(`Done. ${totalUpdated} customer row(s) marked internal.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
