import { useNavigate } from "react-router-dom";
import {
  Users,
  Snowflake,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import { useMembershipReport } from "../hooks/use-reports";
import { ReportMetricCard } from "../components/ReportComponents";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatPhone, cn } from "@/lib/utils";

export default function MembershipReportPage() {
  const navigate = useNavigate();
  const report = useMembershipReport();

  return (
    <>
      <PageHeader title="Membership Report" showBack backTo={ROUTES.REPORTS} />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-5">
          {report.isLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
              </div>
              <Skeleton className="h-48 rounded-lg" />
            </div>
          ) : report.isError ? (
            <ErrorState title="Couldn't load membership report" onRetry={() => report.refetch()} />
          ) : (
            <>
              {/* Status summary */}
              <div className="grid grid-cols-2 gap-3">
                <ReportMetricCard
                  label="Active"
                  value={String(report.data!.summary.active)}
                  icon={<Users className="h-4 w-4 text-green-600" />}
                  color="green"
                  large
                />
                <ReportMetricCard
                  label="Frozen"
                  value={String(report.data!.summary.frozen)}
                  icon={<Snowflake className="h-4 w-4 text-blue-600" />}
                  color="blue"
                />
                <ReportMetricCard
                  label="Expired"
                  value={String(report.data!.summary.expired)}
                  icon={<XCircle className="h-4 w-4 text-red-600" />}
                  color="red"
                />
                <ReportMetricCard
                  label="Expiring Soon"
                  value={String(report.data!.expiring7Days)}
                  subtitle={`${report.data!.expiring30Days} in 30 days`}
                  icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
                  color="amber"
                />
              </div>

              {/* Expiring memberships list */}
              <div className="rounded-lg border bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Expiring Memberships (Next 30 Days)
                </p>

                {report.data!.expiringMemberships.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No expiring memberships"
                    description="No memberships are expiring in the next 30 days."
                  />
                ) : (
                  <div className="-mx-1 divide-y">
                    {report.data!.expiringMemberships.map((m) => (
                      <button
                        key={m.membershipId}
                        onClick={() => navigate(ROUTES.MEMBERSHIP_DETAIL(m.membershipId))}
                        className="flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-accent/50"
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            m.daysLeft <= 3
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : m.daysLeft <= 7
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          )}
                        >
                          {m.daysLeft}d
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{m.memberName}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.planName} · Ends {formatDate(m.endDate)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
