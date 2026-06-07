import { useState } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportPeriod, ReportQuery } from "../hooks/use-reports";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year", label: "This Year" },
  { value: "all_time", label: "All Time" },
  { value: "custom", label: "Custom" },
];

interface PeriodSelectorProps {
  value: ReportQuery;
  onChange: (q: ReportQuery) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [showCustom, setShowCustom] = useState(value.period === "custom");

  function handlePeriod(period: ReportPeriod) {
    if (period === "custom") {
      setShowCustom(true);
      // Keep current from/to if they exist
      onChange({ period: "custom", from: value.from, to: value.to });
    } else {
      setShowCustom(false);
      onChange({ period });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePeriod(p.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              value.period === p.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {p.value === "custom" && <Calendar className="mr-1 inline h-3 w-3" />}
            {p.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-medium text-muted-foreground">From</label>
            <input
              type="date"
              value={value.from ?? ""}
              onChange={(e) =>
                onChange({ ...value, period: "custom", from: e.target.value })
              }
              className="mt-0.5 h-8 w-full rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-medium text-muted-foreground">To</label>
            <input
              type="date"
              value={value.to ?? ""}
              min={value.from}
              onChange={(e) =>
                onChange({ ...value, period: "custom", to: e.target.value })
              }
              className="mt-0.5 h-8 w-full rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}
    </div>
  );
}
