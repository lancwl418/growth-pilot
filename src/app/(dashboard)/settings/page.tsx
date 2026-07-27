"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatDistanceToNow, format } from "date-fns";
import {
  RefreshCw,
  Package,
  Users,
  ShoppingCart,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
} from "lucide-react";

interface SyncLog {
  id: string;
  source: string;
  syncType: string;
  status: string;
  recordsProcessed: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface SyncHistoryData {
  logs: SyncLog[];
  summary: { products: number; customers: number; orders: number };
}

export default function SettingsPage() {
  const { data, isLoading, refresh } = useDashboardData<SyncHistoryData>(
    "/api/dashboard/sync-history"
  );
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<
    { ok: boolean; message: string } | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset the input so the same file can be re-selected later.
      e.target.value = "";
      if (!file) return;

      setUploading(true);
      setUploadResult(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/sync/meta-ads/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (res.ok) {
          setUploadResult({
            ok: true,
            message: `Imported ${json.recordsProcessed} rows from ${file.name}.`,
          });
          refresh();
        } else {
          setUploadResult({ ok: false, message: json.error || "Upload failed." });
        }
      } catch {
        setUploadResult({ ok: false, message: "Upload failed. Please try again." });
      } finally {
        setUploading(false);
      }
    },
    [refresh]
  );

  const triggerSync = useCallback(
    async (source: string) => {
      setSyncing((prev) => ({ ...prev, [source]: true }));
      try {
        const url = source === "ga4"
          ? "/api/sync/ga4"
          : source === "meta-ads"
          ? "/api/sync/meta-ads"
          : `/api/sync/shopify/${source}`;
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        setTimeout(() => {
          refresh();
          setSyncing((prev) => ({ ...prev, [source]: false }));
        }, 2000);
      } catch {
        setSyncing((prev) => ({ ...prev, [source]: false }));
      }
    },
    [refresh]
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Settings & Sync</h1>

      {/* Database summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{data?.summary.products ?? "-"}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{data?.summary.customers ?? "-"}</p>
              <p className="text-xs text-muted-foreground">Customers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{data?.summary.orders ?? "-"}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual sync triggers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Manual Sync</CardTitle>
          <CardDescription>
            Trigger a manual data sync from Shopify. Daily automatic sync runs at 06:00 UTC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={syncing.products}
              onClick={() => triggerSync("products")}
            >
              {syncing.products ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Products
            </Button>
            <Button
              variant="outline"
              disabled={syncing.customers}
              onClick={() => triggerSync("customers")}
            >
              {syncing.customers ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Customers
            </Button>
            <Button
              variant="outline"
              disabled={syncing.orders}
              onClick={() => triggerSync("orders")}
            >
              {syncing.orders ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Orders
            </Button>
            <Button
              variant="outline"
              disabled={syncing.ga4}
              onClick={() => triggerSync("ga4")}
            >
              {syncing.ga4 ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync GA4 Traffic
            </Button>
            <Button
              variant="outline"
              disabled={syncing["meta-ads"]}
              onClick={() => triggerSync("meta-ads")}
            >
              {syncing["meta-ads"] ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Meta Ads
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meta Ads CSV upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Meta Ads — CSV Upload</CardTitle>
          <CardDescription>
            Meta&apos;s API is unavailable for this account, so campaign data is
            loaded by uploading the daily &ldquo;Campaign name&rdquo; breakdown
            exported from Ads Manager (columns: Day, Campaign name, Reach,
            Impressions, Amount spent, Link clicks, Purchases, Purchases
            conversion value, Facebook Likes, Instagram Follows). Re-uploading a
            day overwrites its existing rows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleUpload}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Meta CSV
            </Button>
            {uploadResult && (
              <span
                className={`text-sm ${
                  uploadResult.ok ? "text-green-600" : "text-red-600"
                }`}
              >
                {uploadResult.message}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.logs.length ? (
            <p className="text-center py-8 text-muted-foreground">
              No sync history yet. Run your first sync above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{statusIcon(log.status)}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {log.source.replace("shopify_", "").replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.syncType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {log.recordsProcessed.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(log.startedAt), "MMM dd HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.completedAt
                          ? formatDistanceToNow(new Date(log.completedAt), {
                              addSuffix: false,
                            })
                          : "running..."}
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-[200px] truncate">
                        {log.errorMessage || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
