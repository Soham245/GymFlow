import { useNavigate } from "react-router-dom";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, showBack, backTo, actions }: TopBarProps) {
  const navigate = useNavigate();

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
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <Dumbbell className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}

      <h1 className="flex-1 truncate text-base font-semibold">
        {title || "GymFlow"}
      </h1>

      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  );
}
