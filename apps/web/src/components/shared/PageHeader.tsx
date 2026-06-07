import { cn } from "@/lib/utils";
import { TopBar } from "@/components/layout/TopBar";

interface PageHeaderProps {
  /** Page title — shown in both mobile TopBar and desktop header */
  title: string;
  /** Show mobile back button */
  showBack?: boolean;
  /** Back button destination */
  backTo?: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Right-side actions (buttons, etc.) — desktop only */
  actions?: React.ReactNode;
  /** Right-side actions for mobile TopBar */
  mobileActions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  showBack,
  backTo,
  subtitle,
  actions,
  mobileActions,
  className,
}: PageHeaderProps) {
  return (
    <>
      {/* Mobile header */}
      <TopBar title={title} showBack={showBack} backTo={backTo} actions={mobileActions} />

      {/* Desktop header */}
      <div className={cn("hidden md:flex md:items-center md:justify-between md:border-b md:px-6 md:py-4", className)}>
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </>
  );
}
