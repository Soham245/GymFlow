import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { MEMBERS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type {
  ApiResponse,
  PaginationMeta,
  Member,
  MemberListItem,
  MemberNote,
} from "@/api/types";

// ─── List Members ──────────────────────────────────────────────

export interface MembersFilter {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface MembersApiResponse {
  members: MemberListItem[];
}

interface MembersListData {
  items: MemberListItem[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function useMembers(filters: MembersFilter = {}) {
  return useQuery({
    queryKey: queryKeys.members.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

      const res = await api.get<ApiResponse<MembersApiResponse> & { meta?: PaginationMeta }>(
        `${MEMBERS.LIST}?${params.toString()}`
      );
      return {
        items: res.data.data.members,
        total: res.data.meta?.total ?? 0,
        page: res.data.meta?.page ?? 1,
        totalPages: res.data.meta?.totalPages ?? 1,
        hasMore: res.data.meta?.hasMore ?? false,
      } as MembersListData;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev, // Keep previous data while refetching (smoother pagination)
  });
}

// ─── Single Member ─────────────────────────────────────────────

export function useMember(memberId: string) {
  return useQuery({
    queryKey: queryKeys.members.detail(memberId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ member: Member }>>(MEMBERS.DETAIL(memberId));
      return res.data.data.member;
    },
    staleTime: 60_000,
    enabled: !!memberId,
  });
}

// ─── Member Notes ──────────────────────────────────────────────

export function useMemberNotes(memberId: string) {
  return useQuery({
    queryKey: queryKeys.members.notes(memberId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ notes: MemberNote[] }>>(MEMBERS.NOTES(memberId));
      return res.data.data.notes;
    },
    staleTime: 60_000,
    enabled: !!memberId,
  });
}

// ─── Create Member ────────────────────────────────────────────

export interface CreateMemberInput {
  name: string;
  phone: string;
  joinDate: string;
  email?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMemberInput) => {
      const res = await api.post<ApiResponse<{ member: Member }>>(
        MEMBERS.CREATE,
        input
      );
      return res.data.data.member;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Update Member ───────────────────────────────────────────

export type UpdateMemberInput = Partial<CreateMemberInput>;

export function useUpdateMember(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateMemberInput) => {
      const res = await api.patch<ApiResponse<{ member: Member }>>(
        MEMBERS.UPDATE(memberId),
        input
      );
      return res.data.data.member;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.detail(memberId) });
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}

// ─── Mutations ─────────────────────────────────────────────────

export function useAddNote(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post<ApiResponse<MemberNote>>(
        MEMBERS.NOTES(memberId),
        { content }
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.notes(memberId) });
    },
  });
}

export function useDeleteNote(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      await api.delete(MEMBERS.DELETE_NOTE(memberId, noteId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.notes(memberId) });
    },
  });
}

export function useChangeStatus(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { status: string; reason?: string }) => {
      const res = await api.patch<ApiResponse<Member>>(
        MEMBERS.STATUS(memberId),
        input
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.detail(memberId) });
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Batch Delete Members ─────────────────────────────────────

export function useBatchDeleteMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.post<ApiResponse<{ deleted: number }>>(
        MEMBERS.BATCH_DELETE,
        { ids }
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
      qc.invalidateQueries({ queryKey: queryKeys.memberships.all });
      qc.invalidateQueries({ queryKey: queryKeys.payments.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
