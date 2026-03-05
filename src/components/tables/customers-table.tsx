"use client";

import { DataTable, type Column } from "./data-table";
import { formatCurrency } from "@/lib/utils/currency";
import { format } from "date-fns";

interface CustomerRow {
  id: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

const columns: Column<CustomerRow>[] = [
  {
    key: "id",
    label: "Customer ID",
    render: (row) => row.id.slice(0, 8) + "...",
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
