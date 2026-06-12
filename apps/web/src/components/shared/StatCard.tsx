import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tailwind color class for the icon background */
  iconBg?: string;
  /** Tailwind color class for the icon foreground */
  iconColor?: string;
  /** Optional subtitle text below the value */
  subtitle?: string;
  /** Optional trend or comparison text */
  trend?: string;
  /** Whether trend is positive (green), negative (red), or neutral */
  trendDirection?: "up" | "down" | "neutral";
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  subtitle,
  trend,
  trendDirection = "neutral",
  className,
  onClick,
}: StatCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      className={cn(
        "relative rounded-lg border bg-card p-3 text-left shadow-sm md:p-4",
        onClick &&
          "cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent",
        className
      )}
      onClick={onClick}
    >
      {/* Icon — top-right accent */}
      <div
        className={cn(
          "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md md:right-4 md:top-4",
          iconBg
        )}
      >
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>

      {/* Text stack — full width, left-aligned */}
      <div className="pr-10">
        <p className="text-xs font-medium leading-none text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-lg font-bold leading-tight tracking-tight md:text-xl">
          {value}
        </p>
        {/* Always render subtitle row for consistent card height */}
        <p
          className={cn(
            "mt-1 text-[11px]",
            subtitle ? "text-muted-foreground" : "invisible"
          )}
        >
          {subtitle || " "}
        </p>
        {trend && (
          <p
            className={cn(
              "mt-1 text-[11px] font-medium",
              trendDirection === "up" && "text-green-600",
              trendDirection === "down" && "text-red-600",
              trendDirection === "neutral" && "text-muted-foreground"
            )}
          >
            {trend}
          </p>
        )}
      </div>
    </Wrapper>
  );
}
