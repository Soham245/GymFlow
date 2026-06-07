import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/utils";

interface MoneyDisplayProps {
  /** Raw numeric amount (string or number) */
  amount: string | number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** When true, positive values render green, negative red */
  colored?: boolean;
  /** When true, show +/- sign for non-zero values */
  showSign?: boolean;
  className?: string;
}

export function MoneyDisplay({
  amount,
  size = "md",
  colored = false,
  showSign = false,
  className,
}: MoneyDisplayProps) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const isNeg = num < 0;
  const isZero = num === 0 || isNaN(num);

  let display = formatMoney(amount);
  if (showSign && !isNeg && !isZero) {
    display = `+${display}`;
  }

  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-xl",
        colored && !isZero && (isNeg ? "text-red-600" : "text-green-600"),
        className
      )}
    >
      {display}
    </span>
  );
}
