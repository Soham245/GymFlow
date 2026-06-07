import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Pre-built skeleton patterns for common page sections ──────

/** Grid of stat card skeletons */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** List of items with avatar/icon, title, and subtitle */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Section with header + body skeleton */
export function SectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-5 w-40" />
      <ListSkeleton count={3} />
    </div>
  );
}

/** Full dashboard page skeleton */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-7 w-48" />
      <StatCardSkeleton count={4} />
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  );
}
