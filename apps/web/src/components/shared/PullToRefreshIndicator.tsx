import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const pastThreshold = pullDistance >= threshold;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
      style={{ height: isRefreshing ? 48 : pullDistance > 0 ? pullDistance : 0 }}
    >
      {isRefreshing ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <ArrowDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            pastThreshold && "rotate-180 text-primary"
          )}
          style={{ opacity: progress }}
        />
      )}
    </div>
  );
}
