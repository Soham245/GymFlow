import { Loader2 } from "lucide-react";

/** Full-page spinner shown while a lazy-loaded route chunk is downloading. */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
