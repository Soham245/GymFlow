import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface SectionCardProps {
  title: string;
  /** Optional count badge next to the title */
  count?: number;
  /** Custom actions rendered in the header bar */
  actions?: React.ReactNode;
  /** "View All" action */
  onViewAll?: () => void;
  viewAllLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  count,
  actions,
  onViewAll,
  viewAllLabel = "View All",
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={cn("rounded-lg border bg-card shadow-sm overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/10 px-1.5 text-xs font-bold text-destructive">
              {count}
            </span>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          {actions}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            >
              {viewAllLabel}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
