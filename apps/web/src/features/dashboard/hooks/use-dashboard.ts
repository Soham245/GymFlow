import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { DASHBOARD, AUTOMATION, REPORTS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type {
  ApiResponse,
  DashboardData,
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
