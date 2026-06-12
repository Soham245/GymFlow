import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  AlertCircle,
  Loader2,
  Download,
  Percent,
  Snowflake,
  Clock,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { useAnalytics, type ReportPeriod } from "../hooks/use-reports";
import { formatMoney, cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { tokenStore } from "@/api/client";
import type { TrendChange, AnalyticsData } from "@/api/types";

// ─── Measured container (avoids Recharts -1 width/height warnings) ──

function useMeasured<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, ...size };
}

// ─── Constants ───────────────────────────────────────────────

const CARD_CLASS = "rounded-xl border bg-card p-4";
const SECTION_HEADER_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

const CHART_COLORS = {
  revenue: "#22c55e",
  expenses: "#ef4444",
  profit: "#3b82f6",
};

const DONUT_REVENUE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const DONUT_EXPENSE_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6", "#ec4899"];

// ─── Period URL sync ─────────────────────────────────────────

function usePeriodFromUrl() {
  const [params, setParams] = useSearchParams();
  const range = (params.get("range") as ReportPeriod) || "last_90_days";
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;

  function setRange(r: ReportPeriod, f?: string, t?: string) {
    const next = new URLSearchParams();
    next.set("range", r);
    if (f) next.set("from", f);
    if (t) next.set("to", t);
    setParams(next, { replace: true });
  }

  return { range, from, to, setRange };
}

function buildExportUrl(endpoint: string, params: Record<string, string>): string {
  const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";
  const token = tokenStore.getAccessToken();
  const sp = new URLSearchParams();
  if (token) sp.set("token", token);
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  return `${baseUrl}${endpoint}?${sp.toString()}`;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatCompactY(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(0)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(0)}k`;
  return `${sign}₹${abs}`;
}

function daysOverdue(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function memberInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function scaledValueClass(value: string): string {
  const digitCount = value.replace(/[^0-9]/g, "").length;
  if (digitCount >= 8) return "text-sm font-bold tabular-nums";
  if (digitCount >= 7) return "text-base font-bold tabular-nums";
  if (digitCount >= 6) return "text-lg font-bold tabular-nums";
  return "text-xl font-bold tabular-nums";
}

// ─── Trend badge ─────────────────────────────────────────────

function TrendBadge({ change, invert }: { change: TrendChange; invert?: boolean }) {
  if (change.dir === "flat") {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }
  const isPositive = invert ? change.dir === "down" : change.dir === "up";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      )}
    >
      {change.dir === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {change.pct}%
    </span>
  );
}

// ─── Chart tooltip ──────────────────────────────────────────

interface ChartTooltipPayload {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
  paymentCount: number;
  expenseCount: number;
  newMembers: number;
  renewals: number;
  fullMonth: string;
}

function ChartTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ChartTooltipPayload;

  return (
    <div className="rounded-lg border bg-card/95 backdrop-blur-sm p-2.5 shadow-md" style={{ width: 200 }}>
      <p className="text-[13px] font-semibold mb-1.5">{d.fullMonth}</p>
      <div className="space-y-0.5 mb-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-green-600 font-medium">Revenue</span>
          <span className="text-[11px] font-bold tabular-nums text-green-600">{formatMoney(d.revenue)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-red-600 font-medium">Expenses</span>
          <span className="text-[11px] font-bold tabular-nums text-red-600">{formatMoney(d.expenses)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-blue-600 font-medium">Profit</span>
          <span className="text-[11px] font-bold tabular-nums text-blue-600">{formatMoney(d.profit)}</span>
        </div>
      </div>
      <div className="border-t pt-1.5 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <IndianRupee className="h-2.5 w-2.5" /> Payments
          </span>
          <span className="text-[10px] font-semibold tabular-nums">{d.paymentCount}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Receipt className="h-2.5 w-2.5" /> Expenses
          </span>
          <span className="text-[10px] font-semibold tabular-nums">{d.expenseCount}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="h-2.5 w-2.5" /> New Members
          </span>
          <span className="text-[10px] font-semibold tabular-nums">{d.newMembers}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <UserCheck className="h-2.5 w-2.5" /> Renewals
          </span>
          <span className="text-[10px] font-semibold tabular-nums">{d.renewals}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Section 1: Financial Performance Line Chart ─────────────

function FinancialPerformanceChart({
  trends,
}: {
  trends: AnalyticsData["trends"];
}) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const chartData = useMemo(
    () =>
      trends.map((t) => {
        const d = new Date(t.month + "-01");
        return {
          label: d.toLocaleDateString("en-IN", { month: "short" }),
          fullMonth: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
          revenue: parseFloat(t.revenue),
          expenses: parseFloat(t.expenses),
          profit: parseFloat(t.profit),
          paymentCount: t.paymentCount,
          expenseCount: t.expenseCount,
          newMembers: t.newMembers,
          renewals: t.renewals,
        };
      }),
    [trends]
  );

  const toggleSeries = useCallback((key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className={CARD_CLASS}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Financial Performance (Last 6 Months)</h2>
          <p className="text-xs text-muted-foreground">Revenue, Expenses & Profit over time</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
          {(
            [
              { key: "revenue", color: CHART_COLORS.revenue, label: "Revenue" },
              { key: "expenses", color: CHART_COLORS.expenses, label: "Expenses" },
              { key: "profit", color: CHART_COLORS.profit, label: "Profit" },
            ] as const
          ).map((s) => (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-medium transition-all",
                hiddenSeries.has(s.key)
                  ? "border-border bg-muted text-muted-foreground opacity-50"
                  : "border-border bg-card"
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280} minWidth={0}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            {(["revenue", "expenses", "profit"] as const).map((key) => (
              <filter key={key} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood floodColor={CHART_COLORS[key]} floodOpacity="0.5" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="shadow" />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCompactY}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip
            content={<ChartTooltipContent />}
            offset={24}
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
            wrapperStyle={{
              pointerEvents: "none",
              zIndex: 50,
              transition: "transform 180ms ease-out, opacity 120ms ease",
              outline: "none",
            }}
            allowEscapeViewBox={{ x: false, y: true }}
          />
          {!hiddenSeries.has("revenue") && (
            <Line
              type="linear"
              dataKey="revenue"
              stroke={CHART_COLORS.revenue}
              strokeWidth={2}
              dot={{ r: 5, fill: CHART_COLORS.revenue, strokeWidth: 2.5, stroke: "#fff" }}
              activeDot={{ r: 8, strokeWidth: 3, stroke: "#fff", filter: "url(#glow-revenue)" }}
              animationDuration={500}
            />
          )}
          {!hiddenSeries.has("expenses") && (
            <Line
              type="linear"
              dataKey="expenses"
              stroke={CHART_COLORS.expenses}
              strokeWidth={2}
              dot={{ r: 5, fill: CHART_COLORS.expenses, strokeWidth: 2.5, stroke: "#fff" }}
              activeDot={{ r: 8, strokeWidth: 3, stroke: "#fff", filter: "url(#glow-expenses)" }}
              animationDuration={500}
            />
          )}
          {!hiddenSeries.has("profit") && (
            <Line
              type="linear"
              dataKey="profit"
              stroke={CHART_COLORS.profit}
              strokeWidth={2}
              dot={{ r: 5, fill: CHART_COLORS.profit, strokeWidth: 2.5, stroke: "#fff" }}
              activeDot={{ r: 8, strokeWidth: 3, stroke: "#fff", filter: "url(#glow-profit)" }}
              animationDuration={500}
            />
          )}
          <ReferenceLine y={0} stroke="#666" strokeWidth={1} strokeDasharray="2 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────

function DonutBreakdown({
  title,
  items,
  colors,
  totalLabel,
  total,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  items: Array<{ label: string; value: number; count: number }>;
  colors: string[];
  totalLabel: string;
  total: number;
  ctaLabel: string;
  ctaHref: string;
}) {
  const navigate = useNavigate();
  const { ref: ringRef, w: ringW, h: ringH } = useMeasured<HTMLDivElement>();
  const chartItems = useMemo(() => {
    if (items.length <= 4) return items;
    const top4 = items.slice(0, 4);
    const rest = items.slice(4);
    const othersValue = rest.reduce((s, i) => s + i.value, 0);
    const othersCount = rest.reduce((s, i) => s + i.count, 0);
    return [...top4, { label: "Others", value: othersValue, count: othersCount }];
  }, [items]);

  const pieData = chartItems.map((item) => ({ name: item.label, value: item.value }));

  const moneyStr = formatMoney(total);
  const digitCount = moneyStr.replace(/[^0-9]/g, "").length;
  const centerFontClass =
    digitCount >= 10 ? "text-xs sm:text-sm" :
    digitCount >= 8  ? "text-sm sm:text-base" :
    digitCount >= 6  ? "text-base sm:text-lg" :
    "text-lg sm:text-xl";

  return (
    <div className={cn(CARD_CLASS, "flex flex-col")}>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="flex items-center gap-3 sm:gap-4 flex-1">
        <div ref={ringRef} className="relative w-[148px] h-[148px] sm:w-[180px] sm:h-[180px] shrink-0">
          {ringW > 0 && ringH > 0 && (
            <PieChart width={ringW} height={ringH}>
              <Pie
                data={pieData.length > 0 ? pieData : [{ name: "empty", value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius="68%"
                outerRadius="96%"
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieData.length > 0
                  ? pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)
                  : <Cell fill="hsl(var(--muted))" />}
              </Pie>
            </PieChart>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={cn("font-bold tabular-nums whitespace-nowrap", centerFontClass)}>{moneyStr}</span>
            <span className="text-[8px] sm:text-[10px] text-muted-foreground whitespace-nowrap">{totalLabel}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
          {chartItems.map((item, i) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
            return (
              <div key={item.label} className="flex items-center gap-1.5 sm:gap-2">
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-[10px] sm:text-xs text-muted-foreground capitalize whitespace-nowrap truncate">{item.label.replace(/_/g, " ")}</span>
                <span className="text-[10px] sm:text-xs font-medium tabular-nums whitespace-nowrap ml-auto shrink-0">
                  {formatMoney(item.value)} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <button
        onClick={() => navigate(ctaHref)}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {ctaLabel} <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── KPI Card (responsive value scaling) ─────────────────────

type KpiColor = "default" | "green" | "red" | "blue" | "amber" | "purple";

const kpiColorMap: Record<KpiColor, string> = {
  default: "bg-card border",
  green: "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-900",
  red: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900",
  blue: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900",
  amber: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900",
  purple: "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900",
};

const kpiIconColor: Record<KpiColor, string> = {
  default: "text-foreground",
  green: "text-green-600 dark:text-green-400",
  red: "text-red-600 dark:text-red-400",
  blue: "text-blue-600 dark:text-blue-400",
  amber: "text-amber-600 dark:text-amber-400",
  purple: "text-purple-600 dark:text-purple-400",
};

function KpiCard({
  label,
  value,
  icon: Icon,
  change,
  invertTrend,
  previousValue,
  subtitle,
  color = "default",
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  change?: TrendChange;
  invertTrend?: boolean;
  previousValue?: string;
  subtitle?: string;
  color?: KpiColor;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      className={cn(
        "rounded-xl border p-3 sm:p-4 text-left overflow-hidden",
        kpiColorMap[color],
        onClick && "cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0", kpiIconColor[color])} />
          <p className={cn(SECTION_HEADER_CLASS, "truncate")}>{label}</p>
        </div>
        {onClick && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      </div>
      <p className={cn("mt-1.5 sm:mt-2", scaledValueClass(value))}>{value}</p>
      {change && (
        <div className="mt-1">
          <TrendBadge change={change} invert={invertTrend} />
        </div>
      )}
      {previousValue && (
        <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground tabular-nums truncate">
          vs {previousValue} previous period
        </p>
      )}
      {subtitle && (
        <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{subtitle}</p>
      )}
    </Wrapper>
  );
}

// ─── Membership Health (swipeable carousel) ──────────────────

function MembershipHealth({
  data,
}: {
  data: AnalyticsData["memberships"];
}) {
  const navigate = useNavigate();
  const totalMembers = data.active + data.frozen + data.expired + (data.cancelled ?? 0);
  const expiring8to30 = data.expiring30Days - data.expiring7Days;

  const cards = [
    {
      icon: Users,
      label: "Active",
      value: data.active,
      detail: `${totalMembers > 0 ? ((data.active / totalMembers) * 100).toFixed(1) : 0}% of total`,
      bg: "bg-green-50 dark:bg-green-950/40",
      border: "border-green-200 dark:border-green-900",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      icon: Snowflake,
      label: "Frozen",
      value: data.frozen,
      detail: `${totalMembers > 0 ? ((data.frozen / totalMembers) * 100).toFixed(1) : 0}% of total`,
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Clock,
      label: "Expired",
      value: data.expired,
      detail: `${totalMembers > 0 ? ((data.expired / totalMembers) * 100).toFixed(1) : 0}% of total`,
      bg: "bg-red-50 dark:bg-red-950/40",
      border: "border-red-200 dark:border-red-900",
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      icon: AlertTriangle,
      label: "Exp. ≤ 7D",
      value: data.expiring7Days,
      detail: `${data.active > 0 ? ((data.expiring7Days / data.active) * 100).toFixed(1) : 0}% of active`,
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-900",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: AlertTriangle,
      label: "Exp. 8–30D",
      value: expiring8to30,
      detail: `${data.active > 0 ? ((expiring8to30 / data.active) * 100).toFixed(1) : 0}% of active`,
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-900",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function handleScroll() {
      if (!el) return;
      const scrollRatio = el.scrollLeft / (el.scrollWidth - el.clientWidth);
      setActivePage(scrollRatio > 0.5 ? 1 : 0);
    }
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToPage(page: number) {
    const el = scrollRef.current;
    if (!el) return;
    const target = page === 0 ? 0 : el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: target, behavior: "smooth" });
  }

  const CARD_H = "h-[110px]";

  const HealthCard = ({ c }: { c: (typeof cards)[number] }) => (
    <div className={cn("rounded-xl border p-3 text-center flex flex-col items-center justify-center", CARD_H, c.bg, c.border)}>
      <div className="flex items-center justify-center gap-1 mb-1">
        <c.icon className={cn("h-3.5 w-3.5", c.iconColor)} />
        <span className={cn(SECTION_HEADER_CLASS, "text-[10px]")}>{c.label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{c.value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{c.detail}</p>
    </div>
  );

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Membership Health</h2>
        <button
          onClick={() => navigate(ROUTES.MEMBERS)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all members <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Desktop: show all 5 */}
      <div className="hidden sm:grid sm:grid-cols-5 gap-3">
        {cards.map((c) => (
          <HealthCard key={c.label} c={c} />
        ))}
      </div>

      {/* Mobile: horizontally scrollable with snap — locked height */}
      <div className="sm:hidden">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch", minHeight: 118 }}
        >
          {/* Page 1: first 3 cards */}
          <div className="flex gap-2 snap-start shrink-0 w-full">
            {cards.slice(0, 3).map((c) => (
              <div key={c.label} className="flex-1 min-w-0">
                <HealthCard c={c} />
              </div>
            ))}
          </div>
          {/* Page 2: last 2 cards — centered */}
          <div className="flex gap-2 snap-start shrink-0 w-full justify-center px-4">
            {cards.slice(3).map((c) => (
              <div key={c.label} className="w-[calc(50%-4px)] max-w-[160px]">
                <HealthCard c={c} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[0, 1].map((i) => (
            <button
              key={i}
              onClick={() => scrollToPage(i)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === activePage ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Outstanding Balances (responsive rows) ──────────────────

function OutstandingBalances({
  data,
}: {
  data: AnalyticsData["outstanding"];
}) {
  const navigate = useNavigate();

  function handlePay(memberId: string, membershipId: string) {
    navigate(`${ROUTES.PAYMENT_NEW}?memberId=${memberId}&membershipId=${membershipId}`);
  }

  const avatarColors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-red-100 text-red-700",
    "bg-pink-100 text-pink-700",
  ];

  return (
    <div className={CARD_CLASS} id="outstanding-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Outstanding Balances</h2>
        <p className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
          Total: {formatMoney(data.totalOutstanding)}
        </p>
      </div>

      {data.balances.length === 0 ? (
        <p className="text-sm text-muted-foreground">No outstanding balances</p>
      ) : (
        <div className="space-y-3">
          {data.balances.slice(0, 10).map((b, i) => {
            const overdue = daysOverdue(b.endDate);
            return (
              <div key={b.membershipId} className="flex items-center gap-2 sm:gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm font-semibold",
                    avatarColors[i % avatarColors.length]
                  )}
                >
                  {memberInitials(b.memberName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{b.memberName}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.planName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                    {formatMoney(b.outstanding)}
                  </p>
                  {overdue > 0 && (
                    <p className="text-[10px] text-red-500">{overdue} days overdue</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs h-auto px-2 py-1.5 sm:px-3 sm:h-8 sm:py-0 leading-tight"
                  onClick={() => handlePay(b.memberId, b.membershipId)}
                >
                  <span className="hidden sm:inline">Record Payment</span>
                  <span className="sm:hidden flex flex-col items-center text-[11px] leading-tight">
                    <span>Record</span>
                    <span>Payment</span>
                  </span>
                </Button>
              </div>
            );
          })}
          {data.balances.length > 10 && (
            <p className="text-center text-xs text-muted-foreground pt-1">
              +{data.balances.length - 10} more members with dues
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function ReportsIndexPage() {
  const navigate = useNavigate();
  const { range, from, to, setRange } = usePeriodFromUrl();
  const { data, isLoading, error } = useAnalytics({ range, from, to });

  const exportParams: Record<string, string> = { range };
  if (from) exportParams.from = from;
  if (to) exportParams.to = to;

  function dateFilterParams(): string {
    if (!data) return "";
    const sp = new URLSearchParams();
    sp.set("dateFrom", data.period.from);
    sp.set("dateTo", data.period.to);
    return sp.toString();
  }

  const totalMembers = data
    ? data.memberships.active + data.memberships.frozen + data.memberships.expired + (data.memberships.cancelled ?? 0)
    : 0;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Business Analytics"
        mobileActions={
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() =>
              window.open(
                buildExportUrl("/reports/analytics", { ...exportParams, format: "csv" }),
                "_blank"
              )
            }
          >
            <Download className="h-4 w-4" />
          </Button>
        }
        actions={
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() =>
              window.open(
                buildExportUrl("/reports/analytics", { ...exportParams, format: "csv" }),
                "_blank"
              )
            }
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        }
      />

      <div className="space-y-4 p-4 pb-24 md:space-y-6 md:p-6 md:pb-6">
        <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
          {/* Section 1: Financial Performance Chart */}
          {data?.trends && data.trends.length > 0 && (
            <FinancialPerformanceChart trends={data.trends} />
          )}

          {/* Section 2: Analytics Snapshot header + period dropdown */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Analytics Snapshot</h2>
            <PeriodSelector
              value={{ period: range, from, to }}
              onChange={(q) => setRange(q.period as ReportPeriod, q.from, q.to)}
            />
          </div>

          {/* Loading / Error */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              Failed to load analytics. Please try again.
            </div>
          )}

          {data && (
            <>
              {/* KPI Cards — always 2-col on mobile, 3-col on desktop */}
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                <KpiCard
                  label="Revenue"
                  value={formatMoney(data.revenue.totalRevenue)}
                  icon={IndianRupee}
                  change={data.revenue.change}
                  previousValue={formatMoney(data.revenue.previousTotal)}
                  color="green"
                  subtitle={`${data.revenue.paymentCount} payments · avg ${formatMoney(data.revenue.averagePayment)}`}
                  onClick={() => navigate(`${ROUTES.PAYMENTS}?${dateFilterParams()}`)}
                />
                <KpiCard
                  label="Expenses"
                  value={formatMoney(data.expenses.totalExpenses)}
                  icon={Receipt}
                  change={data.expenses.change}
                  invertTrend
                  previousValue={formatMoney(data.expenses.previousTotal)}
                  color="red"
                  subtitle={`${data.expenses.expenseCount} transactions`}
                  onClick={() => navigate(`${ROUTES.EXPENSES}?${dateFilterParams()}`)}
                />
                <KpiCard
                  label="Profit"
                  value={formatMoney(data.profit.profit)}
                  icon={TrendingUp}
                  change={data.profit.change}
                  previousValue={formatMoney(data.profit.previousProfit)}
                  color="blue"
                />
                <KpiCard
                  label="Margin"
                  value={`${data.profit.margin}%`}
                  icon={Percent}
                  change={data.profit.marginChange}
                  previousValue={`${data.profit.previousMargin}%`}
                  color="purple"
                />
                <KpiCard
                  label="Outstanding"
                  value={formatMoney(data.outstanding.totalOutstanding)}
                  icon={AlertCircle}
                  color="amber"
                  subtitle={`${data.outstanding.membersWithDues} members with dues`}
                  onClick={() => {
                    const el = document.getElementById("outstanding-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
                <KpiCard
                  label="Members With Dues"
                  value={String(data.outstanding.membersWithDues)}
                  icon={UserCheck}
                  color="amber"
                  subtitle={`${totalMembers > 0 ? ((data.outstanding.membersWithDues / totalMembers) * 100).toFixed(1) : 0}% of total members`}
                  onClick={() => {
                    const el = document.getElementById("outstanding-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              </div>

              {/* Revenue & Expense Breakdowns (side by side) */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <DonutBreakdown
                  title="Revenue by Payment Method"
                  items={data.revenue.paymentMethodBreakdown.map((m) => ({
                    label: m.method,
                    value: parseFloat(m.total),
                    count: m.count,
                  }))}
                  colors={DONUT_REVENUE_COLORS}
                  totalLabel="Total Revenue"
                  total={parseFloat(data.revenue.totalRevenue)}
                  ctaLabel="View all payments"
                  ctaHref={`${ROUTES.PAYMENTS}?${dateFilterParams()}`}
                />
                <DonutBreakdown
                  title="Expenses by Category"
                  items={data.expenses.categoryBreakdown.map((c) => ({
                    label: c.category,
                    value: parseFloat(c.total),
                    count: c.count,
                  }))}
                  colors={DONUT_EXPENSE_COLORS}
                  totalLabel="Total Expenses"
                  total={parseFloat(data.expenses.totalExpenses)}
                  ctaLabel="View all expenses"
                  ctaHref={`${ROUTES.EXPENSES}?${dateFilterParams()}`}
                />
              </div>

              {/* Membership Health */}
              <MembershipHealth data={data.memberships} />

              {/* Outstanding Balances */}
              <OutstandingBalances data={data.outstanding} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
