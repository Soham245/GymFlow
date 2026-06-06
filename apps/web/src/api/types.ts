// ─── API Envelope ──────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// ─── Auth ──────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "receptionist" | "trainer";
  gymId: string;
  phone?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface MeResponse {
  user: User;
}

// ─── Dashboard ─────────────────────────────────────────────────

export interface DashboardData {
  members: {
    total: number;
    active: number;
    frozen: number;
    expired: number;
    inactive: number;
  };
  memberships: {
    expiring7Days: number;
    expiring30Days: number;
  };
  revenue: {
    today: string;
    month: string;
    year: string;
  };
  expenses: {
    today: string;
    month: string;
    year: string;
  };
  profit: {
    today: string;
    month: string;
    year: string;
  };
  outstandingBalance: string;
  recentPayments: Array<{
    id: string;
    memberName: string;
    amount: string;
    paymentMethod: string;
    paymentDate: string;
    receiptNumber: string;
  }>;
  recentExpenses: Array<{
    id: string;
    categoryName: string;
    amount: string;
    description: string;
    expenseDate: string;
  }>;
}

// ─── Members ───────────────────────────────────────────────────

export interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  photoUrl?: string | null;
  joinDate: string;
  status: "active" | "expired" | "inactive" | "frozen";
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
}

// ─── Memberships ───────────────────────────────────────────────

export interface Membership {
  id: string;
  memberId: string;
  gymId: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled" | "frozen";
  totalAmount: string;
  discountAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ─── Payments ──────────────────────────────────────────────────

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  membershipId?: string | null;
  planName?: string | null;
  receiptNumber: string;
  amount: string;
  paymentMethod: "cash" | "upi" | "card" | "bank_transfer";
  paymentStatus: "paid" | "partial" | "pending" | "refunded";
  paymentDate: string;
  notes?: string | null;
  createdAt: string;
}

// ─── Expenses ──────────────────────────────────────────────────

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: string;
  description?: string | null;
  expenseDate: string;
  paymentMethod: "cash" | "upi" | "card" | "bank_transfer";
  receiptUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

// ─── Plans ─────────────────────────────────────────────────────

export interface Plan {
  id: string;
  gymId: string;
  name: string;
  durationDays: number;
  price: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
