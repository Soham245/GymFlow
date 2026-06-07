import { useState, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { useExpenses, useExpenseCategories } from "../hooks/use-expenses";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermission } from "@/hooks/use-permission";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PullToRefreshIndicator } from "@/components/shared/PullToRefreshIndicator";
import { ListSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney, cn } from "@/lib/utils";
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
  const isMobile = useIsMobile();
  const canCreate = usePermission("expenses:create");
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven filters
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const sort = searchParams.get("sort") ?? "expenseDate-desc";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchInput, setSearchInput] = useState(search);
  const [showDateFilter, setShowDateFilter] = useState(!!dateFrom || !!dateTo);

  const [sortBy, sortOrder] = sort.split("-") as [string, string];

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

  const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: useCallback(() => expenses.refetch().then(() => {}), [expenses]),
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
    updateParam("search", searchInput.trim());
  }

  const hasFilters = !!search || !!categoryId || !!dateFrom || !!dateTo;

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={expenses.data ? `${expenses.data.total} total` : undefined}
        actions={
          canCreate ? (
            <Button size="sm" onClick={() => navigate(ROUTES.EXPENSE_NEW)}>
              <Plus className="h-4 w-4" />
              Record Expense
            </Button>
          ) : undefined
        }
        mobileActions={
          canCreate ? (
            <button
              onClick={() => navigate(ROUTES.EXPENSE_NEW)}
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
                placeholder="Search by description..."
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

            {/* Filter row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {/* Category chips */}
              <button
                onClick={() => updateParam("categoryId", "")}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  !categoryId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                )}
              >
                All
              </button>
              {categories.data?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateParam("categoryId", cat.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    categoryId === cat.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  {cat.name}
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

              <div className="h-4 w-px bg-border" />

              {/* Sort dropdown */}
              <div className="relative shrink-0">
                <select
                  value={sort}
                  onChange={(e) => updateParam("sort", e.target.value)}
                  className="h-7 appearance-none rounded-full border bg-background pl-2 pr-6 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ArrowUpDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              </div>
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
                <div className="divide-y rounded-lg border bg-card">
                  {expenses.data!.items.map((exp) => (
                    <ExpenseRow
                      key={exp.id}
                      expense={exp}
                      onClick={() => navigate(ROUTES.EXPENSE_DETAIL(exp.id))}
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
      </div>
    </>
  );
}

// ─── Expense Row ──────────────────────────────────────────────

function ExpenseRow({
  expense,
  onClick,
}: {
  expense: Expense;
  onClick: () => void;
}) {
  const MethodIcon = METHOD_ICONS[expense.paymentMethod] ?? Receipt;

  return (
    <button
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 active:bg-accent"
      onClick={onClick}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <MethodIcon className="h-5 w-5 text-red-700 dark:text-red-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {expense.description || expense.categoryName}
        </p>
        <p className="text-xs text-muted-foreground">
          {expense.categoryName} · {capitalize(expense.paymentMethod)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-red-700 dark:text-red-400">
          -{formatMoney(expense.amount)}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {formatDate(expense.expenseDate)}
        </p>
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
