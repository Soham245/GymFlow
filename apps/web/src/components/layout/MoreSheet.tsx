import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { Sheet, SheetHeader, SheetTitle, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  route: string;
  soon?: boolean;
}

const items: NavItem[] = [
  { icon: CreditCard, label: "Memberships", route: ROUTES.MEMBERSHIPS },
  { icon: BarChart3, label: "Reports", route: ROUTES.REPORTS },
  { icon: Settings, label: "Settings", route: ROUTES.SETTINGS },
  { icon: Bell, label: "Notifications", route: ROUTES.NOTIFICATIONS, soon: true },
  { icon: MessageSquare, label: "Messages", route: ROUTES.MESSAGES, soon: true },
  { icon: UserPlus, label: "Leads", route: ROUTES.LEADS, soon: true },
];

export function MoreSheet({ open, onClose }: MoreSheetProps) {
  const navigate = useNavigate();

  function handleNav(route: string, soon?: boolean) {
    if (soon) {
      navigate(route);
    } else {
      navigate(route);
    }
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader onClose={onClose}>
        <SheetTitle>More</SheetTitle>
      </SheetHeader>
      <SheetContent>
        <div className="space-y-1">
          {items.map(({ icon: Icon, label, route, soon }) => (
            <button
              key={route}
              onClick={() => handleNav(route, soon)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors",
                soon
                  ? "text-muted-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{label}</span>
              {soon && (
                <Badge variant="secondary" className="text-xs">
                  Soon
                </Badge>
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
