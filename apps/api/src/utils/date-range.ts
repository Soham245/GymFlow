import type { ReportPeriod } from "@gymflow/shared";
import { AppError } from "./app-error.js";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function resolveDateRange(
  period: ReportPeriod,
  customFrom?: string,
  customTo?: string
): DateRange {
  const now = new Date();
  const today = todayStr();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  switch (period) {
    case "today":
      return { from: today, to: today };

    case "this_week": {
      const day = now.getDay();
      const diff = (day + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      const monStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
      return { from: monStr, to: today };
    }

    case "this_month":
      return { from: `${year}-${pad(month)}-01`, to: today };

    case "last_month": {
      const lmYear = month === 1 ? year - 1 : year;
      const lmMonth = month === 1 ? 12 : month - 1;
      const lastDay = new Date(year, month - 1, 0).getDate();
      return {
        from: `${lmYear}-${pad(lmMonth)}-01`,
        to: `${lmYear}-${pad(lmMonth)}-${pad(lastDay)}`,
      };
    }

    case "last_30_days": {
      const d30 = new Date(now);
      d30.setDate(d30.getDate() - 29);
      return { from: `${d30.getFullYear()}-${pad(d30.getMonth() + 1)}-${pad(d30.getDate())}`, to: today };
    }

    case "last_90_days": {
      const d90 = new Date(now);
      d90.setDate(d90.getDate() - 89);
      return { from: `${d90.getFullYear()}-${pad(d90.getMonth() + 1)}-${pad(d90.getDate())}`, to: today };
    }

    case "this_year":
      return { from: `${year}-01-01`, to: today };

    case "all_time":
      return { from: "2000-01-01", to: today };

    case "custom": {
      if (!customFrom || !customTo) {
        throw AppError.badRequest("Custom period requires 'from' and 'to' dates");
      }
      if (customFrom > customTo) {
        throw AppError.badRequest("'from' must be before 'to'");
      }
      return { from: customFrom, to: customTo };
    }
  }
}

export function previousDateRange(range: DateRange): DateRange {
  const from = new Date(range.from + "T00:00:00");
  const to = new Date(range.to + "T00:00:00");
  const spanMs = to.getTime() - from.getTime();
  const spanDays = Math.round(spanMs / (1000 * 60 * 60 * 24));

  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - spanDays);

  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: fmt(prevFrom), to: fmt(prevTo) };
}
