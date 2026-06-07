import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { PLANS, AUTOMATION } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, Plan } from "@/api/types";
import axios from "axios";

// ─── Plans ────────────────────────────────────────────────────

export function usePlans(includeInactive = false) {
  return useQuery({
    queryKey: [...queryKeys.plans, { includeInactive }] as const,
    queryFn: async () => {
      const params = includeInactive ? "?includeInactive=true" : "";
      const res = await api.get<ApiResponse<{ plans: Plan[] }>>(
        `${PLANS.LIST}${params}`
      );
      return res.data.data.plans;
    },
    staleTime: 120_000,
  });
}

interface CreatePlanInput {
  name: string;
  durationDays: number;
  price: number;
  description?: string;
  sortOrder?: number;
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      const res = await api.post(PLANS.CREATE, input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans });
    },
  });
}

export function useUpdatePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CreatePlanInput>) => {
      const res = await api.patch(PLANS.UPDATE(planId), input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans });
    },
  });
}

export function useTogglePlanStatus(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await api.patch(PLANS.STATUS(planId), { isActive });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans });
    },
  });
}

// ─── Automation ───────────────────────────────────────────────

export interface ExpiringData {
  generatedAt: string;
  expiring7Days: { count: number; members: Array<{ memberName: string; planName: string; endDate: string; daysLeft: number }> };
  expiring3Days: { count: number; members: Array<{ memberName: string; planName: string; endDate: string; daysLeft: number }> };
  expiring1Day: { count: number; members: Array<{ memberName: string; planName: string; endDate: string; daysLeft: number }> };
}

export function useExpiringMemberships() {
  return useQuery({
    queryKey: queryKeys.automation.expiring,
    queryFn: async () => {
      const res = await api.get<ApiResponse<ExpiringData>>(AUTOMATION.EXPIRING);
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useExpiredMemberships() {
  return useQuery({
    queryKey: queryKeys.automation.expired,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ count: number; expired: unknown[] }>>(AUTOMATION.EXPIRED);
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useDailySummary() {
  return useQuery({
    queryKey: queryKeys.automation.summary,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Record<string, unknown>>>(AUTOMATION.DAILY_SUMMARY);
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useBackupStatus() {
  return useQuery({
    queryKey: queryKeys.automation.backup,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Record<string, unknown>>>(AUTOMATION.BACKUP_STATUS);
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

// ─── System Health ────────────────────────────────────────────

export interface HealthData {
  status: string;
  version: string;
  uptime: string;
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
}

export interface DbHealthData {
  status: string;
  database: string;
  latencyMs: number;
  serverTime: string;
  version: string;
  timestamp: string;
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      // Health endpoints are NOT under /api/v1, they're at root
      const baseUrl = (import.meta.env.VITE_API_URL || "/api/v1").replace("/api/v1", "");
      const res = await axios.get<HealthData>(`${baseUrl}/health`);
      return res.data;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useDbHealthCheck() {
  return useQuery({
    queryKey: ["health", "db"],
    queryFn: async () => {
      const baseUrl = (import.meta.env.VITE_API_URL || "/api/v1").replace("/api/v1", "");
      const res = await axios.get<DbHealthData>(`${baseUrl}/health/db`);
      return res.data;
    },
    staleTime: 30_000,
    retry: 1,
  });
}
