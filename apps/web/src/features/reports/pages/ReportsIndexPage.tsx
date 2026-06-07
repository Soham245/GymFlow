import { useNavigate } from "react-router-dom";
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const REPORTS = [
  {
    title: "Revenue",
    description: "Income from payments and memberships",
    icon: IndianRupee,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    route: ROUTES.REPORT_REVENUE,
  },
  {
    title: "Expenses",
    description: "Spending by category and period",
    icon: Receipt,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    route: ROUTES.REPORT_EXPENSES,
  },
  {
    title: "Profit",
    description: "Revenue minus expenses with margin",
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    route: ROUTES.REPORT_PROFIT,
  },
  {
    title: "Memberships",
    description: "Active, frozen, expired, and expiring",
    icon: Users,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    route: ROUTES.REPORT_MEMBERSHIPS,
  },
  {
    title: "Outstanding Balances",
    description: "Members with pending dues",
    icon: AlertCircle,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    route: ROUTES.REPORT_OUTSTANDING,
  },
];

export default function ReportsIndexPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Reports" subtitle="Business analytics" />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <div className="grid gap-3 sm:grid-cols-2">
            {REPORTS.map((report) => (
              <button
                key={report.title}
                onClick={() => navigate(report.route)}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent/50 active:bg-accent"
              >
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", report.color)}>
                  <report.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{report.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {report.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
