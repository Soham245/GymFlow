import { useAuth } from "./use-auth";

export type Action =
  | "members:create"
  | "members:edit"
  | "members:status"
  | "members:notes"
  | "memberships:create"
  | "memberships:freeze"
  | "payments:create"
  | "payments:void"
  | "expenses:create"
  | "expenses:edit"
  | "plans:manage"
  | "categories:manage"
  | "settings:gym"
  | "settings:users"
  | "automation:view";

type UserRole = "owner" | "receptionist" | "trainer";

const ROLE_PERMISSIONS: Record<UserRole, Action[]> = {
  owner: [
    "members:create",
    "members:edit",
    "members:status",
    "members:notes",
    "memberships:create",
    "memberships:freeze",
    "payments:create",
    "payments:void",
    "expenses:create",
    "expenses:edit",
    "plans:manage",
    "categories:manage",
    "settings:gym",
    "settings:users",
    "automation:view",
  ],
  receptionist: [
    "members:create",
    "members:edit",
    "members:status",
    "members:notes",
    "memberships:create",
    "memberships:freeze",
    "payments:create",
    "expenses:create",
    "expenses:edit",
  ],
  trainer: [],
};

export function usePermission(action: Action): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(action) ?? false;
}

export function useRole(): UserRole | null {
  const { user } = useAuth();
  return user?.role ?? null;
}
