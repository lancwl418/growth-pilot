import { z } from "zod";

export const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  compareStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  compareEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type DateRangeParams = z.infer<typeof dateRangeSchema>;

export function parseDateRangeParams(searchParams: URLSearchParams) {
  return dateRangeSchema.parse({
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
    compareStart: searchParams.get("compareStart") || undefined,
    compareEnd: searchParams.get("compareEnd") || undefined,
  });
}
