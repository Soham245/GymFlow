import { useState } from "react";
import { useRevenueReport, type ReportQuery } from "../hooks/use-reports";
import { PeriodSelector } from "../components/PeriodSelector";
import { ReportMetricCard, BreakdownList } from "../components/ReportComponents";
import { ExportButtons } from "../components/ExportButtons";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { EXPORTS } from "@/api/endpoints";
import { formatMoney, formatDate } from "@/lib/utils";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

export default function RevenueReportPage() {
  const [query, setQuery] = useState<ReportQuery>({ period: "this_month" });
  const report = useRevenueReport(query);

  return (
    <>
      <PageHeader title="Revenue Report" showBack backTo={ROUTES.REPORTS} />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <PeriodSelector value={query} onChange={setQuery} />
            </div>
            <ExportButtons
              csvUrl={EXPORTS.REVENUE_CSV}
              xlsxUrl={EXPORTS.REVENUE_XLSX}
              params={{ period: query.period, ...(query.from ? { from: query.from } : {}), ...(query.to ? { to: query.to } : {}) }}
            />
          </div>

          {report.isLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
              </div>
              <Skeleton className="h-48 rounded-lg" />
            </div>
          ) : report.isError ? (
            <ErrorState title="Couldn't load revenue report" onRetry={() => report.refetch()} />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {formatDate(report.data!.period.from)} — {formatDate(report.data!.period.to)}
              </p>

              <div className="grid grid-cols-3 gap-3">
                <ReportMetricCard
                  label="Total Revenue"
                  value={formatMoney(report.data!.totalRevenue)}
                  color="green"
                  large
                />
                <ReportMetricCard
                  label="Payments"
                  value={String(report.data!.paymentCount)}
                />
                <ReportMetricCard
                  label="Average"
                  value={formatMoney(report.data!.averagePayment)}
                />
              </div>

              <BreakdownList
                title="Payment Method Breakdown"
                items={report.data!.paymentMethodBreakdown.map((m) => {
                  const total = parseFloat(report.data!.totalRevenue);
                  const methodTotal = parseFloat(m.total);
                  return {
                    label: METHOD_LABELS[m.method] ?? m.method,
                    value: formatMoney(m.total),
                    count: m.count,
                    percent: total > 0 ? (methodTotal / total) * 100 : 0,
                  };
                })}
                emptyMessage="No payments in this period"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
