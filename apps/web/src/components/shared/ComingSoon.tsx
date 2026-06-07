import { MessageSquare, Bell, UserPlus, Clock } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";

const features: Record<
  string,
  { title: string; description: string; icon: React.ElementType }
> = {
  history: {
    title: "Message History",
    description:
      "View delivery history for all messages sent to your members. Track WhatsApp, SMS, and email notifications.",
    icon: MessageSquare,
  },
  templates: {
    title: "Message Templates",
    description:
      "Create reusable message templates with variables like member name, plan, and expiry date.",
    icon: MessageSquare,
  },
  scheduled: {
    title: "Scheduled Messages",
    description:
      "Schedule bulk messages for festivals, promotions, and reminders to your members.",
    icon: Clock,
  },
  notifications: {
    title: "Notifications",
    description:
      "Get real-time notifications for important events like new memberships, payments, and expirations.",
    icon: Bell,
  },
  leads: {
    title: "Lead Management",
    description:
      "Track potential members from inquiry to enrollment. Manage follow-ups and conversion.",
    icon: UserPlus,
  },
};

interface ComingSoonProps {
  feature: string;
}

export function ComingSoonPage({ feature }: ComingSoonProps) {
  const config = features[feature] ?? {
    title: "Coming Soon",
    description: "This feature is under development.",
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <>
      <TopBar title={config.title} showBack />
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">{config.title}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {config.description}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <Clock className="h-4 w-4" />
          Coming Soon
        </div>
      </div>
    </>
  );
}
