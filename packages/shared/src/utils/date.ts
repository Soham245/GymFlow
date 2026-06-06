export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

export function isExpiringSoon(endDate: string, withinDays: number): boolean {
  const end = new Date(endDate);
  const now = new Date();
  const diff = daysBetween(now, end);
  return diff >= 0 && diff <= withinDays;
}
