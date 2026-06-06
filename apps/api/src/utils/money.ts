/**
 * Standardize money values for API responses.
 *
 * PostgreSQL `numeric(10,2)` returns as string via Drizzle (e.g. "4000.00").
 * Computed values in JS are numbers (e.g. 0, 1300).
 *
 * CONTRACT: All money values in API responses are STRINGS with 2 decimal places.
 * This preserves precision and is consistent across DB fields and computed fields.
 *
 * The frontend should parse with parseFloat() or Number() when needed for math.
 */
export function toMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "0.00";
  return Number(value).toFixed(2);
}
