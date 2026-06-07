import { useNavigate } from "react-router-dom";
import { CreditCard, AlertCircle } from "lucide-react";
import { useOutstandingBalances } from "../hooks/use-reports";
import { ReportMetricCard } from "../components/ReportComponents";
import { ExportButtons } from "../components/ExportButtons";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { EXPORTS } from "@/api/endpoints";
import { formatMoney, formatDate, formatPhone, cn } from "@/lib/utils";
import type { OutstandingBalance } from "@/api/types";

export default function OutstandingReportPage() {
  const navigate = useNavigate();
  const report = useOutstandingBalances();

  return (
    <>
      <PageHeader title="Outstanding Balances" showBack backTo={ROUTES.REPORTS} />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="flex justify-end">
            <ExportButtons csvUrl={EXPORTS.OUTSTANDING_CSV} xlsxUrl={EXPORTS.OUTSTANDING_XLSX} />
          </div>

          {report.isLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
              </div>
              <Skeleton className="h-64 rounded-lg" />
            </div>
          ) : report.isError ? (
            <ErrorState title="Couldn't load outstanding balances" onRetry={() => report.refetch()} />
          ) : (
            <>
              {/* Summary metrics */}
              <div className="grid grid-cols-2 gap-3">
                <ReportMetricCard
                  label="Total Outstanding"
                  value={formatMoney(report.data!.totalOutstanding)}
                  color="red"
                  large
                />
                <ReportMetricCard
                  label="Members with Dues"
                  value={String(report.data!.count)}
                  color="amber"
                />
              </div>

              {/* Balances list — sorted highest first (backend already sorts desc) */}
              {report.data!.balances.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No outstanding dues"
                  description="All members are fully paid. Great job!"
                />
              ) : (
                <div className="divide-y rounded-lg border bg-card">
                  {report.data!.balances.map((b) => (
                    <BalanceRow
                      key={b.membershipId}
                      balance={b}
                      onMemberClick={() => navigate(ROUTES.MEMBER_DETAIL(b.memberId))}
                      onPayClick={() =>
                        navigate(
                          `${ROUTES.PAYMENT_NEW}?memberId=${b.memberId}&membershipId=${b.membershipId}`
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function BalanceRow({
  balance,
  onMemberClick,
  onPayClick,
}: {
  balance: OutstandingBalance;
  onMemberClick: () => void;
  onPayClick: () => void;
}) {
  const outstanding = parseFloat(balance.outstanding);
  const total = parseFloat(balance.totalAmount) - parseFloat(balance.discountAmount);
  const paid = parseFloat(balance.paidAmount);
  const percent = total > 0 ? (paid / total) * 100 : 0;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onMemberClick} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium hover:text-primary">
            {balance.memberName}
          </p>
          <p className="text-xs text-muted-foreground">
            {balance.planName} · {formatPhone(balance.memberPhone)}
          </p>
        </button>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-destructive">
            {formatMoney(balance.outstanding)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            of {formatMoney(total)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            percent >= 75 ? "bg-green-500" : percent >= 40 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Paid {formatMoney(paid)} ({Math.round(percent)}%)
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onPayClick}
        >
          <CreditCard className="mr-1 h-3 w-3" />
          Record Payment
        </Button>
      </div>
    </div>
  );
}
