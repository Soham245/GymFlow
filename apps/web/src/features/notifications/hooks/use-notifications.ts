import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { NOTIFICATIONS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type {
  ApiResponse,
  PaginationMeta,
  InAppNotification,
} from "@/api/types";

// ─── List Notifications ─────────────────────────────────────────

export interface NotificationsFilter {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: string;
}

interface NotificationsListResponse {
  notifications: InAppNotification[];
}

export function useNotifications(filters: NotificationsFilter = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.type) params.set("type", filters.type);
      if (filters.isRead) params.set("isRead", filters.isRead);

      const qs = params.toString();
      const res = await api.get<ApiResponse<NotificationsListResponse> & { meta?: PaginationMeta }>(
        qs ? `${NOTIFICATIONS.LIST}?${qs}` : NOTIFICATIONS.LIST
      );
      return {
        items: res.data.data.notifications,
        total: res.data.meta?.total ?? 0,
        page: res.data.meta?.page ?? 1,
        totalPages: res.data.meta?.totalPages ?? 1,
        hasMore: res.data.meta?.hasMore ?? false,
      };
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

// ─── Unread Count ───────────────────────────────────────────────

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ unreadCount: number }>>(
        NOTIFICATIONS.UNREAD_COUNT
      );
      return res.data.data.unreadCount;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ─── Mark Read ──────────────────────────────────────────────────

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(NOTIFICATIONS.MARK_READ(id));
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// ─── Mark All Read ──────────────────────────────────────────────

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.patch(NOTIFICATIONS.READ_ALL);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// ─── Delete Notification ────────────────────────────────────────

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(NOTIFICATIONS.DELETE(id));
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// ─── Run Automation ─────────────────────────────────────────────

export function useRunAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(NOTIFICATIONS.RUN_AUTOMATION);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
