import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { MEMBERSHIPS, PLANS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type {
  ApiResponse,
  MembershipListItem,
  MembershipDetail,
  Plan,
} from "@/api/types";

// ─── List Memberships ──────────────────────────────────────────

export interface MembershipsFilter {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  planId?: string;
  expiringSoon?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

interface MembershipsListResponse {
  items: MembershipListItem[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function useMemberships(filters: MembershipsFilter = {}) {
  return useQuery({
    queryKey: queryKeys.memberships.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      if (filters.planId) params.set("planId", filters.planId);
      if (filters.expiringSoon) params.set("expiringSoon", "true");
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

      const res = await api.get<ApiResponse<MembershipsListResponse>>(
        `${MEMBERSHIPS.LIST}?${params.toString()}`
      );
      return res.data.data;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

// ─── Single Membership ─────────────────────────────────────────

export function useMembership(membershipId: string) {
  return useQuery({
    queryKey: queryKeys.memberships.detail(membershipId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ membership: MembershipDetail }>>(
        MEMBERSHIPS.DETAIL(membershipId)
      );
      return res.data.data.membership;
    },
    staleTime: 60_000,
    enabled: !!membershipId,
  });
}

// ─── Plans (for renew workflow) ────────────────────────────────

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ plans: Plan[] }>>(PLANS.LIST);
      return res.data.data.plans;
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Renew Membership ──────────────────────────────────────────

interface RenewInput {
  planId: string;
  startDate: string;
  discountAmount: number;
  notes?: string;
}

export function useRenewMembership(membershipId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RenewInput) => {
      const res = await api.post(MEMBERSHIPS.RENEW(membershipId), input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.memberships.all });
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.reports.outstanding });
    },
  });
}

// ─── Freeze Membership ─────────────────────────────────────────

interface FreezeInput {
  freezeStart: string;
  freezeEnd?: string;
  reason?: string;
}

export function useFreezeMembership(membershipId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FreezeInput) => {
      const res = await api.post(MEMBERSHIPS.FREEZE(membershipId), input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.memberships.detail(membershipId) });
      qc.invalidateQueries({ queryKey: queryKeys.memberships.all });
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Unfreeze Membership ───────────────────────────────────────

export function useUnfreezeMembership(membershipId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unfreezeDate: string) => {
      const res = await api.post(MEMBERSHIPS.UNFREEZE(membershipId), { unfreezeDate });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.memberships.detail(membershipId) });
      qc.invalidateQueries({ queryKey: queryKeys.memberships.all });
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
