"use client";

import { DataTable, type Column } from "./data-table";
import { formatCurrency } from "@/lib/utils/currency";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

interface CustomerRow {
  id: string;
  shopifyId: string;
  name: string;
  ordersCount: number;
  totalSpent: number;
  avgOrderValue: number;
  avgDaysBetweenOrders: number | null;
  lastOrderAt: string | null;
}

const SHOPIFY_ADMIN_URL = "https://admin.shopify.com/store/ideamax/customers";

const columns: Column<CustomerRow>[] = [
  {
    key: "name",
    label: "Customer",
    render: (row) => (
      <a
        href={`${SHOPIFY_ADMIN_URL}/${row.shopifyId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
      >
        {row.name}
        <ExternalLink className="h-3 w-3" />
      </a>
    ),
  },
  {
    key: "ordersCount",
    label: "Orders",
    sortable: true,
    align: "right",
  },
  {
    key: "totalSpent",
    label: "Total Spent",
    sortable: true,
    align: "right",
    render: (row) => formatCurrency(row.totalSpent),
  },
  {
    key: "avgOrderValue",
    label: "Avg Order",
    sortable: true,
    align: "right",
    render: (row) => formatCurrency(row.avgOrderValue),
  },
  {
    key: "avgDaysBetweenOrders",
    label: "Avg Interval",
    sortable: true,
    align: "right",
    render: (row) =>
      row.avgDaysBetweenOrders !== null ? `${row.avgDaysBetweenOrders}d` : "—",
  },
  {
    key: "lastOrderAt",
    label: "Last Order",
    sortable: true,
    render: (row) =>
      row.lastOrderAt ? format(new Date(row.lastOrderAt), "MMM dd, yyyy") : "N/A",
  },
];

interface CustomersTableProps {
  data: CustomerRow[];
}

export function CustomersTable({ data }: CustomersTableProps) {
  return <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns as unknown as Column<Record<string, unknown>>[]} />;
}
