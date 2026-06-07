import { useState } from "react";
import { useExpenseReport, type ReportQuery } from "../hooks/use-reports";
import { PeriodSelector } from "../components/PeriodSelector";
import { ReportMetricCard, BreakdownList } from "../components/ReportComponents";
import { ExportButtons } from "../components/ExportButtons";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { EXPORTS } from "@/api/endpoints";
import { formatMoney, formatDate } from "@/lib/utils";

export default function ExpenseReportPage() {
  const [query, setQuery] = useState<ReportQuery>({ period: "this_month" });
  const report = useExpenseReport(query);

  return (
    <>
      <PageHeader title="Expense Report" showBack backTo={ROUTES.REPORTS} />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <PeriodSelector value={query} onChange={setQuery} />
            </div>
            <ExportButtons
              csvUrl={EXPORTS.EXPENSES_CSV}
              xlsxUrl={EXPORTS.EXPENSES_XLSX}
              params={{ period: query.period, ...(query.from ? { from: query.from } : {}), ...(query.to ? { to: query.to } : {}) }}
            />
          </div>

          {report.isLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
              </div>
              <Skeleton className="h-48 rounded-lg" />
            </div>
          ) : report.isError ? (
            <ErrorState title="Couldn't load expense report" onRetry={() => report.refetch()} />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {formatDate(report.data!.period.from)} — {formatDate(report.data!.period.to)}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <ReportMetricCard
                  label="Total Expenses"
                  value={formatMoney(report.data!.totalExpenses)}
                  color="red"
                  large
                />
                <ReportMetricCard
                  label="Expense Count"
                  value={String(report.data!.expenseCount)}
                />
              </div>

              <BreakdownList
                title="Category Breakdown"
                items={report.data!.categoryBreakdown.map((c) => {
                  const total = parseFloat(report.data!.totalExpenses);
                  const catTotal = parseFloat(c.total);
                  return {
                    label: c.category,
                    value: formatMoney(c.total),
                    count: c.count,
                    percent: total > 0 ? (catTotal / total) * 100 : 0,
                  };
                })}
                emptyMessage="No expenses in this period"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
