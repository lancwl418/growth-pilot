import { prisma } from "@/lib/prisma";
import { paidOrderFilter } from "./common";
import { subDays } from "date-fns";
import type { CustomerMetrics } from "@/types/dashboard";

export async function getCustomerMetrics(
  startDate: string,
  endDate: string
): Promise<CustomerMetrics> {
  const end = new Date(`${endDate}T23:59:59.999Z`);

  // New vs returning in the date range
  // A "new" customer: their first order is within the date range
  // A "returning" customer: they had orders before the start date
  const ordersInRange = await prisma.factOrder.findMany({
    where: paidOrderFilter(startDate, endDate),
    select: {
      customerId: true,
      totalPrice: true,
    },
  });

  const customerIds = [...new Set(ordersInRange.filter((o) => o.customerId).map((o) => o.customerId!))];

  let newCustomers = 0;
  let returningCustomers = 0;
  let newRevenue = 0;
  let returningRevenue = 0;

  if (customerIds.length > 0) {
    const customers = await prisma.dimCustomer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, firstOrderAt: true },
    });

    const customerFirstOrderMap = new Map(
      customers.map((c) => [c.id, c.firstOrderAt])
    );

    const rangeStart = new Date(`${startDate}T00:00:00.000Z`);

    for (const order of ordersInRange) {
      if (!order.customerId) continue;
      const firstOrder = customerFirstOrderMap.get(order.customerId);
      if (firstOrder && firstOrder >= rangeStart) {
        newCustomers++;
        newRevenue += Number(order.totalPrice);
      } else {
        returningCustomers++;
        returningRevenue += Number(order.totalPrice);
      }
    }
  }

  // Repeat rate: percentage of customers who ordered more than once in 30/60/90 days
  const repeatRate = {
    days30: await calcRepeatRate(subDays(end, 30), end),
    days60: await calcRepeatRate(subDays(end, 60), end),
    days90: await calcRepeatRate(subDays(end, 90), end),
  };

  // Top customers by total spend
  const topCustomers = await prisma.dimCustomer.findMany({
    where: {
      ordersCount: { gt: 0 },
    },
    orderBy: { totalSpent: "desc" },
    take: 20,
    select: {
      id: true,
      shopifyId: true,
      firstName: true,
      lastName: true,
      ordersCount: true,
      totalSpent: true,
      lastOrderAt: true,
    },
  });

  // Fetch actual order dates for top customers to calculate real intervals
  const topCustomerIds = topCustomers.map((c) => c.id);
  const customerOrders = await prisma.factOrder.findMany({
    where: {
      customerId: { in: topCustomerIds },
      financialStatus: { in: ["paid", "partially_refunded"] },
      cancelledAt: null,
    },
    select: { customerId: true, orderDate: true, totalPrice: true },
    orderBy: { orderDate: "asc" },
  });

  // Group orders by customer, compute avg interval and avg order value from real data
  const customerOrderMap = new Map<string, { dates: Date[]; totalSpent: number }>();
  for (const o of customerOrders) {
    if (!o.customerId) continue;
    const entry = customerOrderMap.get(o.customerId);
    if (entry) {
      entry.dates.push(o.orderDate);
      entry.totalSpent += Number(o.totalPrice);
    } else {
      customerOrderMap.set(o.customerId, {
        dates: [o.orderDate],
        totalSpent: Number(o.totalPrice),
      });
    }
  }

  return {
    newVsReturning: {
      newCustomers,
      returningCustomers,
      newRevenue,
      returningRevenue,
    },
    repeatRate,
    topCustomers: topCustomers.map((c) => {
      const orderData = customerOrderMap.get(c.id);
      const actualOrders = orderData?.dates.length || 0;
      const actualSpent = orderData?.totalSpent || Number(c.totalSpent);
      const avgOrderValue = actualOrders > 0 ? actualSpent / actualOrders : 0;

      let avgDaysBetweenOrders: number | null = null;
      if (orderData && orderData.dates.length > 1) {
        const dates = orderData.dates;
        let totalDays = 0;
        for (let i = 1; i < dates.length; i++) {
          totalDays += (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        }
        avgDaysBetweenOrders = Math.round(totalDays / (dates.length - 1));
      }

      return {
        id: c.id,
        shopifyId: c.shopifyId,
        name: [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown",
        ordersCount: actualOrders,
        totalSpent: actualSpent,
        avgOrderValue,
        avgDaysBetweenOrders,
        lastOrderAt: c.lastOrderAt?.toISOString() || null,
      };
    }),
  };
}

async function calcRepeatRate(start: Date, end: Date): Promise<number> {
  // Count customers with orders in the window
  const customersWithOrders = await prisma.factOrder.groupBy({
    by: ["customerId"],
    where: {
      orderDate: { gte: start, lte: end },
      financialStatus: { in: ["paid", "partially_refunded"] },
      cancelledAt: null,
      customerId: { not: null },
    },
    _count: true,
  });

  const totalCustomers = customersWithOrders.length;
  const repeatCustomers = customersWithOrders.filter((c) => c._count > 1).length;

  return totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
}
