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
