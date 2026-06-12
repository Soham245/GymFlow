import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { DASHBOARD, AUTOMATION, REPORTS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type {
  ApiResponse,
  DashboardData,
  DailySummary,
  ExpiringMembershipsData,
  OutstandingBalancesData,
} from "@/api/types";

/**
 * Fetches the main dashboard summary.
 * - staleTime: 60s (dashboard is semi-real-time — 1 min is fine for a gym)
 * - refetchOnMount: always (entering dashboard should feel fresh)
 * - retry: 2 (network flakiness on mobile)
 */
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardData>>(DASHBOARD.SUMMARY);
      return res.data.data;
    },
    staleTime: 60_000,
    refetchOnMount: "always",
    retry: 2,
  });
}

/**
 * Fetches expiring memberships (1/3/7 day breakdown with member details).
 * Used for the "Attention Required" section.
 * - staleTime: 5 min (expiry list doesn't change minute-to-minute)
 */
export function useExpiringMemberships() {
  return useQuery({
    queryKey: queryKeys.automation.expiring,
    queryFn: async () => {
      const res = await api.get<ApiResponse<ExpiringMembershipsData>>(AUTOMATION.EXPIRING);
      return res.data.data;
    },
    staleTime: 5 * 60_000,
    retry: 2,
  });
}

function buildDateRange(range: "today" | "last7days" | "last30days") {
  const today = new Date().toISOString().slice(0, 10);
  if (range === "today") return {};
  const d = new Date();
  d.setDate(d.getDate() - (range === "last7days" ? 6 : 29));
  return { from: d.toISOString().slice(0, 10), to: today };
}

function buildPrevDateRange(range: "today" | "last7days" | "last30days") {
  if (range === "today") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);
    return { from: yesterday, to: yesterday };
  }
  const span = range === "last7days" ? 7 : 30;
  const end = new Date();
  end.setDate(end.getDate() - span);
  const start = new Date(end);
  start.setDate(start.getDate() - (span - 1));
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

function toQs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  return sp.toString();
}

async function fetchSummary(qs: string) {
  const url = qs ? `${AUTOMATION.DAILY_SUMMARY}?${qs}` : AUTOMATION.DAILY_SUMMARY;
  const res = await api.get<ApiResponse<DailySummary>>(url);
  return res.data.data;
}

export function useActivitySummary(range: "today" | "last7days" | "last30days" = "today") {
  return useQuery({
    queryKey: [...queryKeys.automation.summary, range],
    queryFn: () => fetchSummary(toQs(buildDateRange(range))),
    staleTime: 2 * 60_000,
    retry: 2,
  });
}

export function useActivitySummaryPrev(range: "today" | "last7days" | "last30days" = "today") {
  return useQuery({
    queryKey: [...queryKeys.automation.summary, range, "prev"],
    queryFn: () => fetchSummary(toQs(buildPrevDateRange(range))),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/**
 * Fetches outstanding balances (members with pending dues).
 * - staleTime: 2 min (changes when payments are recorded)
 */
export function useOutstandingBalances() {
  return useQuery({
    queryKey: queryKeys.reports.outstanding,
    queryFn: async () => {
      const res = await api.get<ApiResponse<OutstandingBalancesData>>(REPORTS.OUTSTANDING);
      return res.data.data;
    },
    staleTime: 2 * 60_000,
    retry: 2,
  });
}
