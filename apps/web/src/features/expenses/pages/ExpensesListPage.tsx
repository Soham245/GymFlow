import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  Calendar,
  ArrowUpDown,
  Receipt,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  Filter,
  Trash2,
  X,
  Check,
  ListChecks,
} from "lucide-react";
import { useExpenses, useExpenseCategories, useBatchDeleteExpenses } from "../hooks/use-expenses";
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
import type { Expense } from "@/api/types";

const METHOD_ICONS: Record<string, typeof Banknote> = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  bank_transfer: Building,
};

const SORT_OPTIONS = [
  { value: "expenseDate-desc", label: "Date (Newest)" },
  { value: "expenseDate-asc", label: "Date (Oldest)" },
  { value: "amount-desc", label: "Amount (High → Low)" },
  { value: "amount-asc", label: "Amount (Low → High)" },
] as const;

export default function ExpensesListPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("expenses:create");
  const isOwner = usePermission("expenses:delete");
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven filters
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const sort = searchParams.get("sort") ?? "expenseDate-desc";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);

  // Pending filter state (applied on "Apply")
  const selectedCategoryIds = useMemo(
    () => new Set(categoryId ? categoryId.split(",") : []),
    [categoryId]
  );
  const [pendingCategories, setPendingCategories] = useState<Set<string>>(selectedCategoryIds);
  const [pendingDateFrom, setPendingDateFrom] = useState(dateFrom);
  const [pendingDateTo, setPendingDateTo] = useState(dateTo);

  const [sortBy, sortOrder] = sort.split("-") as [string, string];

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const batchDelete = useBatchDeleteExpenses();

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      categoryId: categoryId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy,
      sortOrder,
    }),
    [page, search, categoryId, dateFrom, dateTo, sortBy, sortOrder]
  );

  const expenses = useExpenses(filters);
  const categories = useExpenseCategories();

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
    updateParam("search", searchInput.trim());
  }

  function openFilters() {
    setPendingCategories(new Set(selectedCategoryIds));
    setPendingDateFrom(dateFrom);
    setPendingDateTo(dateTo);
    setShowFilters(true);
  }

  function togglePendingCategory(id: string) {
    setPendingCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const catStr = Array.from(pendingCategories).join(",");
      if (catStr) next.set("categoryId", catStr);
      else next.delete("categoryId");
      if (pendingDateFrom) next.set("dateFrom", pendingDateFrom);
      else next.delete("dateFrom");
      if (pendingDateTo) next.set("dateTo", pendingDateTo);
      else next.delete("dateTo");
      next.delete("page");
      return next;
    });
    setShowFilters(false);
  }

  function clearAllFilters() {
    setPendingCategories(new Set());
    setPendingDateFrom("");
    setPendingDateTo("");
  }

  const activeFilterCount =
    (categoryId ? categoryId.split(",").length : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const hasFilters = !!search || !!categoryId || !!dateFrom || !!dateTo;

  // Build active filter summary chips
  const activeChips: string[] = [];
  if (categoryId && categories.data) {
    const ids = categoryId.split(",");
    const names = ids
      .map((id) => categories.data!.find((c) => c.id === id)?.name)
      .filter(Boolean);
    if (names.length <= 2) {
      activeChips.push(names.join(", "));
    } else {
      activeChips.push(`${names.length} categories`);
    }
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
    !!expenses.data &&
    expenses.data.items.length > 0 &&
    selectedIds.size === expenses.data.items.length;

  function toggleSelectAll() {
    if (!expenses.data) return;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.data.items.map((e) => e.id)));
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
        `Delete ${count} expense${count > 1 ? "s" : ""}? This cannot be undone.`
      )
    )
      return;

    try {
      const result = await batchDelete.mutateAsync(Array.from(selectedIds));
      toast.success(
        `${result.deleted} expense${result.deleted > 1 ? "s" : ""} deleted`
      );
      clearSelection();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? "Failed to delete expenses"
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={expenses.data ? `${expenses.data.total} total` : undefined}
        actions={
          <div className="flex items-center gap-2">
            {isOwner &&
              !selectionMode &&
              expenses.data &&
              expenses.data.items.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectionMode(true)}
                >
                  Select
                </Button>
              )}
            {canCreate && (
              <Button size="sm" onClick={() => navigate(ROUTES.EXPENSE_NEW)}>
                <Plus className="h-4 w-4" />
                Record Expense
              </Button>
            )}
          </div>
        }
        mobileActions={
          isOwner &&
          !selectionMode &&
          expenses.data &&
          expenses.data.items.length > 0 ? (
            <button
              onClick={() => setSelectionMode(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Select expenses"
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

          <div className="space-y-3">
            {/* Search + Filter + Sort row */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by description or category..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onBlur={() => {
                    if (searchInput.trim() !== search) {
                      updateParam("search", searchInput.trim());
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
                      next.delete("categoryId");
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

          {/* ─── Filter Panel (overlay) ───────────────── */}
          {showFilters && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setShowFilters(false)}
              />
              <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-2xl border-t bg-background shadow-2xl md:inset-auto md:right-4 md:top-auto md:mt-2 md:w-96 md:rounded-xl md:border md:shadow-xl"
                style={{ maxHeight: "80vh" }}
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="text-sm font-semibold">Filters</h3>
                  <div className="flex items-center gap-3">
                    {(pendingCategories.size > 0 || pendingDateFrom || pendingDateTo) && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs font-medium text-destructive hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(80vh - 120px)" }}>
                  {/* Categories */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Categories
                    </p>
                    <div className="space-y-1">
                      {categories.data?.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => togglePendingCategory(cat.id)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                            pendingCategories.has(cat.id)
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-foreground hover:bg-accent"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                              pendingCategories.has(cat.id)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {pendingCategories.has(cat.id) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                          {cat.name}
                        </button>
                      ))}
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
                        <label className="text-[10px] font-medium text-muted-foreground">From</label>
                        <input
                          type="date"
                          value={pendingDateFrom}
                          onChange={(e) => setPendingDateFrom(e.target.value)}
                          className="mt-0.5 h-9 w-full rounded-lg border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <span className="mt-4 text-xs text-muted-foreground">–</span>
                      <div className="flex-1">
                        <label className="text-[10px] font-medium text-muted-foreground">To</label>
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

                {/* Apply button */}
                <div className="border-t px-4 py-3">
                  <Button className="w-full" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Content */}
          <div className="mt-4">
            {expenses.isLoading ? (
              <ListSkeleton count={8} />
            ) : expenses.isError ? (
              <ErrorState
                title="Couldn't load expenses"
                onRetry={() => expenses.refetch()}
              />
            ) : expenses.data!.items.length === 0 ? (
              hasFilters ? (
                <EmptyState
                  icon={Search}
                  title="No expenses found"
                  description="Try adjusting your search or filters."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchInput("");
                    setSearchParams({});
                  }}
                />
              ) : (
                <EmptyState
                  icon={Receipt}
                  title="No expenses yet"
                  description="Record your first expense to start tracking."
                  actionLabel={canCreate ? "Record Expense" : undefined}
                  onAction={canCreate ? () => navigate(ROUTES.EXPENSE_NEW) : undefined}
                />
              )
            ) : (
              <>
                <div className="flex flex-col gap-2.5">
                  {expenses.data!.items.map((exp) => (
                    <ExpenseCard
                      key={exp.id}
                      expense={exp}
                      selectionMode={selectionMode}
                      selected={selectedIds.has(exp.id)}
                      onToggle={() => toggleSelect(exp.id)}
                      onClick={() => {
                        if (selectionMode) {
                          toggleSelect(exp.id);
                        } else {
                          navigate(ROUTES.EXPENSE_DETAIL(exp.id));
                        }
                      }}
                    />
                  ))}
                </div>

                {expenses.data!.totalPages > 1 && (
                  <Pagination
                    page={expenses.data!.page}
                    totalPages={expenses.data!.totalPages}
                    total={expenses.data!.total}
                    onPageChange={(p) => updateParam("page", String(p))}
                  />
                )}
              </>
            )}
          </div>
        </div>

      {canCreate && (
        <FloatingActionButton
          icon={Receipt}
          label="Add Expense"
          onClick={() => navigate(ROUTES.EXPENSE_NEW)}
        />
      )}
    </>
  );
}

// ─── Expense Card ─────────────────────────────────────────────

function ExpenseCard({
  expense,
  selectionMode,
  selected,
  onToggle,
  onClick,
}: {
  expense: Expense;
  selectionMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg border border-border/60 border-l-[3px] border-l-red-400 bg-card text-left shadow-sm transition-colors hover:bg-accent/50 active:bg-accent",
        selected && "bg-primary/5"
      )}
      onClick={onClick}
    >
      {/* Top section: category + description + amount */}
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

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Receipt className="h-5 w-5 text-red-700 dark:text-red-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {expense.description || expense.categoryName}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {expense.categoryName}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-red-700 dark:text-red-400">
            -{formatMoney(expense.amount)}
          </p>
        </div>
      </div>

      {/* Bottom section: method (left) + date (right) */}
      <div className="flex items-center border-t border-border/40 px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground/80">
          {capitalize(expense.paymentMethod)}
        </span>
        <span className="ml-auto text-xs text-muted-foreground/70">
          {formatDate(expense.expenseDate)}
        </span>
      </div>
    </button>
  );
}

// ─── Pagination ───────────────────────────────────────────────

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
        Page {page} of {totalPages} ({total} expenses)
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
