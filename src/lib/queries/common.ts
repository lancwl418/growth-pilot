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

// 排除内部测试客户的订单。用于所有客户/营销分析。
// 注意:customerId 为 null 的订单(游客)保留——它们不是内部账号。
export function excludeInternalFilter(): Prisma.FactOrderWhereInput {
  return {
    OR: [
      { customerId: null },
      { customer: { is: { isInternal: false } } },
    ],
  };
}

// 营销分析专用订单 filter:已付款订单 + 排除内部测试客户。
// 不要改动 paidOrderFilter(其它页面仍在用,避免回归)。
export function marketingOrderFilter(startDate: string, endDate: string): Prisma.FactOrderWhereInput {
  return { ...paidOrderFilter(startDate, endDate), ...excludeInternalFilter() };
}

export function ga4DateFilter(startDate: string, endDate: string): Prisma.FactGa4DailyWhereInput {
  return {
    date: {
      gte: new Date(`${startDate}T00:00:00.000Z`),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    },
  };
}
