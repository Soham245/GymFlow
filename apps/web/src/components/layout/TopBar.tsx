import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/features/notifications/hooks/use-notifications";
import { ROUTES } from "@/lib/constants";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, showBack, backTo, actions }: TopBarProps) {
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const unreadCount = unread.data ?? 0;

  function handleBack() {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden"
      )}
    >
      {showBack ? (
        <button
          onClick={handleBack}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        <img src="/logo.png" alt="GymFlow" className="h-7 w-7 rounded-md" />
      )}

      <h1 className="flex-1 truncate text-base font-semibold">
        {title || "GymFlow"}
      </h1>

      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(ROUTES.NOTIFICATIONS)}
          className="relative rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        {actions}
      </div>
    </header>
  );
}
