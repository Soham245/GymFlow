import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportPeriod, ReportQuery } from "../hooks/use-reports";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_90_days", label: "Last 90 Days" },
  { value: "this_year", label: "This Year" },
  { value: "all_time", label: "All Time" },
  { value: "custom", label: "Custom" },
];

interface PeriodSelectorProps {
  value: ReportQuery;
  onChange: (q: ReportQuery) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(value.period === "custom");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = PERIODS.find((p) => p.value === value.period);

  function handlePeriod(period: ReportPeriod) {
    setOpen(false);
    if (period === "custom") {
      setShowCustom(true);
      onChange({ period: "custom", from: value.from, to: value.to });
    } else {
      setShowCustom(false);
      onChange({ period });
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
            open && "ring-2 ring-ring"
          )}
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {selected?.label ?? "Select period"}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="absolute right-0 z-50 mt-1 min-w-[180px] rounded-xl border bg-popover p-1 shadow-lg">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriod(p.value)}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors",
                  value.period === p.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.from ?? ""}
            onChange={(e) => onChange({ ...value, period: "custom", from: e.target.value })}
            className="h-9 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <input
            type="date"
            value={value.to ?? ""}
            min={value.from}
            onChange={(e) => onChange({ ...value, period: "custom", to: e.target.value })}
            className="h-9 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
    </div>
  );
}
