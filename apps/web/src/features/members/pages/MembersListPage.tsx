import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Users, Filter, ChevronDown, UserPlus, Trash2, X } from "lucide-react";
import { useMembers, useBatchDeleteMembers } from "../hooks/use-members";
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
import { formatDate, formatPhone, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MemberListItem } from "@/api/types";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "frozen", label: "Frozen" },
  { value: "inactive", label: "Inactive" },
] as const;

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "createdAt:asc", label: "Oldest First" },
  { value: "name:asc", label: "Name A-Z" },
  { value: "name:desc", label: "Name Z-A" },
  { value: "joinDate:desc", label: "Recent Joiners" },
] as const;

export default function MembersListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const canCreate = usePermission("members:create");
  const isOwner = usePermission("members:delete");
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven filters
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt:desc";
  const page = Number(searchParams.get("page") ?? "1");
  const [sortBy, sortOrder] = sort.split(":") as [string, string];

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const batchDelete = useBatchDeleteMembers();

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
      sortBy,
      sortOrder,
    }),
    [page, search, status, sortBy, sortOrder]
  );

  const members = useMembers(filters);

  // Pull-to-refresh
  const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: useCallback(() => members.refetch().then(() => {}), [members]),
    enabled: isMobile && !selectionMode,
  });

  // ── URL Param Helpers ──────────────────────────────────────
  function updateParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      // Reset to page 1 when filters change
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", searchInput.trim());
  }

  // ── Selection Helpers ─────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (!members.data) return;
    const allIds = members.data.items.map((m) => m.id);
    setSelectedIds(new Set(allIds));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }

  async function handleBatchDelete() {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!window.confirm(`Delete ${count} member${count > 1 ? "s" : ""} and ALL their memberships, payments, and notes? This cannot be undone.`)) return;

    try {
      const result = await batchDelete.mutateAsync(Array.from(selectedIds));
      toast.success(`${result.deleted} member${result.deleted > 1 ? "s" : ""} deleted`);
      clearSelection();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Failed to delete members");
    }
  }

  return (
    <>
      <PageHeader
        title="Members"
        subtitle={members.data ? `${members.data.total} total` : undefined}
        actions={
          <div className="flex items-center gap-2">
            {isOwner && !selectionMode && members.data && members.data.items.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => setSelectionMode(true)}>
                Select
              </Button>
            )}
            {canCreate && (
              <Button size="sm" onClick={() => navigate(ROUTES.MEMBER_NEW)}>
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        }
        mobileActions={
          canCreate ? (
            <button
              onClick={() => navigate(ROUTES.MEMBER_NEW)}
              className="rounded-md p-1.5 text-primary"
            >
              <UserPlus className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />

      <div ref={containerRef} className="overflow-y-auto">
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

        <div className="p-4 md:p-6">
          {/* ─── Selection Bar ────────────────────────────── */}
          {selectionMode && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={selectAll}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Select All
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
                <button onClick={clearSelection} className="rounded p-1 hover:bg-accent">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── Search & Filters ─────────────────────────── */}
          <div className="space-y-3">
            {/* Search bar — always visible */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or phone..."
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
              {/* Status chips */}
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateParam("status", opt.value)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    status === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  {opt.label}
                </button>
              ))}

              {/* Sort dropdown */}
              <div className="relative ml-auto shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
                >
                  <Filter className="h-3 w-3" />
                  Sort
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showFilters && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                    <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border bg-card p-1 shadow-lg">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            updateParam("sort", opt.value);
                            setShowFilters(false);
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

          {/* ─── Content ─────────────────────────────────── */}
          <div className="mt-4">
            {members.isLoading ? (
              <ListSkeleton count={8} />
            ) : members.isError ? (
              <ErrorState
                title="Couldn't load members"
                onRetry={() => members.refetch()}
              />
            ) : members.data!.items.length === 0 ? (
              search || status ? (
                <EmptyState
                  icon={Search}
                  title="No members found"
                  description="Try adjusting your search or filters."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchInput("");
                    setSearchParams({});
                  }}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="No members yet"
                  description="Add your first gym member to get started."
                  actionLabel={canCreate ? "Add Member" : undefined}
                  onAction={canCreate ? () => navigate(ROUTES.MEMBER_NEW) : undefined}
                />
              )
            ) : (
              <>
                {/* Member list */}
                <div className="divide-y rounded-lg border bg-card">
                  {members.data!.items.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      selectionMode={selectionMode}
                      selected={selectedIds.has(m.id)}
                      onToggle={() => toggleSelect(m.id)}
                      onClick={() => {
                        if (selectionMode) {
                          toggleSelect(m.id);
                        } else {
                          navigate(ROUTES.MEMBER_DETAIL(m.id));
                        }
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {members.data!.totalPages > 1 && (
                  <Pagination
                    page={members.data!.page}
                    totalPages={members.data!.totalPages}
                    total={members.data!.total}
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

// ─── Member Row ─────────────────────────────────────────────────

function MemberRow({
  member,
  selectionMode,
  selected,
  onToggle,
  onClick,
}: {
  member: MemberListItem;
  selectionMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 active:bg-accent",
        selected && "bg-primary/5"
      )}
      onClick={onClick}
    >
      {/* Checkbox */}
      {selectionMode && (
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40"
          )}
        >
          {selected && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">{formatPhone(member.phone)}</p>
      </div>

      {/* Status + join date */}
      <div className="shrink-0 text-right">
        <StatusBadge status={member.status} />
        <p className="mt-1 text-[10px] text-muted-foreground">
          Joined {formatDate(member.joinDate)}
        </p>
      </div>
    </button>
  );
}

// ─── Pagination ─────────────────────────────────────────────────

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
        Page {page} of {totalPages} ({total} members)
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
