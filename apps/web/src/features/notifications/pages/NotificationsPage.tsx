import { useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Play,
  CreditCard,
  IndianRupee,
  Snowflake,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Wallet,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-permission";
import { ROUTES } from "@/lib/constants";
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
  useRunAutomation,
} from "../hooks/use-notifications";
import type { InAppNotification, InAppNotificationType } from "@/api/types";

// ─── Type config ────────────────────────────────────────────────

const TYPE_CONFIG: Record<InAppNotificationType, { icon: React.ElementType; iconBg: string; iconColor: string; borderColor: string }> = {
  membership_expiring_7_days: { icon: CreditCard, iconBg: "bg-blue-100", iconColor: "text-blue-600", borderColor: "border-l-blue-500" },
  membership_expiring_3_days: { icon: CreditCard, iconBg: "bg-yellow-100", iconColor: "text-yellow-600", borderColor: "border-l-yellow-500" },
  membership_expiring_today: { icon: AlertTriangle, iconBg: "bg-red-100", iconColor: "text-red-600", borderColor: "border-l-red-500" },
  membership_expired: { icon: AlertTriangle, iconBg: "bg-red-100", iconColor: "text-red-600", borderColor: "border-l-red-500" },
  outstanding_balance: { icon: IndianRupee, iconBg: "bg-orange-100", iconColor: "text-orange-600", borderColor: "border-l-orange-500" },
  freeze_ending: { icon: Snowflake, iconBg: "bg-cyan-100", iconColor: "text-cyan-600", borderColor: "border-l-cyan-500" },
  system: { icon: Info, iconBg: "bg-gray-100", iconColor: "text-gray-600", borderColor: "border-l-gray-500" },
  membership_auto_expired: { icon: AlertTriangle, iconBg: "bg-red-100", iconColor: "text-red-600", borderColor: "border-l-red-500" },
  membership_auto_unfrozen: { icon: Snowflake, iconBg: "bg-green-100", iconColor: "text-green-600", borderColor: "border-l-green-500" },
  daily_summary_available: { icon: BarChart3, iconBg: "bg-purple-100", iconColor: "text-purple-600", borderColor: "border-l-purple-500" },
};

// ─── Action config per notification type ────────────────────────

interface NotifAction {
  label: string;
  icon: React.ElementType;
  getRoute: (n: InAppNotification) => string | null;
}

function memberIdFrom(n: InAppNotification): string | null {
  return (n.metadata?.memberId as string) ?? null;
}

function membershipIdFrom(n: InAppNotification): string | null {
  if (n.relatedEntityType === "membership" && n.relatedEntityId) return n.relatedEntityId;
  return (n.metadata?.membershipId as string) ?? null;
}

const NOTIFICATION_ACTIONS: Partial<Record<InAppNotificationType, { primary?: NotifAction; secondary?: NotifAction }>> = {
  membership_expiring_7_days: {
    primary: { label: "View Member", icon: Eye, getRoute: (n) => { const id = memberIdFrom(n); return id ? ROUTES.MEMBER_DETAIL(id) : null; } },
  },
  membership_expiring_3_days: {
    primary: { label: "View Member", icon: Eye, getRoute: (n) => { const id = memberIdFrom(n); return id ? ROUTES.MEMBER_DETAIL(id) : null; } },
  },
  membership_expiring_today: {
    primary: { label: "View Member", icon: Eye, getRoute: (n) => { const id = memberIdFrom(n); return id ? ROUTES.MEMBER_DETAIL(id) : null; } },
  },
  membership_expired: {
    primary: { label: "Renew", icon: RefreshCw, getRoute: (n) => { const id = membershipIdFrom(n); return id ? ROUTES.MEMBERSHIP_DETAIL(id) : null; } },
    secondary: { label: "View Member", icon: Eye, getRoute: (n) => { const id = memberIdFrom(n); return id ? ROUTES.MEMBER_DETAIL(id) : null; } },
  },
  membership_auto_expired: {
    primary: { label: "Renew", icon: RefreshCw, getRoute: (n) => { const id = membershipIdFrom(n); return id ? ROUTES.MEMBERSHIP_DETAIL(id) : null; } },
    secondary: { label: "View Member", icon: Eye, getRoute: (n) => { const id = memberIdFrom(n); return id ? ROUTES.MEMBER_DETAIL(id) : null; } },
  },
  outstanding_balance: {
    primary: {
      label: "Record Payment",
      icon: Wallet,
      getRoute: (n) => {
        const memberId = memberIdFrom(n);
        const membershipId = membershipIdFrom(n);
        if (!memberId) return null;
        const params = new URLSearchParams({ memberId });
        if (membershipId) params.set("membershipId", membershipId);
        return `${ROUTES.PAYMENT_NEW}?${params.toString()}`;
      },
    },
    secondary: { label: "View Member", icon: Eye, getRoute: (n) => { const id = memberIdFrom(n); return id ? ROUTES.MEMBER_DETAIL(id) : null; } },
  },
  freeze_ending: {
    primary: { label: "View Member", icon: Eye, getRoute: (n) => { const id = memberIdFrom(n); return id ? ROUTES.MEMBER_DETAIL(id) : null; } },
  },
  membership_auto_unfrozen: {
    primary: { label: "View Member", icon: Eye, getRoute: (n) => { const id = memberIdFrom(n); return id ? ROUTES.MEMBER_DETAIL(id) : null; } },
  },
};

// ─── Main Page ──────────────────────────────────────────────────

export default function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = useRole();
  const page = Number(searchParams.get("page") ?? "1");

  const goToPage = useCallback(
    (p: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (p <= 1) next.delete("page");
        else next.set("page", String(p));
        return next;
      });
    },
    [setSearchParams]
  );

  const filters = useMemo(() => ({ page, limit: 25 }), [page]);
  const { data, isLoading, isError, refetch } = useNotifications(filters);
  const unread = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const deleteNotif = useDeleteNotification();
  const runAutomation = useRunAutomation();

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
    });
  }

  function handleRunAutomation() {
    runAutomation.mutate(undefined, {
      onSuccess: (data: any) => {
        toast.success(`Automation complete: ${data.notificationsCreated} notifications created`);
      },
      onError: () => toast.error("Automation failed"),
    });
  }

  function handleMarkRead(id: string) {
    markRead.mutate(id);
  }

  function handleDelete(id: string) {
    deleteNotif.mutate(id, {
      onSuccess: () => toast.success("Notification deleted"),
    });
  }

  const unreadCount = unread.data ?? 0;

  // ─── Actions ───────────────────────────────────────────────
  const actions = (
    <div className="flex items-center gap-2">
      {role === "owner" && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRunAutomation}
          disabled={runAutomation.isPending}
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {runAutomation.isPending ? "Running..." : "Run Automation"}
        </Button>
      )}
      {unreadCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markAllRead.isPending}
        >
          <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
          Mark All Read
        </Button>
      )}
    </div>
  );

  const mobileActions = (
    <div className="flex items-center gap-1">
      {role === "owner" && (
        <button
          onClick={handleRunAutomation}
          disabled={runAutomation.isPending}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          title="Run Automation"
        >
          <Play className="h-5 w-5" />
        </button>
      )}
      {unreadCount > 0 && (
        <button
          onClick={handleMarkAllRead}
          disabled={markAllRead.isPending}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          title="Mark All Read"
        >
          <CheckCheck className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={data ? `${data.total} total` : undefined}
        actions={actions}
        mobileActions={mobileActions}
      />

      <div className="p-4 md:p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Couldn't load notifications"
            message="Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="No notifications"
            description="Notifications will appear here when membership expirations, outstanding balances, or freeze endings are detected."
            actionLabel={role === "owner" ? "Run Automation" : undefined}
            onAction={role === "owner" ? handleRunAutomation : undefined}
          />
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              {data.items.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onNavigate={(path) => navigate(path)}
                />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasMore}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Notification Card ──────────────────────────────────────────

interface NotificationCardProps {
  notification: InAppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
}

function NotificationCard({ notification: n, onMarkRead, onDelete, onNavigate }: NotificationCardProps) {
  const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
  const Icon = config.icon;
  const actions = NOTIFICATION_ACTIONS[n.type];
  const primaryRoute = actions?.primary?.getRoute(n);
  const secondaryRoute = actions?.secondary?.getRoute(n);

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg border border-border/60 border-l-[3px] bg-card shadow-sm transition-colors",
        config.borderColor,
        !n.isRead && "bg-accent/30"
      )}
    >
      {/* Top section */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-2">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", config.iconBg)}>
          <Icon className={cn("h-4 w-4", config.iconColor)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn("text-sm", n.isRead ? "font-medium" : "font-semibold")}>
              {n.title}
            </h3>
            {!n.isRead && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {n.message}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {(primaryRoute || secondaryRoute) && (
        <div className="flex items-center gap-2 px-4 pb-2">
          {primaryRoute && actions?.primary && (
            <button
              onClick={() => onNavigate(primaryRoute)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <actions.primary.icon className="h-3 w-3" />
              {actions.primary.label}
            </button>
          )}
          {secondaryRoute && actions?.secondary && (
            <button
              onClick={() => onNavigate(secondaryRoute)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
            >
              <actions.secondary.icon className="h-3 w-3" />
              {actions.secondary.label}
            </button>
          )}
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center border-t border-border/40 px-4 py-2">
        <span className="text-xs text-muted-foreground/70">
          {formatTimeAgo(n.createdAt)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {!n.isRead && (
            <button
              onClick={() => onMarkRead(n.id)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Mark as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(n.id)}
            className="rounded-md p-1 text-muted-foreground hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
