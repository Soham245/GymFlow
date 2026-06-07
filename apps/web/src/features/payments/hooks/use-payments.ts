import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { PAYMENTS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type {
  ApiResponse,
  PaginationMeta,
  PaymentListItem,
  PaymentDetail,
} from "@/api/types";

// ─── List Payments ─────────────────────────────────────────────

export interface PaymentsFilter {
  page?: number;
  limit?: number;
  memberId?: string;
  membershipId?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  receiptNumber?: string;
}

interface PaymentsListResponse {
  payments: PaymentListItem[];
}

export function usePayments(filters: PaymentsFilter = {}) {
  return useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.memberId) params.set("memberId", filters.memberId);
      if (filters.membershipId) params.set("membershipId", filters.membershipId);
      if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.receiptNumber) params.set("receiptNumber", filters.receiptNumber);

      const res = await api.get<ApiResponse<PaymentsListResponse> & { meta?: PaginationMeta }>(
        `${PAYMENTS.LIST}?${params.toString()}`
      );
      return {
        items: res.data.data.payments,
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

// ─── Single Payment ────────────────────────────────────────────

export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: queryKeys.payments.detail(paymentId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ payment: PaymentDetail }>>(
        PAYMENTS.DETAIL(paymentId)
      );
      return res.data.data.payment;
    },
    staleTime: 60_000,
    enabled: !!paymentId,
  });
}

// ─── Record Payment ────────────────────────────────────────────

interface RecordPaymentInput {
  memberId: string;
  membershipId?: string;
  amount: number;
  paymentMethod: "cash" | "upi" | "card" | "bank_transfer";
  paymentDate: string;
  notes?: string;
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecordPaymentInput) => {
      const res = await api.post(PAYMENTS.CREATE, input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payments.all });
      qc.invalidateQueries({ queryKey: queryKeys.memberships.all });
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.reports.outstanding });
    },
  });
}

// ─── Receipt URL helper ────────────────────────────────────────

export function getReceiptUrl(paymentId: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";
  return `${baseUrl}${PAYMENTS.RECEIPT(paymentId)}`;
}
