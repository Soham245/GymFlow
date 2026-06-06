export const queryKeys = {
  dashboard: ["dashboard"] as const,
  members: {
    all: ["members"] as const,
    list: (filters: Record<string, unknown>) =>
      ["members", "list", filters] as const,
    detail: (id: string) => ["members", "detail", id] as const,
    notes: (id: string) => ["members", "notes", id] as const,
  },
  memberships: {
    all: ["memberships"] as const,
    member: (memberId: string) =>
      ["memberships", "member", memberId] as const,
    detail: (id: string) => ["memberships", "detail", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (filters: Record<string, unknown>) =>
      ["payments", "list", filters] as const,
    detail: (id: string) => ["payments", "detail", id] as const,
    member: (memberId: string) => ["payments", "member", memberId] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (filters: Record<string, unknown>) =>
      ["expenses", "list", filters] as const,
    detail: (id: string) => ["expenses", "detail", id] as const,
    categories: ["expenses", "categories"] as const,
  },
  reports: {
    revenue: (period: string) => ["reports", "revenue", period] as const,
    expenses: (period: string) => ["reports", "expenses", period] as const,
    profit: (period: string) => ["reports", "profit", period] as const,
    memberships: ["reports", "memberships"] as const,
    outstanding: ["reports", "outstanding"] as const,
  },
  plans: ["plans"] as const,
  automation: {
    expiring: ["automation", "expiring"] as const,
    expired: ["automation", "expired"] as const,
    summary: ["automation", "summary"] as const,
    backup: ["automation", "backup"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
} as const;
