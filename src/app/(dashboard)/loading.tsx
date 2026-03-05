import { MetricSkeletonGrid } from "@/components/dashboard/metric-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-48 mb-6" />
      <MetricSkeletonGrid />
      <Skeleton className="h-[300px] w-full mt-6" />
    </div>
  );
}
