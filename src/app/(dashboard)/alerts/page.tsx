"use client";

import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertList } from "@/components/alerts/alert-list";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Bell } from "lucide-react";

interface AlertResponse {
  alerts: {
    id: string;
    ruleType: string;
    severity: string;
    title: string;
    message: string;
    status: string;
    createdAt: string;
  }[];
  total: number;
}

export default function AlertsPage() {
  const { data: activeData, isLoading: loadingActive, refresh: refreshActive } =
    useDashboardData<AlertResponse>("/api/alerts", { status: "active", limit: "50" });

  const { data: allData, isLoading: loadingAll, refresh: refreshAll } =
    useDashboardData<AlertResponse>("/api/alerts", { limit: "50" });

  const handleAction = useCallback(
    async (id: string, status: "acknowledged" | "dismissed") => {
      await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      refreshActive();
      refreshAll();
    },
    [refreshActive, refreshAll]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Alerts</h1>
          {activeData && activeData.total > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              {activeData.total} active
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActive ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <AlertList
                  alerts={activeData?.alerts || []}
                  onAcknowledge={(id) => handleAction(id, "acknowledged")}
                  onDismiss={(id) => handleAction(id, "dismissed")}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAll ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <AlertList alerts={allData?.alerts || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
