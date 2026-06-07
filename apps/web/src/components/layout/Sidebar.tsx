import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  Receipt,
  BarChart3,
  Settings,
  Bell,
  MessageSquare,
  UserPlus,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";

interface SidebarItem {
  to: string;
  icon: React.ElementType;
  label: string;
  soon?: boolean;
}

const mainItems: SidebarItem[] = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
  { to: ROUTES.MEMBERS, icon: Users, label: "Members" },
  { to: ROUTES.MEMBERSHIPS, icon: CreditCard, label: "Memberships" },
  { to: ROUTES.PAYMENTS, icon: Wallet, label: "Payments" },
  { to: ROUTES.EXPENSES, icon: Receipt, label: "Expenses" },
  { to: ROUTES.REPORTS, icon: BarChart3, label: "Reports" },
];

const secondaryItems: SidebarItem[] = [
  { to: ROUTES.SETTINGS, icon: Settings, label: "Settings" },
  { to: ROUTES.NOTIFICATIONS, icon: Bell, label: "Notifications", soon: true },
  { to: ROUTES.MESSAGES, icon: MessageSquare, label: "Messages", soon: true },
  { to: ROUTES.LEADS, icon: UserPlus, label: "Leads", soon: true },
];

function SideNavLink({ to, icon: Icon, label, soon }: SidebarItem) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          soon && "opacity-60"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {soon && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          Soon
        </Badge>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-sidebar-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <img
            src="/logo.png"
            alt="GymFlow"
            className="h-8 w-8 rounded"
          />
          <span className="text-lg font-semibold">GymFlow</span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {mainItems.map((item) => (
            <SideNavLink key={item.to} {...item} />
          ))}

          <div className="my-3 border-t" />

          {secondaryItems.map((item) => (
            <SideNavLink key={item.to} {...item} />
          ))}
        </nav>

        {/* User section */}
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
