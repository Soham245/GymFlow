export function generateReceiptNumber(gymSlug: string, sequence: number): string {
  const padded = String(sequence).padStart(6, "0");
  return `${gymSlug.toUpperCase()}-${padded}`;
}
