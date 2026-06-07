import {
  Server,
  Database,
  Clock,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Wifi,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useHealthCheck, useDbHealthCheck } from "../hooks/use-settings";

export default function SystemInfoPage() {
  return (
    <>
      <PageHeader
        title="System Information"
        showBack
        backTo={ROUTES.SETTINGS}
        subtitle="Server health, database status, and version info"
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <ServerHealthCard />
          <DatabaseHealthCard />
        </div>
      </div>
    </>
  );
}

// ─── Server Health ────────────────────────────────────────────

function ServerHealthCard() {
  const { data, isLoading, isError, refetch, isRefetching } = useHealthCheck();

  if (isLoading) return <Skeleton className="h-44 rounded-lg" />;
  if (isError) return <ErrorState title="Server unreachable" onRetry={refetch} />;
  if (!data) return null;

  const isHealthy = data.status === "ok" || data.status === "healthy";

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            isHealthy ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}>
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">API Server</h3>
            <div className="flex items-center gap-1.5">
              {isHealthy ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className={cn("text-xs font-medium", isHealthy ? "text-green-600" : "text-red-600")}>
                {isHealthy ? "Healthy" : data.status}
              </span>
            </div>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
        </Button>
      </div>

      <div className="divide-y">
        <InfoRow icon={Activity} label="Version" value={data.version} />
        <InfoRow icon={Clock} label="Uptime" value={data.uptime} />
        <InfoRow icon={Server} label="Environment" value={data.environment} />
        <InfoRow icon={Clock} label="Server Time" value={new Date(data.timestamp).toLocaleString("en-IN")} />
      </div>
    </div>
  );
}

// ─── Database Health ──────────────────────────────────────────

function DatabaseHealthCard() {
  const { data, isLoading, isError, refetch, isRefetching } = useDbHealthCheck();

  if (isLoading) return <Skeleton className="h-44 rounded-lg" />;
  if (isError) return <ErrorState title="Database health check failed" onRetry={refetch} />;
  if (!data) return null;

  const isHealthy = data.status === "ok" || data.status === "healthy";

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            isHealthy ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}>
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Database</h3>
            <div className="flex items-center gap-1.5">
              {isHealthy ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className={cn("text-xs font-medium", isHealthy ? "text-green-600" : "text-red-600")}>
                {isHealthy ? "Connected" : data.status}
              </span>
            </div>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
        </Button>
      </div>

      <div className="divide-y">
        <InfoRow icon={Database} label="Engine" value={data.database} />
        <InfoRow icon={Activity} label="Version" value={data.version} />
        <InfoRow
          icon={Wifi}
          label="Latency"
          value={`${data.latencyMs}ms`}
          valueColor={data.latencyMs < 50 ? "text-green-600" : data.latencyMs < 200 ? "text-amber-600" : "text-red-600"}
        />
        <InfoRow icon={Clock} label="Server Time" value={new Date(data.serverTime).toLocaleString("en-IN")} />
      </div>
    </div>
  );
}

// ─── Shared row component ─────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-sm font-medium", valueColor)}>{value}</span>
    </div>
  );
}
