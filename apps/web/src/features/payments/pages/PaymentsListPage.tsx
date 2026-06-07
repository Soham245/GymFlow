import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  CreditCard,
  Filter,
  ChevronDown,
  Plus,
  Banknote,
  Smartphone,
  Building,
  Calendar,
} from "lucide-react";
import { usePayments } from "../hooks/use-payments";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermission } from "@/hooks/use-permission";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PullToRefreshIndicator } from "@/components/shared/PullToRefreshIndicator";
import { ListSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import type { PaymentListItem } from "@/api/types";

const METHOD_OPTIONS = [
  { value: "", label: "All Methods" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank" },
] as const;

const METHOD_ICONS: Record<string, typeof Banknote> = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  bank_transfer: Building,
};

export default function PaymentsListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const canCreate = usePermission("payments:create");
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven filters
  const receiptSearch = searchParams.get("receipt") ?? "";
  const method = searchParams.get("method") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [receiptInput, setReceiptInput] = useState(receiptSearch);
  const [showFilters, setShowFilters] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(!!dateFrom || !!dateTo);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      receiptNumber: receiptSearch || undefined,
      paymentMethod: method || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [page, receiptSearch, method, dateFrom, dateTo]
  );

  const payments = usePayments(filters);

  const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: useCallback(() => payments.refetch().then(() => {}), [payments]),
    enabled: isMobile,
  });

  function updateParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("receipt", receiptInput.trim());
  }

  const hasFilters = !!receiptSearch || !!method || !!dateFrom || !!dateTo;

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle={payments.data ? `${payments.data.total} total` : undefined}
        actions={
          canCreate ? (
            <Button size="sm" onClick={() => navigate(ROUTES.PAYMENT_NEW)}>
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          ) : undefined
        }
        mobileActions={
          canCreate ? (
            <button
              onClick={() => navigate(ROUTES.PAYMENT_NEW)}
              className="rounded-md p-1.5 text-primary"
            >
              <Plus className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />

      <div ref={containerRef} className="overflow-y-auto">
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

        <div className="p-4 md:p-6">
          <div className="space-y-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by receipt number..."
                value={receiptInput}
                onChange={(e) => setReceiptInput(e.target.value)}
                onBlur={() => {
                  if (receiptInput.trim() !== receiptSearch) {
                    updateParam("receipt", receiptInput.trim());
                  }
                }}
                className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </form>

            {/* Filter row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {/* Payment method chips */}
              {METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateParam("method", opt.value)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    method === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  {opt.label}
                </button>
              ))}

              <div className="h-4 w-px bg-border" />

              {/* Date filter toggle */}
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  (dateFrom || dateTo)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                )}
              >
                <Calendar className="h-3 w-3" />
                Date Range
              </button>
            </div>

            {/* Date range inputs */}
            {showDateFilter && (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-muted-foreground">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => updateParam("dateFrom", e.target.value)}
                    className="mt-0.5 h-8 w-full rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-muted-foreground">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    onChange={(e) => updateParam("dateTo", e.target.value)}
                    className="mt-0.5 h-8 w-full rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.delete("dateFrom");
                        next.delete("dateTo");
                        next.delete("page");
                        return next;
                      });
                    }}
                    className="mt-3 shrink-0 text-xs text-destructive hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="mt-4">
            {payments.isLoading ? (
              <ListSkeleton count={8} />
            ) : payments.isError ? (
              <ErrorState
                title="Couldn't load payments"
                onRetry={() => payments.refetch()}
              />
            ) : payments.data!.items.length === 0 ? (
              hasFilters ? (
                <EmptyState
                  icon={Search}
                  title="No payments found"
                  description="Try adjusting your search or filters."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setReceiptInput("");
                    setSearchParams({});
                  }}
                />
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No payments yet"
                  description="Record your first payment to get started."
                  actionLabel={canCreate ? "Record Payment" : undefined}
                  onAction={canCreate ? () => navigate(ROUTES.PAYMENT_NEW) : undefined}
                />
              )
            ) : (
              <>
                <div className="divide-y rounded-lg border bg-card">
                  {payments.data!.items.map((p) => (
                    <PaymentRow
                      key={p.id}
                      payment={p}
                      onClick={() => navigate(ROUTES.PAYMENT_DETAIL(p.id))}
                    />
                  ))}
                </div>

                {payments.data!.totalPages > 1 && (
                  <Pagination
                    page={payments.data!.page}
                    totalPages={payments.data!.totalPages}
                    total={payments.data!.total}
                    onPageChange={(p) => updateParam("page", String(p))}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Payment Row ───────────────────────────────────────────────

function PaymentRow({
  payment,
  onClick,
}: {
  payment: PaymentListItem;
  onClick: () => void;
}) {
  const MethodIcon = METHOD_ICONS[payment.paymentMethod] ?? CreditCard;

  return (
    <button
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 active:bg-accent"
      onClick={onClick}
    >
      {/* Method icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <MethodIcon className="h-5 w-5 text-primary" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{payment.memberName}</p>
        <p className="text-xs text-muted-foreground">
          {payment.receiptNumber} · {capitalize(payment.paymentMethod)}
        </p>
      </div>

      {/* Amount + date */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-green-700">
          {formatMoney(payment.amount)}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {formatDate(payment.paymentDate)}
        </p>
      </div>
    </button>
  );
}

// ─── Pagination ────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} ({total} payments)
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
