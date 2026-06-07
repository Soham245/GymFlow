import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tokenStore } from "@/api/client";

interface ExportButtonsProps {
  csvUrl: string;
  xlsxUrl: string;
  /** Optional query params to append (e.g., period=this_month) */
  params?: Record<string, string>;
}

function buildExportUrl(endpoint: string, params?: Record<string, string>): string {
  const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";
  const token = tokenStore.getAccessToken();
  const searchParams = new URLSearchParams();
  if (token) searchParams.set("token", token);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) searchParams.set(k, v);
    }
  }
  return `${baseUrl}${endpoint}?${searchParams.toString()}`;
}

export function ExportButtons({ csvUrl, xlsxUrl, params }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Export
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => window.open(buildExportUrl(csvUrl, params), "_blank")}
      >
        <Download className="mr-1 h-3 w-3" />
        CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => window.open(buildExportUrl(xlsxUrl, params), "_blank")}
      >
        <Download className="mr-1 h-3 w-3" />
        XLSX
      </Button>
    </div>
  );
}
