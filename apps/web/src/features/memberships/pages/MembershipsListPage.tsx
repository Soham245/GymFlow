import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  FileText,
  Filter,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { useMemberships } from "../hooks/use-memberships";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PullToRefreshIndicator } from "@/components/shared/PullToRefreshIndicator";
import { ListSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import type { MembershipListItem } from "@/api/types";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "frozen", label: "Frozen" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "endDate:asc", label: "Expiring Soon" },
  { value: "endDate:desc", label: "Latest Expiry" },
  { value: "startDate:desc", label: "Recent Start" },
  { value: "memberName:asc", label: "Member A-Z" },
] as const;

export default function MembershipsListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven filters
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt:desc";
  const expiringSoon = searchParams.get("expiringSoon") === "true";
  const page = Number(searchParams.get("page") ?? "1");
  const [sortBy, sortOrder] = sort.split(":") as [string, string];

  const [searchInput, setSearchInput] = useState(search);
  const [showSort, setShowSort] = useState(false);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
      expiringSoon: expiringSoon || undefined,
      sortBy,
      sortOrder,
    }),
    [page, search, status, expiringSoon, sortBy, sortOrder]
  );

  const memberships = useMemberships(filters);

  const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: useCallback(() => memberships.refetch().then(() => {}), [memberships]),
    enabled: isMobile,
  });

  function updateParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  function toggleExpiringSoon() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get("expiringSoon") === "true") {
        next.delete("expiringSoon");
      } else {
        next.set("expiringSoon", "true");
        next.delete("status");
      }
      next.delete("page");
      return next;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", searchInput.trim());
  }

  const hasFilters = !!search || !!status || expiringSoon;

  return (
    <>
      <PageHeader
        title="Memberships"
        subtitle={memberships.data ? `${memberships.data.total} total` : undefined}
      />

      <div ref={containerRef} className="overflow-y-auto">
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

        <div className="p-4 md:p-6">
          {/* ─── Search & Filters ─────────────────────── */}
          <div className="space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by member name or phone..."
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

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {/* Expiring Soon chip */}
              <button
                onClick={toggleExpiringSoon}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  expiringSoon
                    ? "border-amber-500 bg-amber-100 text-amber-800"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                )}
              >
                <AlertTriangle className="h-3 w-3" />
                Expiring Soon
              </button>

              <div className="h-4 w-px bg-border" />

              {/* Status chips */}
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (expiringSoon && opt.value) {
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.delete("expiringSoon");
                        next.set("status", opt.value);
                        next.delete("page");
                        return next;
                      });
                    } else {
                      updateParam("status", opt.value);
                    }
                  }}
                  disabled={expiringSoon}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    !expiringSoon && status === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent",
                    expiringSoon && "opacity-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}

              {/* Sort */}
              <div className="relative ml-auto shrink-0">
                <button
                  onClick={() => setShowSort(!showSort)}
                  className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
                >
                  <Filter className="h-3 w-3" />
                  Sort
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showSort && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                    <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border bg-card p-1 shadow-lg">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            updateParam("sort", opt.value);
                            setShowSort(false);
                          }}
                          className={cn(
                            "w-full rounded-md px-3 py-2 text-left text-xs",
                            sort === opt.value
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-foreground hover:bg-accent"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ─── Content ─────────────────────────────── */}
          <div className="mt-4">
            {memberships.isLoading ? (
              <ListSkeleton count={8} />
            ) : memberships.isError ? (
              <ErrorState
                title="Couldn't load memberships"
                onRetry={() => memberships.refetch()}
              />
            ) : memberships.data!.items.length === 0 ? (
              hasFilters ? (
                <EmptyState
                  icon={Search}
                  title="No memberships found"
                  description="Try adjusting your search or filters."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchInput("");
                    setSearchParams({});
                  }}
                />
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No memberships yet"
                  description="Memberships are created from a member's profile."
                />
              )
            ) : (
              <>
                <div className="divide-y rounded-lg border bg-card">
                  {memberships.data!.items.map((ms) => (
                    <MembershipRow
                      key={ms.id}
                      membership={ms}
                      onClick={() => navigate(ROUTES.MEMBERSHIP_DETAIL(ms.id))}
                    />
                  ))}
                </div>

                {memberships.data!.totalPages > 1 && (
                  <Pagination
                    page={memberships.data!.page}
                    totalPages={memberships.data!.totalPages}
                    total={memberships.data!.total}
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

// ─── Membership Row ────────────────────────────────────────────

function MembershipRow({
  membership,
  onClick,
}: {
  membership: MembershipListItem;
  onClick: () => void;
}) {
  const outstanding = parseFloat(membership.outstandingAmount);
  const daysLeft = daysUntil(membership.endDate);
  const isExpiring = membership.status === "active" && daysLeft <= 7 && daysLeft >= 0;

  return (
    <button
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 active:bg-accent"
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{membership.memberName}</p>
        <p className="text-xs text-muted-foreground">{membership.planName}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {formatDate(membership.startDate)} → {formatDate(membership.endDate)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <StatusBadge status={membership.status} />
        {isExpiring && (
          <p className="mt-1 text-[10px] font-semibold text-amber-600">
            {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
          </p>
        )}
        {outstanding > 0 && (
          <p className="mt-0.5 text-[10px] font-semibold text-destructive">
            {formatMoney(outstanding)} due
          </p>
        )}
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
        Page {page} of {totalPages} ({total} memberships)
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

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
