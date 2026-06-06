import { sql } from "drizzle-orm";
import { payments } from "@gymflow/db";
import type { Database } from "@gymflow/db";

export async function generateReceiptNumber(
  db: Database,
  gymId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GYM-${year}-`;

  const [result] = await db
    .select({
      maxReceipt: sql<string>`MAX(${payments.receiptNumber})`,
    })
    .from(payments)
    .where(sql`${payments.gymId} = ${gymId} AND ${payments.receiptNumber} LIKE ${prefix + "%"}`);

  let nextSeq = 1;
  if (result?.maxReceipt) {
    const lastSeq = parseInt(result.maxReceipt.split("-").pop()!, 10);
    nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(6, "0")}`;
}
