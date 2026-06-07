import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  CreditCard,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { EXPORTS } from "@/api/endpoints";
import { tokenStore } from "@/api/client";

// ─── Period selector for revenue/expenses ─────────────────────

type Period = "this_month" | "last_month" | "this_year" | "all_time";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year", label: "This Year" },
  { value: "all_time", label: "All Time" },
];

// ─── Export groups ────────────────────────────────────────────

interface ExportItem {
  label: string;
  description: string;
  icon: React.ElementType;
  csvEndpoint: string;
  xlsxEndpoint: string;
  supportsPeriod: boolean;
  color: string;
}

const EXPORT_ITEMS: ExportItem[] = [
  {
    label: "Members",
    description: "All member records with contact details and status",
    icon: Users,
    csvEndpoint: EXPORTS.MEMBERS_CSV,
    xlsxEndpoint: EXPORTS.MEMBERS_XLSX,
    supportsPeriod: false,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Revenue / Payments",
    description: "Payment records with amounts, methods, and dates",
    icon: CreditCard,
    csvEndpoint: EXPORTS.REVENUE_CSV,
    xlsxEndpoint: EXPORTS.REVENUE_XLSX,
    supportsPeriod: true,
    color: "bg-green-50 text-green-600",
  },
  {
    label: "Expenses",
    description: "Expense records with categories, amounts, and dates",
    icon: TrendingDown,
    csvEndpoint: EXPORTS.EXPENSES_CSV,
    xlsxEndpoint: EXPORTS.EXPENSES_XLSX,
    supportsPeriod: true,
    color: "bg-red-50 text-red-600",
  },
  {
    label: "Outstanding Balances",
    description: "Members with pending dues and payment progress",
    icon: AlertCircle,
    csvEndpoint: EXPORTS.OUTSTANDING_CSV,
    xlsxEndpoint: EXPORTS.OUTSTANDING_XLSX,
    supportsPeriod: false,
    color: "bg-amber-50 text-amber-600",
  },
];

function buildDownloadUrl(
  endpoint: string,
  period?: Period
): string {
  const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";
  const token = tokenStore.getAccessToken();
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (period) params.set("period", period);
  return `${baseUrl}${endpoint}?${params.toString()}`;
}

export default function ExportsPage() {
  const [period, setPeriod] = useState<Period>("this_month");

  return (
    <>
      <PageHeader
        title="Data Exports"
        showBack
        backTo={ROUTES.SETTINGS}
        subtitle="Download your gym data as CSV or Excel files"
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Period selector for revenue/expenses */}
          <div className="rounded-lg border bg-card p-4">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Period (for Revenue & Expenses)
            </label>
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Export cards */}
          <div className="space-y-3">
            {EXPORT_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 rounded-lg border bg-card p-4"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  {item.supportsPeriod && (
                    <p className="mt-0.5 text-[10px] text-primary">
                      Filtered by: {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() =>
                      window.open(
                        buildDownloadUrl(
                          item.csvEndpoint,
                          item.supportsPeriod ? period : undefined
                        ),
                        "_blank"
                      )
                    }
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() =>
                      window.open(
                        buildDownloadUrl(
                          item.xlsxEndpoint,
                          item.supportsPeriod ? period : undefined
                        ),
                        "_blank"
                      )
                    }
                  >
                    <FileSpreadsheet className="mr-1 h-3 w-3" />
                    XLSX
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Help text */}
          <p className="text-center text-xs text-muted-foreground">
            Downloads open in a new tab. Files are generated fresh on each download.
          </p>
        </div>
      </div>
    </>
  );
}
