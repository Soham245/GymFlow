import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  className,
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-primary pl-4 pr-5 shadow-lg transition-transform duration-200 active:scale-95 md:hidden",
        "h-12 text-sm font-medium text-primary-foreground",
        className
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
