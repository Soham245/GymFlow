import { eq, and, desc, count, sql, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { inAppNotifications } from "@gymflow/db";
import type { Database } from "@gymflow/db";
import type { ListNotificationsQuery, InAppNotificationType } from "@gymflow/shared";
import { AppError } from "../../utils/app-error.js";

interface Ctx {
  db: Database;
  gymId: string;
}

interface CreateNotificationInput {
  type: InAppNotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(ctx: Ctx, input: CreateNotificationInput) {
  const { db, gymId } = ctx;

  const [notification] = await db
    .insert(inAppNotifications)
    .values({
      gymId,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      metadata: input.metadata,
    })
    .returning();

  return notification!;
}

export async function getNotifications(ctx: Ctx, query: ListNotificationsQuery) {
  const { db, gymId } = ctx;
  const { page, limit, type, isRead } = query;

  const conditions: SQL[] = [eq(inAppNotifications.gymId, gymId)];
  if (type) conditions.push(eq(inAppNotifications.type, type));
  if (isRead !== undefined) conditions.push(eq(inAppNotifications.isRead, isRead));

  const where = and(...conditions)!;
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(inAppNotifications)
      .where(where)
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(inAppNotifications).where(where),
  ]);

  const total = totalResult[0]!.total;
  return {
    items: data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  };
}

export async function getUnreadCount(ctx: Ctx) {
  const { db, gymId } = ctx;

  const [result] = await db
    .select({ count: count() })
    .from(inAppNotifications)
    .where(
      and(
        eq(inAppNotifications.gymId, gymId),
        eq(inAppNotifications.isRead, false)
      )
    );

  return result!.count;
}

export async function markAsRead(ctx: Ctx, notificationId: string) {
  const { db, gymId } = ctx;

  const [updated] = await db
    .update(inAppNotifications)
    .set({ isRead: true })
    .where(
      and(
        eq(inAppNotifications.id, notificationId),
        eq(inAppNotifications.gymId, gymId)
      )
    )
    .returning();

  if (!updated) throw AppError.notFound("Notification");
  return updated;
}

export async function markAllAsRead(ctx: Ctx) {
  const { db, gymId } = ctx;

  const result = await db
    .update(inAppNotifications)
    .set({ isRead: true })
    .where(
      and(
        eq(inAppNotifications.gymId, gymId),
        eq(inAppNotifications.isRead, false)
      )
    );

  return { updated: result.rowCount ?? 0 };
}

export async function deleteNotification(ctx: Ctx, notificationId: string) {
  const { db, gymId } = ctx;

  const [deleted] = await db
    .delete(inAppNotifications)
    .where(
      and(
        eq(inAppNotifications.id, notificationId),
        eq(inAppNotifications.gymId, gymId)
      )
    )
    .returning();

  if (!deleted) throw AppError.notFound("Notification");
  return deleted;
}

export async function notificationExists(
  ctx: Ctx,
  type: InAppNotificationType,
  relatedEntityType: string,
  relatedEntityId: string
): Promise<boolean> {
  const { db, gymId } = ctx;

  const [result] = await db
    .select({ count: count() })
    .from(inAppNotifications)
    .where(
      and(
        eq(inAppNotifications.gymId, gymId),
        eq(inAppNotifications.type, type),
        eq(inAppNotifications.relatedEntityType, relatedEntityType),
        eq(inAppNotifications.relatedEntityId, relatedEntityId)
      )
    );

  return result!.count > 0;
}

export async function getExistingNotificationKeys(
  ctx: Ctx,
  types: InAppNotificationType[],
  relatedEntityType: string
): Promise<Set<string>> {
  const { db, gymId } = ctx;

  const rows = await db
    .select({
      type: inAppNotifications.type,
      relatedEntityId: inAppNotifications.relatedEntityId,
    })
    .from(inAppNotifications)
    .where(
      and(
        eq(inAppNotifications.gymId, gymId),
        inArray(inAppNotifications.type, types),
        eq(inAppNotifications.relatedEntityType, relatedEntityType)
      )
    );

  const keys = new Set<string>();
  for (const r of rows) {
    if (r.relatedEntityId) keys.add(`${r.type}::${r.relatedEntityId}`);
  }
  return keys;
}

export async function createNotificationSafe(ctx: Ctx, input: CreateNotificationInput) {
  const { db, gymId } = ctx;

  const result = await db
    .insert(inAppNotifications)
    .values({
      gymId,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      metadata: input.metadata,
    })
    .onConflictDoNothing()
    .returning();

  return result[0] ?? null;
}

export async function deleteNotificationsByType(ctx: Ctx, type: InAppNotificationType) {
  const { db, gymId } = ctx;

  await db
    .delete(inAppNotifications)
    .where(
      and(
        eq(inAppNotifications.gymId, gymId),
        eq(inAppNotifications.type, type)
      )
    );
}
