import { Users, Construction, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ROUTES } from "@/lib/constants";

/**
 * TODO: Users & Roles management
 * - Backend does not currently expose user management endpoints
 * - When available: list staff, invite new users, change roles, deactivate accounts
 * - Owner-only: usePermission("settings:users")
 */
export default function UsersRolesPage() {
  return (
    <>
      <PageHeader
        title="Users & Roles"
        showBack
        backTo={ROUTES.SETTINGS}
        subtitle="Manage staff accounts and permissions"
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={Users}
            title="Coming Soon"
            description="User management will be available in a future update. This will let you manage staff accounts, roles, and permissions."
          />

          <div className="mt-4 rounded-lg border border-dashed bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Construction className="h-4 w-4" />
              <span className="text-xs font-medium">Planned Features</span>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• View all staff members and their roles</li>
              <li>• Invite new staff (Owner, Receptionist, Trainer)</li>
              <li>• Change user roles and permissions</li>
              <li>• Deactivate/reactivate accounts</li>
              <li>• Reset staff passwords</li>
              <li>• View login history and audit logs</li>
            </ul>
          </div>

          <div className="mt-4 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">Current Role Permissions</span>
            </div>
            <div className="space-y-3">
              <RoleBlock
                role="Owner"
                permissions={["Full access to all features", "Manage plans, categories, and settings", "View reports and automation", "Manage staff (future)"]}
              />
              <RoleBlock
                role="Receptionist"
                permissions={["Create and edit members", "Create memberships and payments", "Record expenses", "Cannot access reports or settings"]}
              />
              <RoleBlock
                role="Trainer"
                permissions={["View-only access", "No write permissions"]}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RoleBlock({ role, permissions }: { role: string; permissions: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium">{role}</p>
      <ul className="mt-0.5 space-y-0.5">
        {permissions.map((p) => (
          <li key={p} className="text-[11px] text-muted-foreground">• {p}</li>
        ))}
      </ul>
    </div>
  );
}
