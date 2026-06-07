import { formatMoney, cn } from "@/lib/utils";

interface PaymentProgressProps {
  paid: number;
  total: number;
  className?: string;
}

export function PaymentProgress({ paid, total, className }: PaymentProgressProps) {
  const outstanding = Math.max(total - paid, 0);
  const percent = total > 0 ? Math.min((paid / total) * 100, 100) : 100;
  const status = outstanding <= 0 ? "Paid" : percent >= 50 ? "Partial" : "Unpaid";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Status + amounts */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            outstanding <= 0 && "bg-green-100 text-green-800",
            outstanding > 0 && percent >= 50 && "bg-amber-100 text-amber-800",
            outstanding > 0 && percent < 50 && "bg-red-100 text-red-800"
          )}
        >
          {status}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatMoney(paid)} / {formatMoney(total)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            percent >= 100 && "bg-green-500",
            percent >= 50 && percent < 100 && "bg-amber-500",
            percent < 50 && "bg-red-500"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Breakdown */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">
          Paid: <span className="font-semibold text-foreground">{formatMoney(paid)}</span>
        </span>
        {outstanding > 0 && (
          <span className="font-semibold text-destructive">
            Outstanding: {formatMoney(outstanding)}
          </span>
        )}
      </div>
    </div>
  );
}
