import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone,
  Mail,
  CreditCard,
  RefreshCw,
  Snowflake,
  Play,
  AlertCircle,
} from "lucide-react";
import { useMember, useChangeStatus } from "../hooks/use-members";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { MEMBERSHIPS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import { MemberNotes } from "../components/MemberNotes";
import { MemberTimeline } from "../components/MemberTimeline";
import { usePermission } from "@/hooks/use-permission";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectionCard } from "@/components/shared/SectionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatPhone, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ApiResponse, Membership } from "@/api/types";

type Tab = "overview" | "notes" | "timeline";

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const member = useMember(id!);
  const changeStatus = useChangeStatus(id!);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const canChangeStatus = usePermission("members:status");
  const canCreatePayment = usePermission("payments:create");
  const canCreateMembership = usePermission("memberships:create");
  const canFreeze = usePermission("memberships:freeze");

  // Fetch memberships for this member
  const memberships = useQuery({
    queryKey: queryKeys.memberships.member(id!),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Membership[]>>(
        MEMBERSHIPS.MEMBER_LIST(id!)
      );
      return res.data.data;
    },
    staleTime: 60_000,
    enabled: !!id,
  });

  // ─── Loading ──────────────────────────────────────────
  if (member.isLoading) {
    return (
      <>
        <PageHeader title="Member" showBack backTo={ROUTES.MEMBERS} />
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (member.isError) {
    return (
      <>
        <PageHeader title="Member" showBack backTo={ROUTES.MEMBERS} />
        <ErrorState
          title="Couldn't load member"
          onRetry={() => member.refetch()}
        />
      </>
    );
  }

  const m = member.data!;
  const activeMembership = memberships.data?.find((ms) => ms.status === "active");
  const totalOutstanding = memberships.data?.reduce(
    (sum, ms) => sum + parseFloat(ms.outstandingAmount || "0"),
    0
  ) ?? 0;

  const initials = m.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleStatusChange(status: string) {
    try {
      await changeStatus.mutateAsync({ status });
      toast.success(`Member status changed to ${status}`);
    } catch {
      toast.error("Failed to change status");
    }
  }

  return (
    <>
      <PageHeader title={m.name} showBack backTo={ROUTES.MEMBERS} />

      <div className="p-4 md:p-6">
        {/* ─── Member Header ──────────────────────────── */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold">{m.name}</h2>
              <StatusBadge status={m.status} />
            </div>
            <a
              href={`tel:${m.phone}`}
              className="mt-0.5 flex items-center gap-1 text-sm text-primary"
            >
              <Phone className="h-3.5 w-3.5" />
              {formatPhone(m.phone)}
            </a>
            {m.email && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {m.email}
              </p>
            )}
          </div>
        </div>

        {/* ─── Key Info Card ─────────────────────────── */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
          <InfoItem
            label="Current Plan"
            value={activeMembership?.planName ?? "None"}
            loading={memberships.isLoading}
          />
          <InfoItem
            label="Expiry Date"
            value={activeMembership ? formatDate(activeMembership.endDate) : "N/A"}
            loading={memberships.isLoading}
            highlight={
              activeMembership
                ? daysUntil(activeMembership.endDate) <= 7
                : false
            }
          />
          <InfoItem
            label="Outstanding"
            value={`₹${totalOutstanding.toFixed(2)}`}
            loading={memberships.isLoading}
            highlight={totalOutstanding > 0}
          />
          <InfoItem
            label="Join Date"
            value={formatDate(m.joinDate)}
          />
        </div>

        {/* ─── Primary Actions — NOT buried ───────────── */}
        <div className="mt-4 flex flex-wrap gap-2">
          {canCreateMembership && (
            <Button
              size="sm"
              onClick={() => activeMembership ? navigate(ROUTES.MEMBERSHIP_DETAIL(activeMembership.id)) : navigate(ROUTES.MEMBERSHIPS)}
            >
              <RefreshCw className="h-4 w-4" />
              Renew
            </Button>
          )}
          {canCreatePayment && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`${ROUTES.PAYMENT_NEW}?memberId=${id}`)}
            >
              <CreditCard className="h-4 w-4" />
              Record Payment
            </Button>
          )}
          {canFreeze && activeMembership && activeMembership.status === "active" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(ROUTES.MEMBERSHIP_DETAIL(activeMembership!.id))}
            >
              <Snowflake className="h-4 w-4" />
              Freeze
            </Button>
          )}
          {canChangeStatus && m.status !== "active" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("active")}
              disabled={changeStatus.isPending}
            >
              <Play className="h-4 w-4" />
              Activate
            </Button>
          )}
        </div>

        {/* ─── Tab Navigation ────────────────────────── */}
        <div className="mt-6 flex border-b">
          {(["overview", "notes", "timeline"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ───────────────────────────── */}
        <div className="mt-4">
          {activeTab === "overview" && (
            <OverviewTab member={m} memberships={memberships.data} membershipsLoading={memberships.isLoading} />
          )}
          {activeTab === "notes" && (
            <MemberNotes memberId={m.id} />
          )}
          {activeTab === "timeline" && (
            <MemberTimeline member={m} />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Info Item ──────────────────────────────────────────────────

function InfoItem({
  label,
  value,
  loading,
  highlight,
}: {
  label: string;
  value: string;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-1 h-4 w-20" />
      ) : (
        <p
          className={cn(
            "mt-0.5 text-sm font-semibold",
            highlight && "text-destructive"
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────

function OverviewTab({
  member,
  memberships,
  membershipsLoading,
}: {
  member: NonNullable<ReturnType<typeof useMember>["data"]>;
  memberships?: Membership[];
  membershipsLoading: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      {/* Personal info */}
      <SectionCard title="Personal Information">
        <div className="grid grid-cols-2 gap-3">
          <DetailRow label="Phone" value={formatPhone(member.phone)} />
          <DetailRow label="Email" value={member.email ?? "Not provided"} />
          <DetailRow label="Gender" value={capitalize(member.gender ?? "Not specified")} />
          <DetailRow
            label="Date of Birth"
            value={member.dateOfBirth ? formatDate(member.dateOfBirth) : "Not provided"}
          />
          <DetailRow
            label="Address"
            value={member.address ?? "Not provided"}
            colSpan
          />
          <DetailRow
            label="Emergency Contact"
            value={
              member.emergencyContactName
                ? `${member.emergencyContactName}${member.emergencyContactPhone ? ` (${formatPhone(member.emergencyContactPhone)})` : ""}`
                : "Not provided"
            }
            colSpan
          />
        </div>
      </SectionCard>

      {/* Memberships */}
      <SectionCard
        title="Memberships"
        onViewAll={() => navigate(ROUTES.MEMBERSHIPS)}
      >
        {membershipsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : !memberships || memberships.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No memberships"
            description="Create a membership to get started."
          />
        ) : (
          <div className="space-y-2">
            {memberships.map((ms) => (
              <button
                key={ms.id}
                onClick={() => navigate(ROUTES.MEMBERSHIP_DETAIL(ms.id))}
                className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
              >
                <div>
                  <p className="text-sm font-medium">{ms.planName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(ms.startDate)} - {formatDate(ms.endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={ms.status} />
                  {parseFloat(ms.outstandingAmount || "0") > 0 && (
                    <p className="mt-1 text-xs font-semibold text-destructive">
                      ₹{parseFloat(ms.outstandingAmount).toFixed(2)} due
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  colSpan,
}: {
  label: string;
  value: string;
  colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
