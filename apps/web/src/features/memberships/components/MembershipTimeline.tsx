import {
  FileText,
  Snowflake,
  Play,
  RefreshCw,
  XCircle,
  CreditCard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { PAYMENTS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import type { ApiResponse, MembershipDetail, Payment } from "@/api/types";

interface MembershipTimelineProps {
  membership: MembershipDetail;
}

// ─── Event Types ───────────────────────────────────────────────

interface TimelineEvent {
  id: string;
  type: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  date: string;
  timestamp: number;
}

// ─── Build events ──────────────────────────────────────────────

function buildEvents(membership: MembershipDetail, payments: Payment[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Created
  events.push({
    id: `ms-created-${membership.id}`,
    type: "created",
    icon: FileText,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
    title: `${membership.planName} membership created`,
    subtitle: `${formatDate(membership.startDate)} - ${formatDate(membership.endDate)} · ${formatMoney(membership.totalAmount)}`,
    date: membership.createdAt,
    timestamp: new Date(membership.createdAt).getTime(),
  });

  // Freeze events
  for (const f of membership.freezes) {
    events.push({
      id: `freeze-start-${f.id}`,
      type: "frozen",
      icon: Snowflake,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-700",
      title: "Membership frozen",
      subtitle: f.reason ?? "No reason provided",
      date: f.freezeStart,
      timestamp: new Date(f.freezeStart).getTime(),
    });

    if (f.status === "completed") {
      events.push({
        id: `freeze-end-${f.id}`,
        type: "unfrozen",
        icon: Play,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-700",
        title: "Membership unfrozen",
        subtitle: f.daysAdded ? `${f.daysAdded} day${f.daysAdded !== 1 ? "s" : ""} added to end date` : undefined,
        date: f.freezeEnd!,
        timestamp: new Date(f.freezeEnd!).getTime(),
      });
    }
  }

  // Status-based events
  if (membership.status === "expired") {
    events.push({
      id: `ms-expired-${membership.id}`,
      type: "expired",
      icon: XCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-700",
      title: "Membership expired",
      date: membership.endDate,
      timestamp: new Date(membership.endDate).getTime(),
    });
  }

  // Payments
  for (const p of payments) {
    events.push({
      id: `payment-${p.id}`,
      type: "payment",
      icon: CreditCard,
      iconBg: "bg-green-100",
      iconColor: "text-green-700",
      title: `Payment of ${formatMoney(p.amount)}`,
      subtitle: `${p.receiptNumber} · ${capitalize(p.paymentMethod)}`,
      date: p.createdAt,
      timestamp: new Date(p.createdAt).getTime(),
    });
  }

  events.sort((a, b) => b.timestamp - a.timestamp);
  return events;
}

// ─── Component ─────────────────────────────────────────────────

export function MembershipTimeline({ membership }: MembershipTimelineProps) {
  const payments = useQuery({
    queryKey: [...queryKeys.payments.detail(membership.id), "membership-payments"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ payments: Payment[] }>>(
        PAYMENTS.MEMBERSHIP_PAYMENTS(membership.id)
      );
      return res.data.data.payments;
    },
    staleTime: 60_000,
  });

  if (payments.isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.isError) {
    return (
      <ErrorState
        title="Couldn't load timeline"
        onRetry={() => payments.refetch()}
      />
    );
  }

  const events = buildEvents(membership, payments.data ?? []);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No activity yet"
        description="Activity will appear here as actions are taken."
      />
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event) => (
        <div
          key={event.id}
          className="relative border-l-2 border-muted pb-5 pl-5 last:pb-0"
        >
          <div
            className={cn(
              "absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full",
              event.iconBg
            )}
          >
            <event.icon className={cn("h-3 w-3", event.iconColor)} />
          </div>
          <div>
            <p className="text-sm font-medium">{event.title}</p>
            {event.subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{event.subtitle}</p>
            )}
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {formatDate(event.date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
