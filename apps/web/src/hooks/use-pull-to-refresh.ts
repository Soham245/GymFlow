import { useRef, useEffect, useCallback, useState } from "react";

interface UsePullToRefreshOptions {
  /** The async function to call on refresh */
  onRefresh: () => Promise<unknown>;
  /** Minimum pull distance in px to trigger refresh (default: 80) */
  threshold?: number;
  /** Whether pull-to-refresh is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Pull-to-refresh for mobile. Returns a ref to attach to the scrollable container,
 * plus `isRefreshing` state and a `pullDistance` for visual indicator.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      // Only start pull if at top of scroll
      if (el!.scrollTop > 0) return;
      startY.current = e.touches[0]!.clientY;
      pulling.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling.current) return;
      const dy = e.touches[0]!.clientY - startY.current;
      if (dy < 0) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }
      // Dampen the pull effect
      const dampened = Math.min(dy * 0.4, 120);
      setPullDistance(dampened);
      if (dampened > 10) {
        e.preventDefault();
      }
    }

    function onTouchEnd() {
      if (pullDistance >= threshold && !isRefreshing) {
        handleRefresh();
      }
      pulling.current = false;
      setPullDistance(0);
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, threshold, pullDistance, isRefreshing, handleRefresh]);

  return { containerRef, isRefreshing, pullDistance };
}
