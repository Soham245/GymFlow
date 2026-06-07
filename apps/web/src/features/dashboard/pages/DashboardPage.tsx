import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Receipt,
  UserPlus,
  Plus,
  Users,
  Clock,
  CalendarClock,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useDashboard,
  useExpiringMemberships,
  useOutstandingBalances,
} from "../hooks/use-dashboard";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { ActionCard } from "@/components/shared/ActionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { QuickActionButton } from "@/components/shared/QuickActionButton";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PullToRefreshIndicator } from "@/components/shared/PullToRefreshIndicator";
import { ROUTES } from "@/lib/constants";
import { formatMoney, formatDate, formatRelativeDate } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import type { ExpiringMember } from "@/api/types";

// ─── Main Dashboard Page ───────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const dashboard = useDashboard();
  const expiring = useExpiringMemberships();
  const outstanding = useOutstandingBalances();

  const canCreateMembers = usePermission("members:create");
  const canCreatePayments = usePermission("payments:create");
  const canCreateExpenses = usePermission("expenses:create");
  const canCreateMemberships = usePermission("memberships:create");

  // Pull-to-refresh: refetch all dashboard queries
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      dashboard.refetch(),
      expiring.refetch(),
      outstanding.refetch(),
    ]);
  }, [dashboard, expiring, outstanding]);

  const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: isMobile,
  });

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

      <div ref={containerRef} className="overflow-y-auto">
        {/* Pull-to-refresh indicator */}
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
        />

        <div className="space-y-5 p-4 md:p-6">
          {/* ─── Last Updated ───────────────────────────────── */}
          <LastUpdated
            dataUpdatedAt={dashboard.dataUpdatedAt}
            isFetching={dashboard.isFetching}
          />

          {/* ─── Section A: KPI Cards ──────────────────────── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Today's Revenue"
              value={formatMoney(data.revenue.today)}
              icon={TrendingUp}
              iconBg="bg-green-100"
              iconColor="text-green-700"
              subtitle={`Month: ${formatMoney(data.revenue.month)}`}
            />
            <StatCard
              label="Today's Expenses"
              value={formatMoney(data.expenses.today)}
              icon={TrendingDown}
              iconBg="bg-red-100"
              iconColor="text-red-700"
              subtitle={`Month: ${formatMoney(data.expenses.month)}`}
            />
            <StatCard
              label="Today's Profit"
              value={formatMoney(data.profit.today)}
              icon={IndianRupee}
              iconBg="bg-blue-100"
              iconColor="text-blue-700"
              subtitle={`Month: ${formatMoney(data.profit.month)}`}
            />
            <StatCard
              label="Outstanding"
              value={formatMoney(data.outstandingBalance)}
              icon={AlertCircle}
              iconBg="bg-orange-100"
              iconColor="text-orange-700"
              onClick={() => navigate(ROUTES.REPORT_OUTSTANDING)}
            />
          </div>

          {/* ─── Section B: Attention Required ──────────────── */}
          <AttentionSection
            expiring={expiring.data}
            isLoading={expiring.isLoading}
            isError={expiring.isError}
            onRetry={() => expiring.refetch()}
            onMemberClick={(memberId) => navigate(ROUTES.MEMBER_DETAIL(memberId))}
          />

          {/* ─── Section C: Outstanding Balances ─────────────── */}
          <OutstandingSection
            data={outstanding.data}
            isLoading={outstanding.isLoading}
            isError={outstanding.isError}
            onRetry={() => outstanding.refetch()}
            onMemberClick={(memberId) => navigate(ROUTES.MEMBER_DETAIL(memberId))}
            onPayment={() => navigate(ROUTES.PAYMENT_NEW)}
            onViewAll={() => navigate(ROUTES.REPORT_OUTSTANDING)}
          />

          {/* ─── Section D: Recent Activity ──────────────────── */}
          <div className="grid gap-5 md:grid-cols-2">
            <SectionCard
              title="Recent Payments"
              onViewAll={() => navigate(ROUTES.PAYMENTS)}
            >
              {data.recentPayments.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No payments yet"
                  description="Payments will appear here as they're recorded."
                />
              ) : (
                <div className="-mx-3 divide-y">
                  {data.recentPayments.map((p) => (
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
              onViewAll={() => navigate(ROUTES.EXPENSES)}
            >
              {data.recentExpenses.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No expenses yet"
                  description="Track your gym expenses to monitor profitability."
                />
              ) : (
                <div className="-mx-3 divide-y">
                  {data.recentExpenses.map((e) => (
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

          {/* ─── Section E: Quick Actions ────────────────────── */}
          {(canCreateMembers || canCreatePayments || canCreateExpenses || canCreateMemberships) && (
            <SectionCard title="Quick Actions">
              <div className="grid grid-cols-4 gap-2">
                {canCreateMembers && (
                  <QuickActionButton
                    label="Add Member"
                    icon={UserPlus}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-700"
                    onClick={() => navigate(ROUTES.MEMBER_NEW)}
                  />
                )}
                {canCreatePayments && (
                  <QuickActionButton
                    label="Payment"
                    icon={CreditCard}
                    iconBg="bg-green-100"
                    iconColor="text-green-700"
                    onClick={() => navigate(ROUTES.PAYMENT_NEW)}
                  />
                )}
                {canCreateExpenses && (
                  <QuickActionButton
                    label="Expense"
                    icon={Wallet}
                    iconBg="bg-orange-100"
                    iconColor="text-orange-700"
                    onClick={() => navigate(ROUTES.EXPENSE_NEW)}
                  />
                )}
                {canCreateMemberships && (
                  <QuickActionButton
                    label="Membership"
                    icon={Plus}
                    iconBg="bg-purple-100"
                    iconColor="text-purple-700"
                    onClick={() => navigate(ROUTES.MEMBERS)}
                  />
                )}
              </div>
            </SectionCard>
          )}

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
      </div>
    </>
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
  onPayment: () => void;
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
            value={formatMoney(b.outstanding)}
            valueSubtitle="due"
            icon={Wallet}
            iconBg="bg-orange-100"
            iconColor="text-orange-700"
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
}

function AttentionSection({ expiring, isLoading, isError, onRetry, onMemberClick }: AttentionSectionProps) {
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
          />
        )}
        {expiring3Days.count > 0 && (
          <ExpiringGroup
            label="Expiring in 3 Days"
            variant="warning"
            members={expiring3Days.members}
            onMemberClick={onMemberClick}
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
}

function ExpiringGroup({ label, variant, members, onMemberClick }: ExpiringGroupProps) {
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
            trailing={
              <DaysLeftBadge daysLeft={m.daysLeft} />
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
