import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Receipt,
  UserPlus,
  Users,
  Clock,
  CalendarClock,
  Wallet,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-permission";
import {
  useDashboard,
  useActivitySummary,
  useActivitySummaryPrev,
  useExpiringMemberships,
  useOutstandingBalances,
} from "../hooks/use-dashboard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { ActionCard } from "@/components/shared/ActionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ROUTES } from "@/lib/constants";
import { formatMoney, formatCompactMoney, formatDate, formatRelativeDate } from "@/lib/utils";
import { FloatingActionMenu } from "@/components/shared/FloatingActionMenu";
import type { ExpiringMember } from "@/api/types";

// ─── Main Dashboard Page ───────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const role = useRole();
  const navigate = useNavigate();
  const dashboard = useDashboard();
  const expiring = useExpiringMemberships();
  const outstanding = useOutstandingBalances();


  // ─── Loading ────────────────────────────────────────────────
  if (dashboard.isLoading) {
    return (
      <>
        <PageHeader title={`Hi, ${user?.name.split(" ")[0] ?? "there"}`} subtitle={todayLabel()} />
        <DashboardSkeleton />
      </>
    );
  }

  // ─── Error ──────────────────────────────────────────────────
  if (dashboard.isError) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorState
          title="Couldn't load dashboard"
          message="Check your internet connection and try again."
          onRetry={() => dashboard.refetch()}
        />
      </>
    );
  }

  const data = dashboard.data!;

  return (
    <>
      <PageHeader title={`Hi, ${user?.name.split(" ")[0] ?? "there"}`} subtitle={todayLabel()} />

      <div className="space-y-5 p-4 pb-24 md:p-6 md:pb-6">
          {/* ─── Last Updated ───────────────────────────────── */}
          <LastUpdated
            dataUpdatedAt={dashboard.dataUpdatedAt}
            isFetching={dashboard.isFetching}
          />

          {/* ─── Section A: Activity Summary ─────────────────── */}
          {role === "owner" && (
            <ActivitySummarySection
              outstandingBalance={data.outstandingBalance}
              onOutstandingClick={() => navigate(ROUTES.REPORT_OUTSTANDING)}
            />
          )}

          {/* ─── Section C: Attention Required ──────────────── */}
          <AttentionSection
            expiring={expiring.data}
            isLoading={expiring.isLoading}
            isError={expiring.isError}
            onRetry={() => expiring.refetch()}
            onMemberClick={(memberId) => navigate(ROUTES.MEMBER_DETAIL(memberId))}
            onRenew={(membershipId) => navigate(ROUTES.MEMBERSHIP_DETAIL(membershipId))}
          />

          {/* ─── Section C: Outstanding Balances ─────────────── */}
          <OutstandingSection
            data={outstanding.data}
            isLoading={outstanding.isLoading}
            isError={outstanding.isError}
            onRetry={() => outstanding.refetch()}
            onMemberClick={(memberId) => navigate(ROUTES.MEMBER_DETAIL(memberId))}
            onPayment={(memberId, membershipId) => navigate(`${ROUTES.PAYMENT_NEW}?memberId=${memberId}&membershipId=${membershipId}`)}
            onViewAll={() => navigate(ROUTES.REPORT_OUTSTANDING)}
          />

          {/* ─── Section D: Recent Activity ──────────────────── */}
          <div className="grid gap-5 md:grid-cols-2 [&>*]:min-w-0">
            <SectionCard
              title="Recent Payments"
              count={data.recentPayments.length > 5 ? data.recentPayments.length : undefined}
              onViewAll={() => navigate(ROUTES.PAYMENTS)}
              viewAllLabel={data.recentPayments.length > 5 ? `View All (${data.recentPayments.length})` : "View All"}
            >
              {data.recentPayments.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No payments yet"
                  description="Payments will appear here as they're recorded."
                />
              ) : (
                <div className="-mx-3 divide-y">
                  {data.recentPayments.slice(0, 5).map((p) => (
                    <ActionCard
                      key={p.id}
                      title={p.memberName}
                      subtitle={`${p.receiptNumber} · ${capitalize(p.paymentMethod)}`}
                      value={formatMoney(p.amount)}
                      valueSubtitle={formatRelativeDate(p.paymentDate)}
                      icon={CreditCard}
                      iconBg="bg-green-100"
                      iconColor="text-green-700"
                      onClick={() => navigate(ROUTES.PAYMENT_DETAIL(p.id))}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Recent Expenses"
              count={data.recentExpenses.length > 5 ? data.recentExpenses.length : undefined}
              onViewAll={() => navigate(ROUTES.EXPENSES)}
              viewAllLabel={data.recentExpenses.length > 5 ? `View All (${data.recentExpenses.length})` : "View All"}
            >
              {data.recentExpenses.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No expenses yet"
                  description="Track your gym expenses to monitor profitability."
                />
              ) : (
                <div className="-mx-3 divide-y">
                  {data.recentExpenses.slice(0, 5).map((e) => (
                    <ActionCard
                      key={e.id}
                      title={e.categoryName}
                      subtitle={e.description || "No description"}
                      value={formatMoney(e.amount)}
                      valueSubtitle={formatRelativeDate(e.expenseDate)}
                      icon={Receipt}
                      iconBg="bg-red-100"
                      iconColor="text-red-700"
                      onClick={() => navigate(ROUTES.EXPENSE_DETAIL(e.id))}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ─── Member Overview (compact) ───────────────────── */}
          <SectionCard
            title="Members"
            onViewAll={() => navigate(ROUTES.MEMBERS)}
          >
            <div className="grid grid-cols-4 gap-3 text-center">
              <MiniStat label="Total" value={data.members.total} />
              <MiniStat label="Active" value={data.members.active} color="text-green-700" />
              <MiniStat label="Expired" value={data.members.expired} color="text-red-600" />
              <MiniStat label="Frozen" value={data.members.frozen} color="text-blue-600" />
            </div>
          </SectionCard>
        </div>

      <FloatingActionMenu />
    </>
  );
}

// ─── Activity Summary Section ──────────────────────────────────

type ActivityRange = "today" | "last7days" | "last30days";
const ACTIVITY_RANGE_LABELS: Record<ActivityRange, string> = {
  today: "Today",
  last7days: "Last 7 Days",
  last30days: "Last 30 Days",
};

interface ActivitySummarySectionProps {
  outstandingBalance: string;
  prevOutstandingBalance?: string;
  onOutstandingClick: () => void;
}

const PREV_LABEL: Record<ActivityRange, string> = {
  today: "vs Yesterday",
  last7days: "vs Prev 7 Days",
  last30days: "vs Prev 30 Days",
};

function parseMoney(s: string): number {
  return Number(s.replace(/[^0-9.-]/g, "")) || 0;
}

function calcChange(current: number, previous: number): { pct: string; dir: "up" | "down" | "flat" } {
  if (previous === 0 && current === 0) return { pct: "0", dir: "flat" };
  if (previous === 0) return { pct: "∞", dir: "up" };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return {
    pct: Math.abs(pct).toFixed(1) + "%",
    dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
  };
}

function calcDelta(current: number, previous: number): { delta: string; dir: "up" | "down" | "flat" } {
  const diff = current - previous;
  return {
    delta: String(Math.abs(diff)),
    dir: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
  };
}

function ActivitySummarySection({ outstandingBalance, onOutstandingClick }: ActivitySummarySectionProps) {
  const [range, setRange] = useState<ActivityRange>("today");
  const summary = useActivitySummary(range);
  const prev = useActivitySummaryPrev(range);

  const d = summary.data;
  const p = prev.data;

  const revChange = d && p ? calcChange(parseMoney(d.revenue.total), parseMoney(p.revenue.total)) : null;
  const expChange = d && p ? calcChange(parseMoney(d.expenses.total), parseMoney(p.expenses.total)) : null;
  const profitChange = d && p ? calcChange(parseMoney(d.profit), parseMoney(p.profit)) : null;
  const membersChange = d && p ? calcDelta(d.newMembers, p.newMembers) : null;
  const renewalsChange = d && p ? calcDelta(d.renewals, p.renewals) : null;
  const paymentsChange = d && p ? calcDelta(d.revenue.paymentCount, p.revenue.paymentCount) : null;
  const expCountChange = d && p ? calcDelta(d.expenses.expenseCount, p.expenses.expenseCount) : null;

  const prevLabel = PREV_LABEL[range];

  return (
    <SectionCard
      title="Activity Summary"
      actions={
        <div className="grid min-w-[16rem] max-w-sm flex-1 grid-cols-3 rounded-lg border border-border/60 bg-muted/40 p-0.5 ml-auto">
          {(Object.keys(ACTIVITY_RANGE_LABELS) as ActivityRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold text-center whitespace-nowrap transition-colors ${
                range === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ACTIVITY_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      }
    >
      {summary.isLoading ? (
        <div className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[108px] md:h-[128px] animate-pulse rounded-xl md:rounded-2xl bg-muted" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {[5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[108px] md:h-[128px] animate-pulse rounded-xl md:rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      ) : summary.isError ? (
        <ErrorState title="Couldn't load activity" onRetry={() => summary.refetch()} />
      ) : d ? (
        <div className="space-y-3 md:space-y-4">
          {/* Financial row */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <MetricCard label="Revenue" value={formatMoney(d.revenue.total)} compactValue={formatCompactMoney(d.revenue.total)} icon={TrendingUp} color="text-green-700" bg="bg-green-50/80" comparison={revChange} prevLabel={prevLabel} />
            <MetricCard label="Expenses" value={formatMoney(d.expenses.total)} compactValue={formatCompactMoney(d.expenses.total)} icon={TrendingDown} color="text-red-600" bg="bg-red-50/80" comparison={expChange} prevLabel={prevLabel} invertTrend />
            <MetricCard label="Profit" value={formatMoney(d.profit)} compactValue={formatCompactMoney(d.profit)} icon={IndianRupee} color="text-blue-700" bg="bg-blue-50/80" comparison={profitChange} prevLabel={prevLabel} />
            <MetricCard label="Outstanding" value={formatMoney(outstandingBalance)} compactValue={formatCompactMoney(outstandingBalance)} icon={AlertCircle} color="text-orange-600" bg="bg-orange-50/80" onClick={onOutstandingClick} />
          </div>
          {/* Operational row */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <MetricCard label="New Members" value={String(d.newMembers)} icon={UserPlus} color="text-blue-700" bg="bg-blue-50/80" comparisonDelta={membersChange} prevLabel={prevLabel} />
            <MetricCard label="Renewals" value={String(d.renewals)} icon={RefreshCw} color="text-purple-700" bg="bg-purple-50/80" comparisonDelta={renewalsChange} prevLabel={prevLabel} />
            <MetricCard label="Payments Recorded" value={String(d.revenue.paymentCount)} icon={CreditCard} color="text-emerald-700" bg="bg-emerald-50/80" comparisonDelta={paymentsChange} prevLabel={prevLabel} />
            <MetricCard label="Expenses Added" value={String(d.expenses.expenseCount)} icon={Receipt} color="text-rose-600" bg="bg-rose-50/80" comparisonDelta={expCountChange} prevLabel={prevLabel} invertTrend />
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

function MetricCard({ label, value, compactValue, icon: Icon, color, bg, onClick, comparison, comparisonDelta, prevLabel, invertTrend }: {
  label: string; value: string; compactValue?: string; icon: React.ElementType;
  color: string; bg: string; onClick?: () => void;
  comparison?: { pct: string; dir: "up" | "down" | "flat" } | null;
  comparisonDelta?: { delta: string; dir: "up" | "down" | "flat" } | null;
  prevLabel?: string;
  invertTrend?: boolean;
}) {
  const Wrapper = onClick ? "button" : "div";

  const cmp = comparison || comparisonDelta;
  let trendColor = "text-muted-foreground";
  if (cmp && cmp.dir !== "flat") {
    const isPositive = invertTrend ? cmp.dir === "down" : cmp.dir === "up";
    trendColor = isPositive ? "text-green-600" : "text-red-500";
  }

  const showCompact = compactValue && compactValue !== value;

  return (
    <Wrapper
      className={`flex flex-col justify-between rounded-xl md:rounded-2xl ${bg} text-left transition-all ${onClick ? "cursor-pointer hover:shadow-md" : ""}`}
      style={{ padding: "clamp(0.75rem, 2.5vw, 1.25rem)" }}
      onClick={onClick}
    >
      <div
        className="flex items-center"
        style={{ fontSize: "clamp(1.05rem, 4vw, 1.5rem)", gap: "0.35em" }}
      >
        <div
          className="shrink-0 flex items-center justify-center rounded-full bg-white/90 shadow-sm"
          style={{ width: "1.5em", height: "1.5em" }}
        >
          <Icon className={color} style={{ width: "0.7em", height: "0.7em" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`font-bold leading-tight tracking-tight whitespace-nowrap ${color}`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >{showCompact ? (<><span className="hidden md:inline">{value}</span><span className="md:hidden">{compactValue}</span></>) : value}</p>
          <p className="font-medium text-muted-foreground" style={{ fontSize: "0.58em", marginTop: "0.15em" }}>{label}</p>
        </div>
      </div>
      <div className="mt-2.5 md:mt-3.5">
        {cmp && prevLabel && cmp.dir !== "flat" ? (
          <div className="flex flex-wrap items-center gap-1 text-[10.5px] md:text-xs font-medium">
            <span className="text-muted-foreground">{prevLabel}:</span>
            <span className={`inline-flex items-center gap-0.5 ${trendColor}`}>
              {cmp.dir === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {comparison ? (comparison as { pct: string }).pct : (comparisonDelta as { delta: string }).delta}
            </span>
          </div>
        ) : cmp && prevLabel ? (
          <div className="flex items-center gap-1 text-[10.5px] md:text-xs font-medium text-muted-foreground">
            <span>{prevLabel}:</span>
            <span>{comparison ? "0%" : "0"}</span>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </Wrapper>
  );
}

// ─── Last Updated Indicator ─────────────────────────────────────

function LastUpdated({ dataUpdatedAt, isFetching }: { dataUpdatedAt: number; isFetching: boolean }) {
  if (!dataUpdatedAt) return null;

  const time = new Date(dataUpdatedAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <p className="text-xs text-muted-foreground">
      {isFetching ? (
        <span className="animate-pulse">Updating...</span>
      ) : (
        `Last updated at ${time}`
      )}
    </p>
  );
}

// ─── Outstanding Balances Section ───────────────────────────────

interface OutstandingSectionProps {
  data: ReturnType<typeof useOutstandingBalances>["data"];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onMemberClick: (memberId: string) => void;
  onPayment: (memberId: string, membershipId: string) => void;
  onViewAll: () => void;
}

function OutstandingSection({
  data,
  isLoading,
  isError,
  onRetry,
  onMemberClick,
  onPayment,
  onViewAll,
}: OutstandingSectionProps) {
  if (isError) {
    return (
      <SectionCard title="Outstanding Balances">
        <ErrorState
          title="Couldn't load outstanding balances"
          onRetry={onRetry}
        />
      </SectionCard>
    );
  }

  if (isLoading || !data) {
    return (
      <SectionCard title="Outstanding Balances">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </SectionCard>
    );
  }

  if (data.balances.length === 0) {
    return (
      <SectionCard title="Outstanding Balances">
        <EmptyState
          icon={IndianRupee}
          title="No outstanding dues"
          description="All members are paid up. Great job!"
        />
      </SectionCard>
    );
  }

  // Show top 5 outstanding members
  const top5 = data.balances.slice(0, 5);

  return (
    <SectionCard
      title="Outstanding Balances"
      count={data.count}
      onViewAll={data.count > 5 ? onViewAll : undefined}
      viewAllLabel={`View All (${data.count})`}
    >
      <div className="-mx-3 divide-y">
        {top5.map((b) => (
          <ActionCard
            key={b.membershipId}
            title={b.memberName}
            subtitle={`${b.planName} · ${capitalize(b.status)}`}
            icon={Wallet}
            iconBg="bg-orange-100"
            iconColor="text-orange-700"
            showChevron={false}
            trailing={
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-red-600">{formatMoney(b.outstanding)}</p>
                  <p className="text-xs text-muted-foreground">due</p>
                </div>
                <span
                  role="link"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onPayment(b.memberId, b.membershipId); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onPayment(b.memberId, b.membershipId); } }}
                  className="cursor-pointer rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Pay
                </span>
              </div>
            }
            onClick={() => onMemberClick(b.memberId)}
          />
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Attention Required Section ─────────────────────────────────

interface AttentionSectionProps {
  expiring: ReturnType<typeof useExpiringMemberships>["data"];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onMemberClick: (memberId: string) => void;
  onRenew: (membershipId: string) => void;
}

function AttentionSection({ expiring, isLoading, isError, onRetry, onMemberClick, onRenew }: AttentionSectionProps) {
  if (isError) {
    return (
      <SectionCard title="Attention Required">
        <ErrorState
          title="Couldn't load expiring memberships"
          onRetry={onRetry}
        />
      </SectionCard>
    );
  }

  if (isLoading || !expiring) {
    return (
      <SectionCard title="Attention Required">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </SectionCard>
    );
  }

  const { expiring1Day, expiring3Days, expiring7Days } = expiring;
  const totalExpiring = expiring7Days.count;

  if (totalExpiring === 0) {
    return (
      <SectionCard title="Attention Required">
        <EmptyState
          icon={CalendarClock}
          title="All clear!"
          description="No memberships expiring in the next 7 days."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Attention Required" count={totalExpiring}>
      <div className="space-y-4">
        {expiring1Day.count > 0 && (
          <ExpiringGroup
            label="Expiring Today"
            variant="destructive"
            members={expiring1Day.members}
            onMemberClick={onMemberClick}
            onRenew={onRenew}
          />
        )}
        {expiring3Days.count > 0 && (
          <ExpiringGroup
            label="Expiring in 3 Days"
            variant="warning"
            members={expiring3Days.members}
            onMemberClick={onMemberClick}
            onRenew={onRenew}
          />
        )}
        {expiring7Days.count > expiring3Days.count && (
          <ExpiringGroup
            label="Expiring in 7 Days"
            variant="info"
            members={expiring7Days.members.filter(
              (m) => m.daysLeft > 3
            )}
            onMemberClick={onMemberClick}
            onRenew={onRenew}
          />
        )}
      </div>
    </SectionCard>
  );
}

// ─── Expiring Group ─────────────────────────────────────────────

interface ExpiringGroupProps {
  label: string;
  variant: "destructive" | "warning" | "info";
  members: ExpiringMember[];
  onMemberClick: (memberId: string) => void;
  onRenew: (membershipId: string) => void;
}

function ExpiringGroup({ label, variant, members, onMemberClick, onRenew }: ExpiringGroupProps) {
  if (members.length === 0) return null;

  const bgMap = {
    destructive: "bg-red-50",
    warning: "bg-yellow-50",
    info: "bg-blue-50",
  };
  const iconColorMap = {
    destructive: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Clock className={`h-3.5 w-3.5 ${iconColorMap[variant]}`} />
        <span className="text-xs font-semibold text-muted-foreground">
          {label} ({members.length})
        </span>
      </div>
      <div className={`-mx-1 divide-y rounded-lg ${bgMap[variant]}`}>
        {members.map((m) => (
          <ActionCard
            key={m.membershipId}
            title={m.memberName}
            subtitle={`${m.planName} · Expires ${formatDate(m.endDate)}`}
            icon={Users}
            iconBg="bg-white"
            iconColor={iconColorMap[variant]}
            showChevron={false}
            trailing={
              <div className="flex items-center gap-2">
                <DaysLeftBadge daysLeft={m.daysLeft} />
                <span
                  role="link"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onRenew(m.membershipId); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRenew(m.membershipId); } }}
                  className="cursor-pointer rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Renew
                </span>
              </div>
            }
            onClick={() => onMemberClick(m.memberId)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Days Left Badge ────────────────────────────────────────────

function DaysLeftBadge({ daysLeft }: { daysLeft: number }) {
  if (daysLeft <= 0) {
    return <StatusBadge status="expired" label="Today" />;
  }
  if (daysLeft === 1) {
    return <StatusBadge status="expired" label="1 day" />;
  }
  if (daysLeft <= 3) {
    return (
      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
        {daysLeft}d left
      </span>
    );
  }
  return (
    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
      {daysLeft}d left
    </span>
  );
}

// ─── Mini Stat (compact number) ─────────────────────────────────

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <p className={`text-lg font-bold tabular-nums ${color ?? "text-foreground"}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function todayLabel(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
