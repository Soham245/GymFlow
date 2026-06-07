import type { ReactNode } from "react";
import { formatMoney, cn } from "@/lib/utils";

// ─── Metric Card ──────────────────────────────────────────────

interface ReportMetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  color?: "default" | "green" | "red" | "amber" | "blue";
  large?: boolean;
}

const colorMap = {
  default: "bg-card border",
  green: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
  red: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900",
  amber: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900",
  blue: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900",
};

const valueColorMap = {
  default: "text-foreground",
  green: "text-green-700 dark:text-green-400",
  red: "text-red-700 dark:text-red-400",
  amber: "text-amber-700 dark:text-amber-400",
  blue: "text-blue-700 dark:text-blue-400",
};

export function ReportMetricCard({
  label,
  value,
  subtitle,
  icon,
  color = "default",
  large,
}: ReportMetricCardProps) {
  return (
    <div className={cn("rounded-lg border p-4", colorMap[color])}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className={cn(
        "mt-1 font-bold",
        large ? "text-2xl" : "text-lg",
        valueColorMap[color]
      )}>
        {value}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Breakdown List ───────────────────────────────────────────

interface BreakdownItem {
  label: string;
  value: string;
  count?: number;
  percent?: number;
}

interface BreakdownListProps {
  title: string;
  items: BreakdownItem[];
  emptyMessage?: string;
}

export function BreakdownList({ title, items, emptyMessage }: BreakdownListProps) {
  const maxValue = Math.max(...items.map((i) => i.percent ?? 0), 1);

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {emptyMessage ?? "No data available"}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.count !== undefined && (
                    <span className="text-[10px] text-muted-foreground">
                      {item.count} item{item.count !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
              </div>
              {item.percent !== undefined && (
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(item.percent / maxValue) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Report Section ───────────────────────────────────────────

interface ReportSectionProps {
  title: string;
  children: ReactNode;
}

export function ReportSection({ title, children }: ReportSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}
