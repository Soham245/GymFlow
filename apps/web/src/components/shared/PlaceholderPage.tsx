import { TopBar } from "@/components/layout/TopBar";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
}

export function PlaceholderPage({ title, showBack, backTo }: PlaceholderPageProps) {
  return (
    <>
      <TopBar title={title} showBack={showBack} backTo={backTo} />
      {/* Desktop header */}
      <div className="hidden md:flex md:items-center md:justify-between md:border-b md:px-6 md:py-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <Construction className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page will be implemented in an upcoming phase.
        </p>
      </div>
    </>
  );
}
