"use client";

import { DataTable, type Column } from "./data-table";
import { formatCurrency } from "@/lib/utils/currency";
import type { ProductMetric } from "@/types/dashboard";

const columns: Column<ProductMetric>[] = [
  { key: "title", label: "Product", sortable: true },
  { key: "vendor", label: "Vendor", sortable: true },
  {
    key: "revenue",
    label: "Revenue",
    sortable: true,
    align: "right",
    render: (row) => formatCurrency(row.revenue),
  },
  {
    key: "unitsSold",
    label: "Units Sold",
    sortable: true,
    align: "right",
    render: (row) => row.unitsSold.toLocaleString(),
  },
  {
    key: "orders",
    label: "Orders",
    sortable: true,
    align: "right",
    render: (row) => row.orders.toLocaleString(),
  },
];

interface ProductsTableProps {
  data: ProductMetric[];
}

export function ProductsTable({ data }: ProductsTableProps) {
  return <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns as unknown as Column<Record<string, unknown>>[]} />;
}
