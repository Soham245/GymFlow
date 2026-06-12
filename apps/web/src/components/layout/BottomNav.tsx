import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface BottomNavProps {
  onMoreClick: () => void;
}

const tabs = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: "Home" },
  { to: ROUTES.MEMBERS, icon: Users, label: "Members" },
  { to: ROUTES.PAYMENTS, icon: Wallet, label: "Payments" },
  { to: ROUTES.EXPENSES, icon: Receipt, label: "Expenses" },
] as const;

export function BottomNav({ onMoreClick }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex h-14 items-center justify-around">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
