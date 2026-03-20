"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ShopifyTab } from "@/components/analytics/shopify-tab";
import { Ga4Tab } from "@/components/analytics/ga4-tab";
import { useDateRange } from "@/hooks/use-date-range";
import { useT } from "@/hooks/use-language";

export default function AnalyticsPage() {
  const { preset, dateRange, setPreset, queryParams } = useDateRange("last30d");
  const t = useT();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">{t.analytics.title}</h1>
        <DateRangePicker
          preset={preset}
          dateRange={dateRange}
          onPresetChange={setPreset}
        />
      </div>

      <Tabs defaultValue="shopify">
        <TabsList>
          <TabsTrigger value="shopify">{t.analytics.shopifyTab}</TabsTrigger>
          <TabsTrigger value="ga4">{t.analytics.ga4Tab}</TabsTrigger>
        </TabsList>
        <TabsContent value="shopify" className="mt-4">
          <ShopifyTab queryParams={queryParams} />
        </TabsContent>
        <TabsContent value="ga4" className="mt-4">
          <Ga4Tab queryParams={queryParams} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
