import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { EXPENSES, EXPENSE_CATEGORIES } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type {
  ApiResponse,
  PaginationMeta,
  Expense,
  ExpenseCategory,
} from "@/api/types";

// ─── List Expenses ────────────────────────────────────────────

export interface ExpensesFilter {
  page?: number;
  limit?: number;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface ExpensesListResponse {
  expenses: Expense[];
}

export function useExpenses(filters: ExpensesFilter = {}) {
  return useQuery({
    queryKey: queryKeys.expenses.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.search) params.set("search", filters.search);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

      const res = await api.get<ApiResponse<ExpensesListResponse> & { meta?: PaginationMeta }>(
        `${EXPENSES.LIST}?${params.toString()}`
      );
      return {
        items: res.data.data.expenses,
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

// ─── Single Expense ───────────────────────────────────────────

export function useExpense(expenseId: string) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(expenseId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ expense: Expense }>>(
        EXPENSES.DETAIL(expenseId)
      );
      return res.data.data.expense;
    },
    staleTime: 60_000,
    enabled: !!expenseId,
  });
}

// ─── Create Expense ───────────────────────────────────────────

interface CreateExpenseInput {
  categoryId: string;
  amount: number;
  description?: string;
  expenseDate: string;
  paymentMethod?: "cash" | "upi" | "card" | "bank_transfer";
  receiptUrl?: string;
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const res = await api.post(EXPENSES.CREATE, input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Update Expense ───────────────────────────────────────────

export function useUpdateExpense(expenseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CreateExpenseInput>) => {
      const res = await api.patch(EXPENSES.UPDATE(expenseId), input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      qc.invalidateQueries({ queryKey: queryKeys.expenses.detail(expenseId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Expense Categories ───────────────────────────────────────

export function useExpenseCategories(includeInactive = false) {
  return useQuery({
    queryKey: [...queryKeys.expenses.categories, { includeInactive }] as const,
    queryFn: async () => {
      const params = includeInactive ? "?includeInactive=true" : "";
      const res = await api.get<ApiResponse<{ categories: ExpenseCategory[] }>>(
        `${EXPENSE_CATEGORIES.LIST}${params}`
      );
      return res.data.data.categories;
    },
    staleTime: 120_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const res = await api.post(EXPENSE_CATEGORIES.CREATE, input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.categories });
    },
  });
}

export function useUpdateCategory(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name?: string; description?: string }) => {
      const res = await api.patch(EXPENSE_CATEGORIES.UPDATE(categoryId), input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.categories });
    },
  });
}

export function useToggleCategoryStatus(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await api.patch(EXPENSE_CATEGORIES.STATUS(categoryId), { isActive });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.categories });
    },
  });
}
