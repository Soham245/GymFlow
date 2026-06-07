import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Snowflake,
  Play,
  CreditCard,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { useMembership } from "../hooks/use-memberships";
import { MembershipHealth } from "../components/MembershipHealth";
import { MembershipTimeline } from "../components/MembershipTimeline";
import { RenewWorkflow } from "../components/RenewWorkflow";
import { FreezeDialog, UnfreezeDialog } from "../components/FreezeDialog";
import { usePermission } from "@/hooks/use-permission";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney, cn } from "@/lib/utils";

type ActivePanel = null | "renew" | "freeze" | "unfreeze";

export default function MembershipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const membership = useMembership(id!);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const canRenew = usePermission("memberships:create");
  const canFreeze = usePermission("memberships:freeze");
  const canPayment = usePermission("payments:create");

  // ─── Loading ──────────────────────────────────────────
  if (membership.isLoading) {
    return (
      <>
        <PageHeader title="Membership" showBack backTo={ROUTES.MEMBERSHIPS} />
        <div className="space-y-4 p-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (membership.isError) {
    return (
      <>
        <PageHeader title="Membership" showBack backTo={ROUTES.MEMBERSHIPS} />
        <ErrorState
          title="Couldn't load membership"
          onRetry={() => membership.refetch()}
        />
      </>
    );
  }

  const ms = membership.data!;
  const outstanding = parseFloat(ms.outstandingAmount);
  const isActive = ms.status === "active";
  const isFrozen = ms.status === "frozen";

  function handleActionComplete() {
    setActivePanel(null);
    membership.refetch();
  }

  return (
    <>
      <PageHeader
        title={ms.planName}
        showBack
        backTo={ROUTES.MEMBERSHIPS}
      />

      <div className="p-4 md:p-6">
        {/* ─── Health Card (Section D) ─────────────── */}
        <MembershipHealth membership={ms} />

        {/* ─── Primary Actions ────────────────────── */}
        {activePanel === null && (
          <div className="mt-4 flex flex-wrap gap-2">
            {canRenew && (
              <Button size="sm" onClick={() => setActivePanel("renew")}>
                <RefreshCw className="h-4 w-4" />
                Renew
              </Button>
            )}
            {canFreeze && isActive && (
              <Button size="sm" variant="outline" onClick={() => setActivePanel("freeze")}>
                <Snowflake className="h-4 w-4" />
                Freeze
              </Button>
            )}
            {canFreeze && isFrozen && (
              <Button size="sm" variant="outline" onClick={() => setActivePanel("unfreeze")}>
                <Play className="h-4 w-4" />
                Unfreeze
              </Button>
            )}
            {canPayment && outstanding > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`${ROUTES.PAYMENT_NEW}?memberId=${ms.memberId}&membershipId=${ms.id}`)}
              >
                <CreditCard className="h-4 w-4" />
                Record Payment
              </Button>
            )}
          </div>
        )}

        {/* ─── Action Panels ─────────────────────── */}
        {activePanel === "renew" && (
          <div className="mt-4">
            <RenewWorkflow
              membership={ms}
              onComplete={handleActionComplete}
              onCancel={() => setActivePanel(null)}
            />
          </div>
        )}

        {activePanel === "freeze" && (
          <div className="mt-4">
            <FreezeDialog
              membershipId={ms.id}
              onComplete={handleActionComplete}
              onCancel={() => setActivePanel(null)}
            />
          </div>
        )}

        {activePanel === "unfreeze" && (
          <div className="mt-4">
            <UnfreezeDialog
              membershipId={ms.id}
              onComplete={handleActionComplete}
              onCancel={() => setActivePanel(null)}
            />
          </div>
        )}

        {/* ─── Details Grid ──────────────────────── */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* Membership Info */}
          <SectionCard title="Membership Details">
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Plan" value={ms.planName} />
              <DetailRow label="Duration" value={`${ms.planDuration} days`} />
              <DetailRow label="Start Date" value={formatDate(ms.startDate)} />
              <DetailRow label="End Date" value={formatDate(ms.endDate)} />
              <DetailRow label="Total Amount" value={formatMoney(ms.totalAmount)} />
              <DetailRow
                label="Discount"
                value={
                  parseFloat(ms.discountAmount) > 0
                    ? formatMoney(ms.discountAmount)
                    : "None"
                }
              />
              <DetailRow label="Paid" value={formatMoney(ms.paidAmount)} />
              <DetailRow
                label="Outstanding"
                value={formatMoney(ms.outstandingAmount)}
                highlight={outstanding > 0}
              />
            </div>
            {ms.notes && (
              <div className="mt-3 border-t pt-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Notes
                </p>
                <p className="mt-0.5 text-sm">{ms.notes}</p>
              </div>
            )}
          </SectionCard>

          {/* Member Link */}
          <SectionCard title="Member">
            <button
              onClick={() => navigate(ROUTES.MEMBER_DETAIL(ms.memberId))}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">View Member Profile</p>
                <p className="text-xs text-muted-foreground">
                  See all memberships, notes and timeline
                </p>
              </div>
            </button>

            {/* Freeze History */}
            {ms.freezes.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Freeze History
                </p>
                <div className="space-y-2">
                  {ms.freezes.map((f) => (
                    <div
                      key={f.id}
                      className={cn(
                        "rounded-lg border p-2.5",
                        f.status === "active" && "border-blue-200 bg-blue-50"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">
                          {formatDate(f.freezeStart)}
                          {f.freezeEnd ? ` → ${formatDate(f.freezeEnd)}` : " → ongoing"}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            f.status === "active"
                              ? "bg-blue-200 text-blue-800"
                              : "bg-green-100 text-green-800"
                          )}
                        >
                          {f.status === "active" ? "Active" : `+${f.daysAdded}d`}
                        </span>
                      </div>
                      {f.reason && (
                        <p className="mt-1 text-[10px] text-muted-foreground">{f.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ─── Timeline (Section C) ──────────────── */}
        <div className="mt-5">
          <SectionCard title="Activity Timeline">
            <MembershipTimeline membership={ms} />
          </SectionCard>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold",
          highlight && "text-destructive"
        )}
      >
        {value}
      </p>
    </div>
  );
}
