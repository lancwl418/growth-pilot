import { Prisma } from "@prisma/client";

export function dateFilter(startDate: string, endDate: string): Prisma.FactOrderWhereInput {
  return {
    orderDate: {
      gte: new Date(`${startDate}T00:00:00.000Z`),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    },
  };
}

export function paidOrderFilter(startDate: string, endDate: string): Prisma.FactOrderWhereInput {
  return {
    ...dateFilter(startDate, endDate),
    financialStatus: { in: ["paid", "partially_refunded"] },
    cancelledAt: null,
  };
}

export function ga4DateFilter(startDate: string, endDate: string): Prisma.FactGa4DailyWhereInput {
  return {
    date: {
      gte: new Date(`${startDate}T00:00:00.000Z`),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    },
  };
}
