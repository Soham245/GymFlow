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
        "flex items-start gap-3 rounded-lg border bg-card p-4 text-left shadow-sm",
        onClick && "cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent",
        className
      )}
      onClick={onClick}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-bold leading-tight tracking-tight">{value}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <p
            className={cn(
              "mt-0.5 text-xs font-medium",
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
