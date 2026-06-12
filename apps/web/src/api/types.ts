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

// ─── Outstanding Balances ──────────────────────────────────────

export interface OutstandingBalance {
  membershipId: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  planName: string;
  totalAmount: string;
  discountAmount: string;
  paidAmount: string;
  outstanding: string;
  status: string;
  endDate: string;
}

export interface OutstandingBalancesData {
  totalOutstanding: string;
  count: number;
  balances: OutstandingBalance[];
}

// ─── Expiring Memberships (Automation) ─────────────────────────

export interface ExpiringMember {
  membershipId: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberEmail: string | null;
  planName: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
}

export interface ExpiringMembershipsData {
  generatedAt: string;
  expiring7Days: { count: number; members: ExpiringMember[] };
  expiring3Days: { count: number; members: ExpiringMember[] };
  expiring1Day: { count: number; members: ExpiringMember[] };
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

/** Member list item (subset returned by GET /members) */
export interface MemberListItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  joinDate: string;
  status: "active" | "expired" | "inactive" | "frozen";
  photoUrl?: string | null;
  createdAt: string;
  latestMembership?: {
    planName: string;
    startDate: string;
    endDate: string;
    status: "active" | "expired" | "cancelled" | "frozen";
  } | null;
}

export interface MemberNote {
  id: string;
  content: string;
  createdAt: string;
  createdByName: string | null;
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

/** Membership list item (returned by GET /memberships) */
export interface MembershipListItem {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled" | "frozen";
  totalAmount: string;
  discountAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  createdAt: string;
}

/** Membership detail (returned by GET /memberships/:id) */
export interface MembershipDetail extends Membership {
  planDuration: number;
  freezes: MembershipFreeze[];
}

export interface MembershipFreeze {
  id: string;
  membershipId: string;
  gymId: string;
  freezeStart: string;
  freezeEnd: string | null;
  reason: string | null;
  status: "active" | "completed";
  daysAdded: number | null;
  createdBy: string;
  createdAt: string;
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

/** Payment list item (returned by GET /payments) */
export interface PaymentListItem {
  id: string;
  memberId: string;
  memberName: string;
  membershipId?: string | null;
  receiptNumber: string;
  amount: string;
  paymentMethod: "cash" | "upi" | "card" | "bank_transfer";
  paymentStatus: "paid" | "partial" | "pending" | "refunded";
  paymentDate: string;
  createdAt: string;
}

/** Payment detail (returned by GET /payments/:id) */
export interface PaymentDetail {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  membershipId?: string | null;
  planName?: string | null;
  receiptNumber: string;
  amount: string;
  paymentMethod: "cash" | "upi" | "card" | "bank_transfer";
  paymentStatus: "paid" | "partial" | "pending" | "refunded";
  paymentDate: string;
  notes?: string | null;
  createdAt: string;
  gymName: string;
  gymAddress?: string | null;
  gymPhone?: string | null;
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

// ─── Notifications ────────────────────────────────────────────

export type InAppNotificationType =
  | "membership_expiring_7_days"
  | "membership_expiring_3_days"
  | "membership_expiring_today"
  | "membership_expired"
  | "outstanding_balance"
  | "freeze_ending"
  | "system"
  | "membership_auto_expired"
  | "membership_auto_unfrozen"
  | "daily_summary_available";

export interface InAppNotification {
  id: string;
  gymId: string;
  type: InAppNotificationType;
  title: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Daily Summary ────────────────────────────────────────────

export interface DailySummary {
  generatedAt: string;
  from: string;
  to: string;
  isRange: boolean;
  revenue: { total: string; paymentCount: number };
  expenses: { total: string; expenseCount: number };
  profit: string;
  newMembers: number;
  renewals: number;
}

// ─── Unified Analytics ────────────────────────────────────────

export interface TrendChange {
  pct: number;
  dir: "up" | "down" | "flat";
}

export interface AnalyticsData {
  period: { from: string; to: string; range: string };
  previousPeriod: { from: string; to: string };
  revenue: {
    totalRevenue: string;
    paymentCount: number;
    averagePayment: string;
    paymentMethodBreakdown: Array<{ method: string; total: string; count: number }>;
    change: TrendChange;
    previousTotal: string;
  };
  expenses: {
    totalExpenses: string;
    expenseCount: number;
    categoryBreakdown: Array<{ category: string; total: string; count: number }>;
    change: TrendChange;
    previousTotal: string;
  };
  profit: {
    revenue: string;
    expenses: string;
    profit: string;
    margin: number;
    change: TrendChange;
    previousProfit: string;
    marginChange: TrendChange;
    previousMargin: number;
  };
  memberships: {
    active: number;
    frozen: number;
    expired: number;
    cancelled: number;
    expiring7Days: number;
    expiring30Days: number;
    expiringMemberships: Array<{
      membershipId: string;
      memberId: string;
      memberName: string;
      memberPhone: string;
      planName: string;
      endDate: string;
      daysLeft: number;
    }>;
  };
  outstanding: {
    totalOutstanding: string;
    membersWithDues: number;
    balances: Array<{
      membershipId: string;
      memberId: string;
      memberName: string;
      memberPhone: string;
      planName: string;
      totalAmount: string;
      discountAmount: string;
      paidAmount: string;
      outstanding: string;
      status: string;
      endDate: string;
    }>;
  };
  trends: Array<{
    month: string;
    revenue: string;
    expenses: string;
    profit: string;
    paymentCount: number;
    expenseCount: number;
    newMembers: number;
    renewals: number;
  }>;
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
