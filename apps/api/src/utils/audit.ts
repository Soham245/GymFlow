import { auditLogs } from "@gymflow/db";
import type { Database } from "@gymflow/db";

type AuditAction = typeof auditLogs.$inferInsert.action;

interface AuditEntry {
  gymId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(db: Database, entry: AuditEntry) {
  await db.insert(auditLogs).values(entry);
}

export function diffValues(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): { oldValues: Record<string, unknown>; newValues: Record<string, unknown> } {
  const oldValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};

  for (const key of Object.keys(newObj)) {
    if (oldObj[key] !== newObj[key]) {
      oldValues[key] = oldObj[key];
      newValues[key] = newObj[key];
    }
  }

  return { oldValues, newValues };
}
