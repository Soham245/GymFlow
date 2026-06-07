import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { REPORTS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, OutstandingBalancesData } from "@/api/types";

// ─── Types ────────────────────────────────────────────────────

export type ReportPeriod =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "all_time"
  | "custom";

export interface ReportQuery {
  period: ReportPeriod;
  from?: string;
  to?: string;
}

export interface RevenueReport {
  period: { from: string; to: string };
  totalRevenue: string;
  paymentCount: number;
  averagePayment: string;
  paymentMethodBreakdown: {
    method: string;
    total: string;
    count: number;
  }[];
}

export interface ExpenseReport {
  period: { from: string; to: string };
  totalExpenses: string;
  expenseCount: number;
  categoryBreakdown: {
    category: string;
    total: string;
    count: number;
  }[];
}

export interface ProfitReport {
  period: { from: string; to: string };
  revenue: string;
  expenses: string;
  profit: string;
  margin: number;
}

export interface MembershipReport {
  summary: {
    active: number;
    frozen: number;
    expired: number;
    cancelled: number;
  };
  expiring7Days: number;
  expiring30Days: number;
  expiringMemberships: {
    membershipId: string;
    memberName: string;
    memberPhone: string;
    planName: string;
    endDate: string;
    daysLeft: number;
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────

function buildParams(query: ReportQuery): string {
  const params = new URLSearchParams();
  params.set("period", query.period);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return params.toString();
}

// ─── Hooks ────────────────────────────────────────────────────

export function useRevenueReport(query: ReportQuery) {
  return useQuery({
    queryKey: queryKeys.reports.revenue(`${query.period}-${query.from ?? ""}-${query.to ?? ""}`),
    queryFn: async () => {
      const res = await api.get<ApiResponse<RevenueReport>>(
        `${REPORTS.REVENUE}?${buildParams(query)}`
      );
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useExpenseReport(query: ReportQuery) {
  return useQuery({
    queryKey: queryKeys.reports.expenses(`${query.period}-${query.from ?? ""}-${query.to ?? ""}`),
    queryFn: async () => {
      const res = await api.get<ApiResponse<ExpenseReport>>(
        `${REPORTS.EXPENSES}?${buildParams(query)}`
      );
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useProfitReport(query: ReportQuery) {
  return useQuery({
    queryKey: queryKeys.reports.profit(`${query.period}-${query.from ?? ""}-${query.to ?? ""}`),
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProfitReport>>(
        `${REPORTS.PROFIT}?${buildParams(query)}`
      );
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useMembershipReport() {
  return useQuery({
    queryKey: queryKeys.reports.memberships,
    queryFn: async () => {
      const res = await api.get<ApiResponse<MembershipReport>>(REPORTS.MEMBERSHIPS);
      return res.data.data;
    },
    staleTime: 2 * 60_000,
  });
}

export function useOutstandingBalances() {
  return useQuery({
    queryKey: queryKeys.reports.outstanding,
    queryFn: async () => {
      const res = await api.get<ApiResponse<OutstandingBalancesData>>(REPORTS.OUTSTANDING);
      return res.data.data;
    },
    staleTime: 2 * 60_000,
  });
}
