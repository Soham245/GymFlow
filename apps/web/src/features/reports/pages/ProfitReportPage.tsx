import { useState } from "react";
import { useProfitReport, type ReportQuery } from "../hooks/use-reports";
import { PeriodSelector } from "../components/PeriodSelector";
import { ReportMetricCard } from "../components/ReportComponents";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { formatMoney, formatDate } from "@/lib/utils";

export default function ProfitReportPage() {
  const [query, setQuery] = useState<ReportQuery>({ period: "this_month" });
  const report = useProfitReport(query);

  return (
    <>
      <PageHeader title="Profit Report" showBack backTo={ROUTES.REPORTS} />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-5">
          <PeriodSelector value={query} onChange={setQuery} />

          {report.isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : report.isError ? (
            <ErrorState title="Couldn't load profit report" onRetry={() => report.refetch()} />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {formatDate(report.data!.period.from)} — {formatDate(report.data!.period.to)}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <ReportMetricCard
                  label="Revenue"
                  value={formatMoney(report.data!.revenue)}
                  color="green"
                />
                <ReportMetricCard
                  label="Expenses"
                  value={formatMoney(report.data!.expenses)}
                  color="red"
                />
                <ReportMetricCard
                  label="Profit"
                  value={formatMoney(report.data!.profit)}
                  color={parseFloat(report.data!.profit) >= 0 ? "green" : "red"}
                  large
                />
                <ReportMetricCard
                  label="Profit Margin"
                  value={`${report.data!.margin}%`}
                  subtitle={
                    report.data!.margin >= 50
                      ? "Healthy margin"
                      : report.data!.margin >= 20
                        ? "Moderate margin"
                        : report.data!.margin >= 0
                          ? "Low margin"
                          : "Operating at a loss"
                  }
                  color={
                    report.data!.margin >= 50
                      ? "green"
                      : report.data!.margin >= 20
                        ? "amber"
                        : "red"
                  }
                  large
                />
              </div>

              {/* Visual comparison bar */}
              <div className="rounded-lg border bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Revenue vs Expenses
                </p>
                {(() => {
                  const rev = parseFloat(report.data!.revenue);
                  const exp = parseFloat(report.data!.expenses);
                  const maxVal = Math.max(rev, exp, 1);
                  return (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-green-700 dark:text-green-400">Revenue</span>
                          <span className="font-bold">{formatMoney(report.data!.revenue)}</span>
                        </div>
                        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all duration-500"
                            style={{ width: `${(rev / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-red-700 dark:text-red-400">Expenses</span>
                          <span className="font-bold">{formatMoney(report.data!.expenses)}</span>
                        </div>
                        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-red-500 transition-all duration-500"
                            style={{ width: `${(exp / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
