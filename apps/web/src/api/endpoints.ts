// ─── Auth ──────────────────────────────────────────────────────

export const AUTH = {
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  LOGOUT_ALL: "/auth/logout-all",
  ME: "/auth/me",
  CHANGE_PASSWORD: "/auth/change-password",
} as const;

// ─── Members ───────────────────────────────────────────────────

export const MEMBERS = {
  LIST: "/members",
  CREATE: "/members",
  BATCH_DELETE: "/members/batch-delete",
  DETAIL: (id: string) => `/members/${id}`,
  UPDATE: (id: string) => `/members/${id}`,
  STATUS: (id: string) => `/members/${id}/status`,
  NOTES: (id: string) => `/members/${id}/notes`,
  DELETE_NOTE: (id: string, noteId: string) =>
    `/members/${id}/notes/${noteId}`,
} as const;

// ─── Plans ─────────────────────────────────────────────────────

export const PLANS = {
  LIST: "/membership-plans",
  CREATE: "/membership-plans",
  DETAIL: (id: string) => `/membership-plans/${id}`,
  UPDATE: (id: string) => `/membership-plans/${id}`,
  STATUS: (id: string) => `/membership-plans/${id}/status`,
} as const;

// ─── Memberships ───────────────────────────────────────────────

export const MEMBERSHIPS = {
  LIST: "/memberships",
  BATCH_DELETE: "/memberships/batch-delete",
  MEMBER_LIST: (memberId: string) => `/members/${memberId}/memberships`,
  CREATE: (memberId: string) => `/members/${memberId}/memberships`,
  DETAIL: (id: string) => `/memberships/${id}`,
  RENEW: (id: string) => `/memberships/${id}/renew`,
  FREEZE: (id: string) => `/memberships/${id}/freeze`,
  UNFREEZE: (id: string) => `/memberships/${id}/unfreeze`,
} as const;

// ─── Payments ──────────────────────────────────────────────────

export const PAYMENTS = {
  LIST: "/payments",
  CREATE: "/payments",
  BATCH_DELETE: "/payments/batch-delete",
  DETAIL: (id: string) => `/payments/${id}`,
  UPDATE: (id: string) => `/payments/${id}`,
  RECEIPT: (id: string) => `/payments/${id}/receipt`,
  MEMBERSHIP_PAYMENTS: (id: string) => `/memberships/${id}/payments`,
  MEMBER_PAYMENTS: (memberId: string) => `/members/${memberId}/payments`,
} as const;

// ─── Expenses ──────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = {
  LIST: "/expense-categories",
  CREATE: "/expense-categories",
  DETAIL: (id: string) => `/expense-categories/${id}`,
  UPDATE: (id: string) => `/expense-categories/${id}`,
  STATUS: (id: string) => `/expense-categories/${id}/status`,
} as const;

export const EXPENSES = {
  LIST: "/expenses",
  CREATE: "/expenses",
  BATCH_DELETE: "/expenses/batch-delete",
  DETAIL: (id: string) => `/expenses/${id}`,
  UPDATE: (id: string) => `/expenses/${id}`,
} as const;

// ─── Dashboard ─────────────────────────────────────────────────

export const DASHBOARD = {
  SUMMARY: "/dashboard",
} as const;

// ─── Reports ───────────────────────────────────────────────────

export const REPORTS = {
  REVENUE: "/reports/revenue",
  EXPENSES: "/reports/expenses",
  PROFIT: "/reports/profit",
  MEMBERSHIPS: "/reports/memberships",
  OUTSTANDING: "/reports/outstanding-balances",
  ANALYTICS: "/reports/analytics",
} as const;

// ─── Notifications ────────────────────────────────────────────

export const NOTIFICATIONS = {
  LIST: "/notifications",
  UNREAD_COUNT: "/notifications/unread-count",
  READ_ALL: "/notifications/read-all",
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  DELETE: (id: string) => `/notifications/${id}`,
  RUN_AUTOMATION: "/notifications/run-automation",
} as const;

// ─── Automation ────────────────────────────────────────────────

export const AUTOMATION = {
  EXPIRING: "/automation/expiring-memberships",
  EXPIRED: "/automation/expired-memberships",
  DAILY_SUMMARY: "/automation/daily-summary",
  GENERATE_SUMMARY: "/automation/generate-daily-summary",
  BACKUP_STATUS: "/automation/backup-status",
} as const;

// ─── Exports ───────────────────────────────────────────────────

export const EXPORTS = {
  MEMBERS_CSV: "/exports/members.csv",
  MEMBERS_XLSX: "/exports/members.xlsx",
  REVENUE_CSV: "/exports/revenue.csv",
  REVENUE_XLSX: "/exports/revenue.xlsx",
  EXPENSES_CSV: "/exports/expenses.csv",
  EXPENSES_XLSX: "/exports/expenses.xlsx",
  OUTSTANDING_CSV: "/exports/outstanding-balances.csv",
  OUTSTANDING_XLSX: "/exports/outstanding-balances.xlsx",
} as const;
