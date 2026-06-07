import { useState } from "react";
import {
  Clock,
  AlertTriangle,
  CalendarX,
  BarChart3,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import {
  useExpiringMemberships,
  useExpiredMemberships,
  useDailySummary,
  useBackupStatus,
} from "../hooks/use-settings";

export default function AutomationPage() {
  return (
    <>
      <PageHeader
        title="Automation"
        showBack
        backTo={ROUTES.SETTINGS}
        subtitle="Automated membership tracking and system health"
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <ExpiringMembershipsCard />
          <ExpiredMembershipsCard />
          <DailySummaryCard />
          <BackupStatusCard />
        </div>
      </div>
    </>
  );
}

// ─── Expiring Memberships ─────────────────────────────────────

function ExpiringMembershipsCard() {
  const { data, isLoading, isError, refetch, isRefetching } = useExpiringMemberships();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <CardSkeleton />;
  if (isError) return <ErrorState title="Couldn't load expiring memberships" onRetry={refetch} />;
  if (!data) return null;

  const sections = [
    { key: "1day", label: "Expiring Tomorrow", count: data.expiring1Day.count, members: data.expiring1Day.members, color: "text-red-600 bg-red-50" },
    { key: "3days", label: "Expiring in 3 Days", count: data.expiring3Days.count, members: data.expiring3Days.members, color: "text-amber-600 bg-amber-50" },
    { key: "7days", label: "Expiring in 7 Days", count: data.expiring7Days.count, members: data.expiring7Days.members, color: "text-blue-600 bg-blue-50" },
  ];

  const totalExpiring = data.expiring1Day.count + data.expiring3Days.count + data.expiring7Days.count;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Expiring Memberships</h3>
            <p className="text-xs text-muted-foreground">
              {totalExpiring} membership{totalExpiring !== 1 ? "s" : ""} expiring soon
            </p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
        </Button>
      </div>

      <div className="divide-y">
        {sections.map((s) => (
          <div key={s.key}>
            <button
              onClick={() => setExpanded(expanded === s.key ? null : s.key)}
              className="flex w-full items-center justify-between p-3 text-left hover:bg-accent/50"
            >
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", s.color)}>
                  {s.count}
                </span>
                <span className="text-sm">{s.label}</span>
              </div>
              {s.count > 0 && (
                expanded === s.key ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {expanded === s.key && s.members.length > 0 && (
              <div className="border-t bg-muted/30 px-4 py-2 space-y-2">
                {s.members.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{m.memberName}</span>
                      <span className="text-muted-foreground">· {m.planName}</span>
                    </div>
                    <span className={cn(
                      "font-medium",
                      m.daysLeft <= 1 ? "text-red-600" : m.daysLeft <= 3 ? "text-amber-600" : "text-blue-600"
                    )}>
                      {m.daysLeft === 0 ? "Today" : m.daysLeft === 1 ? "1 day" : `${m.daysLeft} days`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {data.generatedAt && (
        <div className="border-t px-4 py-2">
          <p className="text-[10px] text-muted-foreground">
            Generated: {formatDate(data.generatedAt)}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Expired Memberships ──────────────────────────────────────

function ExpiredMembershipsCard() {
  const { data, isLoading, isError, refetch, isRefetching } = useExpiredMemberships();

  if (isLoading) return <CardSkeleton />;
  if (isError) return <ErrorState title="Couldn't load expired memberships" onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <CalendarX className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Expired Memberships</h3>
            <p className="text-xs text-muted-foreground">
              {data.count} membership{data.count !== 1 ? "s" : ""} currently expired
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-red-600">{data.count}</span>
          <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Daily Summary ────────────────────────────────────────────

function DailySummaryCard() {
  const { data, isLoading, isError, refetch, isRefetching } = useDailySummary();

  if (isLoading) return <CardSkeleton />;
  if (isError) return <ErrorState title="Couldn't load daily summary" onRetry={refetch} />;
  if (!data) return null;

  // Render whatever fields the backend returns
  const entries = Object.entries(data).filter(
    ([k]) => k !== "generatedAt" && k !== "gymId"
  );

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Daily Summary</h3>
            <p className="text-xs text-muted-foreground">Today's key metrics</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
        </Button>
      </div>

      <div className="divide-y">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs capitalize text-muted-foreground">
              {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
            </span>
            <span className="text-sm font-medium">
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="px-4 py-3 text-center text-xs text-muted-foreground">
            No summary data available
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Backup Status ────────────────────────────────────────────

function BackupStatusCard() {
  const { data, isLoading, isError, refetch, isRefetching } = useBackupStatus();

  if (isLoading) return <CardSkeleton />;
  if (isError) return <ErrorState title="Couldn't load backup status" onRetry={refetch} />;
  if (!data) return null;

  const entries = Object.entries(data).filter(([k]) => k !== "gymId");

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Backup Status</h3>
            <p className="text-xs text-muted-foreground">Database backup information</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
        </Button>
      </div>

      <div className="divide-y">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs capitalize text-muted-foreground">
              {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
            </span>
            <span className="text-sm font-medium">
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="px-4 py-3 text-center text-xs text-muted-foreground">
            No backup data available
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Shared skeleton ──────────────────────────────────────────

function CardSkeleton() {
  return <Skeleton className="h-28 rounded-lg" />;
}
