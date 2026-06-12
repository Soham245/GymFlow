import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  CreditCard,
  Filter,
  Plus,
  Wallet,
  Banknote,
  Smartphone,
  Building,
  Calendar,
  Trash2,
  X,
  Check,
  ListChecks,
  ArrowUpDown,
} from "lucide-react";
import { usePayments, useBatchDeletePayments } from "../hooks/use-payments";
import { usePermission } from "@/hooks/use-permission";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ListSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PaymentListItem } from "@/api/types";

const METHOD_OPTIONS = [
  { value: "", label: "All Methods" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank" },
] as const;

const SORT_OPTIONS = [
  { value: "paymentDate-desc", label: "Date (Newest)" },
  { value: "paymentDate-asc", label: "Date (Oldest)" },
  { value: "amount-desc", label: "Amount (High → Low)" },
  { value: "amount-asc", label: "Amount (Low → High)" },
] as const;

const METHOD_ICONS: Record<string, typeof Banknote> = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  bank_transfer: Building,
};

export default function PaymentsListPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("payments:create");
  const isOwner = usePermission("payments:delete");
  const [searchParams, setSearchParams] = useSearchParams();

  const receiptSearch = searchParams.get("receipt") ?? "";
  const method = searchParams.get("method") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const sort = searchParams.get("sort") ?? "paymentDate-desc";
  const page = Number(searchParams.get("page") ?? "1");

  const [sortBy, sortOrder] = sort.split("-") as [string, string];

  const [receiptInput, setReceiptInput] = useState(receiptSearch);
  const [showDateFilter, setShowDateFilter] = useState(!!dateFrom || !!dateTo);

  // Filter panel (mobile)
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [pendingMethod, setPendingMethod] = useState(method);
  const [pendingDateFrom, setPendingDateFrom] = useState(dateFrom);
  const [pendingDateTo, setPendingDateTo] = useState(dateTo);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const batchDelete = useBatchDeletePayments();

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      receiptNumber: receiptSearch || undefined,
      paymentMethod: method || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy,
      sortOrder,
    }),
    [page, receiptSearch, method, dateFrom, dateTo, sortBy, sortOrder]
  );

  const payments = usePayments(filters);

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

  // ── Filter Panel ─────────────────────────────────────────
  function openFilters() {
    setPendingMethod(method);
    setPendingDateFrom(dateFrom);
    setPendingDateTo(dateTo);
    setShowFilterPanel(true);
  }

  function applyFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (pendingMethod) next.set("method", pendingMethod);
      else next.delete("method");
      if (pendingDateFrom) next.set("dateFrom", pendingDateFrom);
      else next.delete("dateFrom");
      if (pendingDateTo) next.set("dateTo", pendingDateTo);
      else next.delete("dateTo");
      next.delete("page");
      return next;
    });
    setShowFilterPanel(false);
  }

  function clearPendingFilters() {
    setPendingMethod("");
    setPendingDateFrom("");
    setPendingDateTo("");
  }

  const activeFilterCount =
    (method ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const hasFilters = !!receiptSearch || !!method || !!dateFrom || !!dateTo;

  // Build active chips for mobile
  const activeChips: string[] = [];
  if (method) {
    activeChips.push(
      METHOD_OPTIONS.find((o) => o.value === method)?.label ?? method
    );
  }
  if (dateFrom || dateTo) {
    const parts = [];
    if (dateFrom) parts.push(formatDate(dateFrom));
    if (dateTo) parts.push(formatDate(dateTo));
    activeChips.push(parts.join(" – "));
  }

  // ── Selection Helpers ────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected =
    !!payments.data &&
    payments.data.items.length > 0 &&
    selectedIds.size === payments.data.items.length;

  function toggleSelectAll() {
    if (!payments.data) return;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payments.data.items.map((p) => p.id)));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }

  async function handleBatchDelete() {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (
      !window.confirm(
        `Delete ${count} payment${count > 1 ? "s" : ""}? This will also update linked membership balances. This cannot be undone.`
      )
    )
      return;

    try {
      const result = await batchDelete.mutateAsync(Array.from(selectedIds));
      toast.success(
        `${result.deleted} payment${result.deleted > 1 ? "s" : ""} deleted`
      );
      clearSelection();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? "Failed to delete payments"
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle={payments.data ? `${payments.data.total} total` : undefined}
        actions={
          <div className="flex items-center gap-2">
            {isOwner &&
              !selectionMode &&
              payments.data &&
              payments.data.items.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectionMode(true)}
                >
                  Select
                </Button>
              )}
            {canCreate && (
              <Button size="sm" onClick={() => navigate(ROUTES.PAYMENT_NEW)}>
                <Plus className="h-4 w-4" />
                Record Payment
              </Button>
            )}
          </div>
        }
        mobileActions={
          isOwner &&
          !selectionMode &&
          payments.data &&
          payments.data.items.length > 0 ? (
            <button
              onClick={() => setSelectionMode(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Select payments"
            >
              <ListChecks className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />

      <div className="p-4 pb-24 md:p-6 md:pb-6">
          {/* ─── Selection Bar ────────────────────────────── */}
          {selectionMode && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={toggleSelectAll}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={selectedIds.size === 0 || batchDelete.isPending}
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <button
                  onClick={clearSelection}
                  className="rounded p-1 hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── Search & Filters ─────────────────────────── */}
          <div className="space-y-3">
            {/* Row 1: Search + Filter + Sort */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by receipt number or member..."
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

              <button
                onClick={openFilters}
                className={cn(
                  "relative flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
                  activeFilterCount > 0
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                <Filter className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="relative shrink-0">
                <select
                  value={sort}
                  onChange={(e) => updateParam("sort", e.target.value)}
                  className="h-10 max-w-[7.5rem] appearance-none rounded-lg border bg-background pl-3 pr-7 text-sm font-medium text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:max-w-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ArrowUpDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <span
                    key={chip}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {chip}
                  </span>
                ))}
                <button
                  onClick={() => {
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete("method");
                      next.delete("dateFrom");
                      next.delete("dateTo");
                      next.delete("page");
                      return next;
                    });
                  }}
                  className="text-xs font-medium text-destructive hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* ─── Mobile Filter Panel ─────────────────────── */}
          {showFilterPanel && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setShowFilterPanel(false)}
              />
              <div
                className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-2xl border-t bg-background shadow-2xl"
                style={{ maxHeight: "80vh" }}
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="text-sm font-semibold">Filters</h3>
                  <div className="flex items-center gap-3">
                    {(pendingMethod || pendingDateFrom || pendingDateTo) && (
                      <button
                        onClick={clearPendingFilters}
                        className="text-xs font-medium text-destructive hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilterPanel(false)}
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div
                  className="overflow-y-auto p-4"
                  style={{ maxHeight: "calc(80vh - 120px)" }}
                >
                  {/* Payment Method */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Payment Method
                    </p>
                    <div className="space-y-1">
                      {METHOD_OPTIONS.filter((o) => o.value !== "").map(
                        (opt) => (
                          <button
                            key={opt.value}
                            onClick={() =>
                              setPendingMethod(
                                pendingMethod === opt.value ? "" : opt.value
                              )
                            }
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                              pendingMethod === opt.value
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-foreground hover:bg-accent"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                                pendingMethod === opt.value
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/30"
                              )}
                            >
                              {pendingMethod === opt.value && (
                                <Check className="h-2.5 w-2.5" />
                              )}
                            </div>
                            {opt.label}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      Date Range
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-medium text-muted-foreground">
                          From
                        </label>
                        <input
                          type="date"
                          value={pendingDateFrom}
                          onChange={(e) => setPendingDateFrom(e.target.value)}
                          className="mt-0.5 h-9 w-full rounded-lg border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <span className="mt-4 text-xs text-muted-foreground">
                        –
                      </span>
                      <div className="flex-1">
                        <label className="text-[10px] font-medium text-muted-foreground">
                          To
                        </label>
                        <input
                          type="date"
                          value={pendingDateTo}
                          min={pendingDateFrom}
                          onChange={(e) => setPendingDateTo(e.target.value)}
                          className="mt-0.5 h-9 w-full rounded-lg border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t px-4 py-3">
                  <Button className="w-full" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ─── Content ─────────────────────────────────── */}
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
                  onAction={
                    canCreate
                      ? () => navigate(ROUTES.PAYMENT_NEW)
                      : undefined
                  }
                />
              )
            ) : (
              <>
                <div className="flex flex-col gap-2.5">
                  {payments.data!.items.map((p) => (
                    <PaymentCard
                      key={p.id}
                      payment={p}
                      selectionMode={selectionMode}
                      selected={selectedIds.has(p.id)}
                      onToggle={() => toggleSelect(p.id)}
                      onClick={() => {
                        if (selectionMode) {
                          toggleSelect(p.id);
                        } else {
                          navigate(ROUTES.PAYMENT_DETAIL(p.id));
                        }
                      }}
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

      {canCreate && (
        <FloatingActionButton
          icon={Wallet}
          label="Record Payment"
          onClick={() => navigate(ROUTES.PAYMENT_NEW)}
        />
      )}
    </>
  );
}

// ─── Payment Card ──────────────────────────────────────────────

function PaymentCard({
  payment,
  selectionMode,
  selected,
  onToggle,
  onClick,
}: {
  payment: PaymentListItem;
  selectionMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  const MethodIcon = METHOD_ICONS[payment.paymentMethod] ?? CreditCard;

  return (
    <button
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg border border-border/60 border-l-[3px] border-l-blue-500 bg-card text-left shadow-sm transition-colors hover:bg-accent/50 active:bg-accent",
        selected && "bg-primary/5"
      )}
      onClick={onClick}
    >
      {/* Top section: name + amount */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-2">
        {selectionMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={cn(
              "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40"
            )}
          >
            {selected && (
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        )}

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <MethodIcon className="h-5 w-5 text-blue-700 dark:text-blue-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{payment.memberName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {payment.receiptNumber}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-green-700 dark:text-green-500">
            {formatMoney(payment.amount)}
          </p>
        </div>
      </div>

      {/* Bottom section: method (left) + date (right) */}
      <div className="flex items-center border-t border-border/40 px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground/80">
          {capitalize(payment.paymentMethod)}
        </span>
        <span className="ml-auto text-xs text-muted-foreground/70">
          {formatDate(payment.paymentDate)}
        </span>
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
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
