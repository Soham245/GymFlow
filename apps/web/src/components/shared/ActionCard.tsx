import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  /** Primary text */
  title: string;
  /** Secondary text below title */
  subtitle?: string;
  /** Right-side text (e.g., amount, date) */
  value?: string;
  /** Additional text below value */
  valueSubtitle?: string;
  /** Left icon */
  icon?: LucideIcon;
  /** Icon container color class */
  iconBg?: string;
  iconColor?: string;
  /** Show right chevron indicating it's tappable */
  showChevron?: boolean;
  /** Custom right-side content (overrides value/valueSubtitle) */
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ActionCard({
  title,
  subtitle,
  value,
  valueSubtitle,
  icon: Icon,
  iconBg = "bg-muted",
  iconColor = "text-muted-foreground",
  showChevron = true,
  trailing,
  onClick,
  className,
}: ActionCardProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        "hover:bg-accent/50 active:bg-accent",
        className
      )}
      onClick={onClick}
    >
      {Icon && (
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {trailing ?? (
        <>
          {(value || valueSubtitle) && (
            <div className="shrink-0 text-right">
              {value && <p className="text-sm font-semibold tabular-nums">{value}</p>}
              {valueSubtitle && (
                <p className="text-xs text-muted-foreground">{valueSubtitle}</p>
              )}
            </div>
          )}
        </>
      )}
      {showChevron && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}
