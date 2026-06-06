import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UserPlus, Wallet, Receipt, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";

export function QuickAddFAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const canCreateMember = usePermission("members:create");
  const canCreatePayment = usePermission("payments:create");
  const canCreateExpense = usePermission("expenses:create");

  // Don't show if user has no create permissions
  if (!canCreateMember && !canCreatePayment && !canCreateExpense) {
    return null;
  }

  const actions = [
    {
      icon: UserPlus,
      label: "Add Member",
      route: "/members/new",
      visible: canCreateMember,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      icon: Wallet,
      label: "Record Payment",
      route: "/payments/new",
      visible: canCreatePayment,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      icon: Receipt,
      label: "Add Expense",
      route: "/expenses/new",
      visible: canCreateExpense,
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ].filter((a) => a.visible);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-3 md:hidden">
        {/* Speed dial actions */}
        {open &&
          actions.map(({ icon: Icon, label, route, color }, i) => (
            <div
              key={route}
              className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="rounded-md bg-foreground/80 px-2 py-1 text-xs font-medium text-background shadow">
                {label}
              </span>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate(route);
                }}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95",
                  color
                )}
              >
                <Icon className="h-5 w-5" />
              </button>
            </div>
          ))}

        {/* Main FAB */}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all active:scale-95",
            open && "rotate-45"
          )}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
