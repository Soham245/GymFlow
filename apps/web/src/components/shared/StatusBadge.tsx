import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";

type Status = keyof typeof STATUS_COLORS;

interface StatusBadgeProps {
  status: Status;
  /** Override the display label (default: capitalize the status) */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800";
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        colors,
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
