import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, UserPlus, Wallet, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";

// Order: top-to-bottom when expanded = Expense, Payment, Member, [X]
const ACTIONS = [
  {
    key: "expense",
    icon: Receipt,
    label: "Add Expense",
    route: "/expenses/new",
    permission: "expenses:create" as const,
    color: "bg-orange-600 hover:bg-orange-700",
  },
  {
    key: "payment",
    icon: Wallet,
    label: "Record Payment",
    route: "/payments/new",
    permission: "payments:create" as const,
    color: "bg-green-600 hover:bg-green-700",
  },
  {
    key: "member",
    icon: UserPlus,
    label: "Add Member",
    route: "/members/new",
    permission: "members:create" as const,
    color: "bg-blue-600 hover:bg-blue-700",
  },
];

export function FloatingActionMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const canCreateMember = usePermission("members:create");
  const canCreatePayment = usePermission("payments:create");
  const canCreateExpense = usePermission("expenses:create");

  const permissionMap: Record<string, boolean> = {
    "members:create": canCreateMember,
    "payments:create": canCreatePayment,
    "expenses:create": canCreateExpense,
  };

  const visibleActions = ACTIONS.filter((a) => permissionMap[a.permission]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (visibleActions.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/*
        Container: anchored bottom-right above BottomNav.
        All circles are in a single right-aligned column sharing one center X.
        The column width is 56px (w-14) — same as main FAB — so every circle centers on the same axis.
      */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 md:hidden">
        {/* Action rows — expand upward above the main FAB */}
        {visibleActions.map(({ key, icon: Icon, label, route, color }, i) => (
          <div
            key={key}
            className={cn(
              "flex items-center gap-3 transition-all duration-200",
              open
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0"
            )}
            style={{
              transitionDelay: open
                ? `${(visibleActions.length - 1 - i) * 50}ms`
                : `${i * 50}ms`,
            }}
          >
            {/* Label chip */}
            <span
              className={cn(
                "flex h-8 items-center whitespace-nowrap rounded-lg bg-foreground/80 px-3 text-xs font-medium text-background shadow-md transition-all duration-200",
                open ? "scale-100 opacity-100" : "scale-95 opacity-0"
              )}
            >
              {label}
            </span>

            {/* Circular icon — centered in a w-14 cell to match main FAB width */}
            <div className="flex w-14 shrink-0 items-center justify-center">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate(route);
                }}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 active:scale-90",
                  color,
                  open ? "scale-100" : "scale-95"
                )}
              >
                <Icon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}

        {/* Main FAB toggle — w-14 h-14, centers in the same column */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-90"
          style={{
            transform: open ? "rotate(-45deg)" : "rotate(0deg)",
            transition: "transform 250ms ease-in-out",
          }}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </>
  );
}
