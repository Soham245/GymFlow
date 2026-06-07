import { useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Users,
  FolderOpen,
  Zap,
  Download,
  Server,
  Building2,
  ChevronRight,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useRole } from "@/hooks/use-permission";
import { ROUTES } from "@/lib/constants";

interface SettingsCard {
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  ownerOnly?: boolean;
  color: string;
}

const CARDS: SettingsCard[] = [
  {
    title: "Membership Plans",
    description: "Create and manage membership plan templates",
    icon: Dumbbell,
    route: ROUTES.SETTINGS_PLANS,
    ownerOnly: true,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Expense Categories",
    description: "Organize and manage expense categories",
    icon: FolderOpen,
    route: ROUTES.SETTINGS_CATEGORIES,
    ownerOnly: true,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "Data Exports",
    description: "Download members, revenue, and expense data",
    icon: Download,
    route: ROUTES.SETTINGS_EXPORTS,
    color: "bg-green-50 text-green-600",
  },
  {
    title: "Automation",
    description: "Expiring memberships, daily summary, backups",
    icon: Zap,
    route: ROUTES.SETTINGS_AUTOMATION,
    ownerOnly: true,
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "System Information",
    description: "Server health, database status, and version info",
    icon: Server,
    route: ROUTES.SETTINGS_SYSTEM,
    ownerOnly: true,
    color: "bg-gray-50 text-gray-600",
  },
  {
    title: "Gym Profile",
    description: "Gym name, address, and contact details",
    icon: Building2,
    route: ROUTES.SETTINGS_PROFILE,
    ownerOnly: true,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    title: "Users & Roles",
    description: "Manage staff accounts and permissions",
    icon: Users,
    route: ROUTES.SETTINGS_USERS,
    ownerOnly: true,
    color: "bg-rose-50 text-rose-600",
  },
];

export default function SettingsIndexPage() {
  const navigate = useNavigate();
  const role = useRole();
  const isOwner = role === "owner";

  return (
    <>
      <PageHeader title="Settings" />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {CARDS.map((card) => {
            const locked = card.ownerOnly && !isOwner;

            return (
              <button
                key={card.route}
                onClick={() => !locked && navigate(card.route)}
                disabled={locked}
                className="flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{card.title}</p>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>

                {locked ? (
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
