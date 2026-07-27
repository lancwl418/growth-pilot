import { prisma } from "@/lib/prisma";
import { paidOrderFilter } from "./common";

/**
 * Product category classification for the executive report's
 * "Revenue by Category" block (DTF / POD / Blanks).
 *
 * Rules (from the business owner):
 *   - Product NAME contains "transfer"/"gang sheet" -> DTF
 *       ...and also contains "free" -> Free Sample
 *   - Product tagged "blank" (or name contains "blank") -> Blanks
 *   - Product is a garment/物品 (POD keywords) -> POD
 *   - Otherwise -> Other
 *
 * Tags in the DB are sparse (many apparel products have empty tags), so the
 * product/line-item TITLE is the primary signal and tags are a fallback.
 */
export type ProductCategory = "DTF" | "POD" | "Blanks" | "Free Sample" | "Other";

export const CATEGORY_ORDER: ProductCategory[] = [
  "DTF",
  "POD",
  "Blanks",
  "Free Sample",
  "Other",
];

// Keywords that appear in garment/物品 product titles or tags.
const POD_KEYWORDS = [
  "t-shirt",
  "tshirt",
  "tee",
  "sweatshirt",
  "tube top",
  "tumbler",
  "yoga pants",
  "tote",
  "shopping bag",
  "polo",
  "hoodie",
  "metal sign",
  "tank top",
  "shorts",
  "cap",
  "phone case",
  "mug",
  "pants",
];

export function categorizeProduct(title: string, tags: string[] = []): ProductCategory {
  const t = (title || "").toLowerCase();
  const tg = tags.map((x) => x.toLowerCase());

  if (t.includes("transfer") || t.includes("gang sheet")) {
    return t.includes("free") ? "Free Sample" : "DTF";
  }
  if (tg.includes("blank") || t.includes("blank")) return "Blanks";
  if (POD_KEYWORDS.some((k) => t.includes(k)) || tg.some((x) => POD_KEYWORDS.some((k) => x.includes(k)))) {
    return "POD";
  }
  return "Other";
}

export interface CategoryRevenue {
  category: ProductCategory;
  revenue: number;
  pct: number;
}

/** Revenue split by product category for paid orders in the given period. */
export async function getCategoryRevenue(
  startDate: string,
  endDate: string
): Promise<CategoryRevenue[]> {
  const items = await prisma.factOrderItem.findMany({
    where: { order: { is: paidOrderFilter(startDate, endDate) } },
    select: {
      title: true,
      price: true,
      quantity: true,
      totalDiscount: true,
      product: { select: { tags: true } },
    },
  });

  const totals = new Map<ProductCategory, number>();
  for (const it of items) {
    const line = Number(it.price) * it.quantity - Number(it.totalDiscount);
    const cat = categorizeProduct(it.title, it.product?.tags ?? []);
    totals.set(cat, (totals.get(cat) || 0) + line);
  }

  const grand = [...totals.values()].reduce((a, b) => a + b, 0);
  return CATEGORY_ORDER.filter((c) => (totals.get(c) || 0) !== 0).map((category) => {
    const revenue = totals.get(category) || 0;
    return {
      category,
      revenue: Number(revenue.toFixed(2)),
      pct: grand > 0 ? Number(((revenue / grand) * 100).toFixed(1)) : 0,
    };
  });
}
