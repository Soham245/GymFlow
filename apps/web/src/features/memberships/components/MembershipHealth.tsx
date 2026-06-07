import { Heart, Clock, IndianRupee, CreditCard } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatMoney, cn } from "@/lib/utils";
import type { MembershipDetail } from "@/api/types";

interface MembershipHealthProps {
  membership: MembershipDetail;
}

export function MembershipHealth({ membership }: MembershipHealthProps) {
  const daysLeft = daysUntil(membership.endDate);
  const outstanding = parseFloat(membership.outstandingAmount);
  const total = parseFloat(membership.totalAmount) - parseFloat(membership.discountAmount);
  const paid = parseFloat(membership.paidAmount);
  const paymentPercent = total > 0 ? Math.min((paid / total) * 100, 100) : 100;
  const paymentStatus = outstanding <= 0 ? "Paid" : paymentPercent >= 50 ? "Partial" : "Unpaid";

  const isFrozen = membership.status === "frozen";
  const isExpired = membership.status === "expired" || daysLeft < 0;
  const isWarning = !isFrozen && !isExpired && daysLeft <= 7;

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-4",
        isExpired && "border-destructive/30 bg-destructive/5",
        isFrozen && "border-blue-300 bg-blue-50",
        isWarning && "border-amber-300 bg-amber-50",
        !isExpired && !isFrozen && !isWarning && "border-green-300 bg-green-50"
      )}
    >
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart
            className={cn(
              "h-5 w-5",
              isExpired && "text-destructive",
              isFrozen && "text-blue-600",
              isWarning && "text-amber-600",
              !isExpired && !isFrozen && !isWarning && "text-green-600"
            )}
          />
          <span className="text-sm font-semibold">Membership Health</span>
        </div>
        <StatusBadge status={membership.status} />
      </div>

      {/* Metrics grid */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {/* Days Remaining */}
        <HealthMetric
          icon={Clock}
          label="Days Left"
          value={
            isFrozen
              ? "Frozen"
              : isExpired
                ? "Expired"
                : `${daysLeft}`
          }
          highlight={isExpired || isWarning}
          sublabel={
            isFrozen
              ? "Paused"
              : isExpired
                ? `${Math.abs(daysLeft)}d ago`
                : daysLeft === 1
                  ? "Expires tomorrow"
                  : undefined
          }
        />

        {/* Outstanding */}
        <HealthMetric
          icon={IndianRupee}
          label="Outstanding"
          value={formatMoney(outstanding)}
          highlight={outstanding > 0}
          sublabel={outstanding > 0 ? "Due" : "Clear"}
        />

        {/* Payment Status */}
        <HealthMetric
          icon={CreditCard}
          label="Payment"
          value={paymentStatus}
          highlight={paymentStatus === "Unpaid"}
        >
          {/* Progress bar */}
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                paymentPercent >= 100 && "bg-green-500",
                paymentPercent >= 50 && paymentPercent < 100 && "bg-amber-500",
                paymentPercent < 50 && "bg-destructive"
              )}
              style={{ width: `${paymentPercent}%` }}
            />
          </div>
          <p className="mt-0.5 text-[9px] text-muted-foreground">
            {formatMoney(paid)} / {formatMoney(total)}
          </p>
        </HealthMetric>
      </div>
    </div>
  );
}

// ─── HealthMetric ───────────────────────────────────────────────

function HealthMetric({
  icon: Icon,
  label,
  value,
  sublabel,
  highlight,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-1 text-sm font-bold",
          highlight ? "text-destructive" : "text-foreground"
        )}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground">{sublabel}</p>
      )}
      {children}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
