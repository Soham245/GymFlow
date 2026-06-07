import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  /** Tailwind bg color for the icon circle */
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Compact circular-icon + label button for quick action grids.
 * Used in Dashboard quick actions and any "shortcut" section.
 */
export function QuickActionButton({
  label,
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  onClick,
  className,
}: QuickActionButtonProps) {
  return (
    <button
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-lg p-3 transition-colors",
        "hover:bg-accent/50 active:bg-accent",
        className
      )}
      onClick={onClick}
    >
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-full", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </button>
  );
}
