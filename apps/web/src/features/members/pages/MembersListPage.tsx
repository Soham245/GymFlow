import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Users,
  Filter,
  ArrowUpDown,
  UserPlus,
  Trash2,
  X,
  Check,
  ListChecks,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { useMembers, useBatchDeleteMembers } from "../hooks/use-members";
import { usePermission } from "@/hooks/use-permission";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ListSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";
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
  const canCreate = usePermission("members:create");
  const isOwner = usePermission("members:delete");
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt:desc";
  const page = Number(searchParams.get("page") ?? "1");
  const [sortBy, sortOrder] = sort.split(":") as [string, string];

  const [searchInput, setSearchInput] = useState(search);

  // Filter panel (mobile)
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(status);

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

  // ── Filter Panel ─────────────────────────────────────────
  function openFilters() {
    setPendingStatus(status);
    setShowFilterPanel(true);
  }

  function applyFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (pendingStatus) next.set("status", pendingStatus);
      else next.delete("status");
      next.delete("page");
      return next;
    });
    setShowFilterPanel(false);
  }

  const activeFilterCount = status ? 1 : 0;
  const activeChip = status
    ? STATUS_OPTIONS.find((o) => o.value === status)?.label
    : null;

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
    !!members.data &&
    members.data.items.length > 0 &&
    selectedIds.size === members.data.items.length;

  function toggleSelectAll() {
    if (!members.data) return;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.data.items.map((m) => m.id)));
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
        `Delete ${count} member${count > 1 ? "s" : ""} and ALL their memberships, payments, and notes? This cannot be undone.`
      )
    )
      return;

    try {
      const result = await batchDelete.mutateAsync(Array.from(selectedIds));
      toast.success(
        `${result.deleted} member${result.deleted > 1 ? "s" : ""} deleted`
      );
      clearSelection();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? "Failed to delete members"
      );
    }
  }

  const hasFilters = !!search || !!status;

  return (
    <>
      <PageHeader
        title="Members"
        subtitle={members.data ? `${members.data.total} total` : undefined}
        actions={
          <div className="flex items-center gap-2">
            {isOwner &&
              !selectionMode &&
              members.data &&
              members.data.items.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectionMode(true)}
                >
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
          isOwner &&
          !selectionMode &&
          members.data &&
          members.data.items.length > 0 ? (
            <button
              onClick={() => setSelectionMode(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Select members"
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
            {/* Row 1: Search + Filter (mobile) + Sort */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="relative flex-1">
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
            {activeChip && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {activeChip}
                </span>
                <button
                  onClick={() => updateParam("status", "")}
                  className="text-xs font-medium text-destructive hover:underline"
                >
                  Clear
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
                style={{ maxHeight: "70vh" }}
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="text-sm font-semibold">Filters</h3>
                  <div className="flex items-center gap-3">
                    {pendingStatus && (
                      <button
                        onClick={() => setPendingStatus("")}
                        className="text-xs font-medium text-destructive hover:underline"
                      >
                        Clear
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

                <div className="p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <div className="space-y-1">
                    {STATUS_OPTIONS.filter((o) => o.value !== "").map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setPendingStatus(
                            pendingStatus === opt.value ? "" : opt.value
                          )
                        }
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                          pendingStatus === opt.value
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground hover:bg-accent"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                            pendingStatus === opt.value
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {pendingStatus === opt.value && (
                            <Check className="h-2.5 w-2.5" />
                          )}
                        </div>
                        {opt.label}
                      </button>
                    ))}
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
                  onAction={
                    canCreate
                      ? () => navigate(ROUTES.MEMBER_NEW)
                      : undefined
                  }
                />
              )
            ) : (
              <>
                <div className="flex flex-col gap-2.5">
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

      {canCreate && (
        <FloatingActionButton
          icon={UserPlus}
          label="Add Member"
          onClick={() => navigate(ROUTES.MEMBER_NEW)}
        />
      )}
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

  const ms = member.latestMembership;

  const statusBorderColor: Record<string, string> = {
    active: "border-l-green-500",
    expired: "border-l-red-400",
    frozen: "border-l-blue-500",
    inactive: "border-l-gray-400",
  };

  return (
    <button
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg border border-border/60 border-l-[3px] bg-card text-left shadow-sm transition-colors hover:bg-accent/50 active:bg-accent",
        statusBorderColor[member.status] ?? "border-l-gray-400",
        selected && "bg-primary/5"
      )}
      onClick={onClick}
    >
      {/* Top section: avatar + name/phone + status/joined */}
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

        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{member.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatPhone(member.phone)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <StatusBadge status={member.status} />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Joined {formatDate(member.joinDate)}
          </p>
        </div>
      </div>

      {/* Bottom section: membership info */}
      {ms ? (
        <div className="flex items-center gap-1 border-t border-border/40 px-4 py-2.5">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate text-xs font-medium text-muted-foreground/80">
            {ms.planName}{!ms.planName.toLowerCase().includes("plan") && " Plan"}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground/70">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/50" />
            {formatDate(ms.startDate)}
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            {formatDate(ms.endDate)}
          </span>
        </div>
      ) : (
        <div className="border-t border-border/40 px-4 py-2.5">
          <span className="text-xs text-muted-foreground/50">No active membership</span>
        </div>
      )}
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
