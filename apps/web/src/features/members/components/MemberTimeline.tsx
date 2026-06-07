import {
  UserPlus,
  CreditCard,
  RefreshCw,
  Snowflake,
  Play,
  MessageSquare,
  ArrowRightLeft,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemberNotes } from "../hooks/use-members";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { MEMBERSHIPS, PAYMENTS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import type { ApiResponse, Member, Membership, Payment, MemberNote } from "@/api/types";

interface MemberTimelineProps {
  member: Member;
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

// ─── Safe Array Extraction ─────────────────────────────────────
// The backend wraps lists in objects like { memberships: [...] },
// { payments: [...] }, { notes: [...] }. React Query cache may
// serve data from a different queryFn that extracted differently.
// This helper handles every possible shape.

function extractArray<T>(data: unknown, ...keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    for (const key of keys) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as T[];
    }
    // Try common key names as fallback
    for (const key of ["items", "data"]) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as T[];
    }
  }
  return [];
}

// ─── Build events from available data ──────────────────────────

function buildEvents(
  member: Member,
  rawMemberships: unknown,
  rawPayments: unknown,
  rawNotes: unknown
): TimelineEvent[] {
  const memberships = extractArray<Membership>(rawMemberships, "memberships");
  const payments = extractArray<Payment>(rawPayments, "payments");
  const notes = extractArray<MemberNote>(rawNotes, "notes");

  const events: TimelineEvent[] = [];

  // Member created
  if (member.createdAt) {
    events.push({
      id: `member-created-${member.id}`,
      type: "member_created",
      icon: UserPlus,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700",
      title: "Member registered",
      subtitle: member.joinDate ? `Joined on ${formatDate(member.joinDate)}` : undefined,
      date: member.createdAt,
      timestamp: new Date(member.createdAt).getTime(),
    });
  }

  // Memberships
  for (const ms of memberships) {
    if (!ms || !ms.id) continue;
    events.push({
      id: `membership-${ms.id}`,
      type: "membership_created",
      icon: FileText,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-700",
      title: `${ms.planName ?? "Unknown Plan"} membership`,
      subtitle: `${ms.startDate ? formatDate(ms.startDate) : "?"} - ${ms.endDate ? formatDate(ms.endDate) : "?"} · ${formatMoney(ms.totalAmount ?? "0")}`,
      date: ms.createdAt ?? "",
      timestamp: ms.createdAt ? new Date(ms.createdAt).getTime() : 0,
    });

    // Show status-specific events
    if (ms.status === "frozen") {
      const frozenDate = ms.updatedAt ?? ms.createdAt ?? "";
      events.push({
        id: `membership-frozen-${ms.id}`,
        type: "membership_frozen",
        icon: Snowflake,
        iconBg: "bg-sky-100",
        iconColor: "text-sky-700",
        title: `${ms.planName ?? "Unknown Plan"} frozen`,
        date: frozenDate,
        timestamp: frozenDate ? new Date(frozenDate).getTime() : 0,
      });
    }
  }

  // Payments
  for (const p of payments) {
    if (!p || !p.id) continue;
    events.push({
      id: `payment-${p.id}`,
      type: "payment",
      icon: CreditCard,
      iconBg: "bg-green-100",
      iconColor: "text-green-700",
      title: `Payment of ${formatMoney(p.amount ?? "0")}`,
      subtitle: `${p.receiptNumber ?? "—"} · ${capitalize(p.paymentMethod ?? "")}${p.planName ? ` · ${p.planName}` : ""}`,
      date: p.createdAt ?? "",
      timestamp: p.createdAt ? new Date(p.createdAt).getTime() : 0,
    });
  }

  // Notes
  for (const n of notes) {
    if (!n || !n.id) continue;
    const content = n.content ?? "";
    events.push({
      id: `note-${n.id}`,
      type: "note",
      icon: MessageSquare,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-700",
      title: "Note added",
      subtitle: content.length > 80 ? content.slice(0, 80) + "..." : content,
      date: n.createdAt ?? "",
      timestamp: n.createdAt ? new Date(n.createdAt).getTime() : 0,
    });
  }

  // Sort by date descending (newest first)
  events.sort((a, b) => b.timestamp - a.timestamp);

  return events;
}

// ─── Component ─────────────────────────────────────────────────

export function MemberTimeline({ member }: MemberTimelineProps) {
  const notes = useMemberNotes(member.id);

  const memberships = useQuery({
    queryKey: queryKeys.memberships.member(member.id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ memberships: Membership[] }>>(
        MEMBERSHIPS.MEMBER_LIST(member.id)
      );
      // Defensive: handle both { memberships: [...] } and raw [...]
      const d = res.data.data;
      if (Array.isArray(d)) return d;
      if (d && typeof d === "object" && "memberships" in d) return d.memberships;
      return [];
    },
    staleTime: 60_000,
  });

  const payments = useQuery({
    queryKey: queryKeys.payments.member(member.id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ payments: Payment[] }>>(
        PAYMENTS.MEMBER_PAYMENTS(member.id)
      );
      // Defensive: handle both { payments: [...] } and raw [...]
      const d = res.data.data;
      if (Array.isArray(d)) return d;
      if (d && typeof d === "object" && "payments" in d) return d.payments;
      return [];
    },
    staleTime: 60_000,
  });

  const isLoading = notes.isLoading || memberships.isLoading || payments.isLoading;
  const isError = notes.isError || memberships.isError || payments.isError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
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

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load timeline"
        onRetry={() => {
          notes.refetch();
          memberships.refetch();
          payments.refetch();
        }}
      />
    );
  }

  // Pass raw data — buildEvents handles every shape defensively
  const events = buildEvents(
    member,
    memberships.data,
    payments.data,
    notes.data
  );

  if (events.length === 0) {
    return (
      <EmptyState
        icon={ArrowRightLeft}
        title="No activity yet"
        description="Activity will appear here as actions are taken."
      />
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, idx) => (
        <div
          key={event.id}
          className="relative border-l-2 border-muted pb-5 pl-5 last:pb-0"
        >
          {/* Timeline dot */}
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
            {event.date && (
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {formatDate(event.date)}
              </p>
            )}
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
