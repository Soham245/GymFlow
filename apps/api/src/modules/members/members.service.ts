import {
  eq,
  and,
  desc,
  sql,
  inArray,
} from "drizzle-orm";
import {
  members,
  memberNotes,
  users,
  memberMemberships,
  membershipFreezes,
  payments,
} from "@gymflow/db";
import type { Database } from "@gymflow/db";
import type {
  CreateMemberInput,
  UpdateMemberInput,
  ChangeStatusInput,
  ListMembersQuery,
  CreateMemberNoteInput,
} from "@gymflow/shared";
import { AppError } from "../../utils/app-error.js";
import { createAuditLog, diffValues } from "../../utils/audit.js";

// ─── Types ──────────────────────────────────────────────────────

interface ServiceContext {
  db: Database;
  gymId: string;
  userId: string;
  ip?: string;
  userAgent?: string;
}

// ─── Helpers ────────────────────────────────────────────────────

function memberToAuditRecord(m: Record<string, unknown>) {
  const { createdAt, updatedAt, createdBy, gymId, ...rest } = m;
  return rest;
}


// ─── Create ─────────────────────────────────────────────────────

export async function createMember(
  ctx: ServiceContext,
  input: CreateMemberInput
) {
  const { db, gymId, userId } = ctx;

  const [existing] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.gymId, gymId), eq(members.phone, input.phone)))
    .limit(1);

  if (existing) {
    throw AppError.conflict(`A member with phone ${input.phone} already exists`);
  }

  const [member] = await db
    .insert(members)
    .values({
      gymId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      address: input.address,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      joinDate: input.joinDate,
      photoUrl: input.photoUrl,
      createdBy: userId,
    })
    .returning();

  await createAuditLog(db, {
    gymId,
    userId,
    action: "member_created",
    entityType: "member",
    entityId: member!.id,
    newValues: memberToAuditRecord(member as unknown as Record<string, unknown>),
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return member!;
}

// ─── Get By ID ──────────────────────────────────────────────────

export async function getMemberById(ctx: ServiceContext, memberId: string) {
  const { db, gymId } = ctx;

  const [member] = await db
    .select({
      id: members.id,
      gymId: members.gymId,
      name: members.name,
      phone: members.phone,
      email: members.email,
      gender: members.gender,
      dateOfBirth: members.dateOfBirth,
      address: members.address,
      emergencyContactName: members.emergencyContactName,
      emergencyContactPhone: members.emergencyContactPhone,
      photoUrl: members.photoUrl,
      joinDate: members.joinDate,
      status: members.status,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt,
      createdByName: users.name,
    })
    .from(members)
    .leftJoin(users, eq(members.createdBy, users.id))
    .where(and(eq(members.id, memberId), eq(members.gymId, gymId)))
    .limit(1);

  if (!member) {
    throw AppError.notFound("Member");
  }

  return member;
}

// ─── Update ─────────────────────────────────────────────────────

export async function updateMember(
  ctx: ServiceContext,
  memberId: string,
  input: UpdateMemberInput
) {
  const { db, gymId, userId } = ctx;

  const [existing] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.gymId, gymId)))
    .limit(1);

  if (!existing) {
    throw AppError.notFound("Member");
  }

  if (input.phone && input.phone !== existing.phone) {
    const [dup] = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.gymId, gymId),
          eq(members.phone, input.phone),
          sql`${members.id} != ${memberId}`
        )
      )
      .limit(1);

    if (dup) {
      throw AppError.conflict(`A member with phone ${input.phone} already exists`);
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.email !== undefined) updateData.email = input.email ?? null;
  if (input.gender !== undefined) updateData.gender = input.gender;
  if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth;
  if (input.address !== undefined) updateData.address = input.address;
  if (input.emergencyContactName !== undefined)
    updateData.emergencyContactName = input.emergencyContactName;
  if (input.emergencyContactPhone !== undefined)
    updateData.emergencyContactPhone = input.emergencyContactPhone ?? null;
  if (input.joinDate !== undefined) updateData.joinDate = input.joinDate;
  if (input.photoUrl !== undefined) updateData.photoUrl = input.photoUrl;

  const [updated] = await db
    .update(members)
    .set(updateData)
    .where(and(eq(members.id, memberId), eq(members.gymId, gymId)))
    .returning();

  const oldRecord = memberToAuditRecord(existing as unknown as Record<string, unknown>);
  const newRecord = memberToAuditRecord(updated as unknown as Record<string, unknown>);
  const { oldValues, newValues } = diffValues(oldRecord, newRecord);

  if (Object.keys(newValues).length > 0) {
    await createAuditLog(db, {
      gymId,
      userId,
      action: "member_updated",
      entityType: "member",
      entityId: memberId,
      oldValues,
      newValues,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  return updated!;
}

// ─── Change Status ──────────────────────────────────────────────

export async function changeMemberStatus(
  ctx: ServiceContext,
  memberId: string,
  input: ChangeStatusInput
) {
  const { db, gymId, userId } = ctx;

  const [existing] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.gymId, gymId)))
    .limit(1);

  if (!existing) {
    throw AppError.notFound("Member");
  }

  if (existing.status === input.status) {
    throw AppError.badRequest(`Member is already ${input.status}`);
  }

  const [updated] = await db
    .update(members)
    .set({ status: input.status, updatedAt: new Date() })
    .where(and(eq(members.id, memberId), eq(members.gymId, gymId)))
    .returning();

  await createAuditLog(db, {
    gymId,
    userId,
    action: "member_status_changed",
    entityType: "member",
    entityId: memberId,
    oldValues: { status: existing.status },
    newValues: { status: input.status, reason: input.reason },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return updated!;
}

// ─── List ───────────────────────────────────────────────────────

export async function listMembers(ctx: ServiceContext, query: ListMembersQuery) {
  const { db, gymId } = ctx;
  const { page, limit, status, search, joinDateFrom, joinDateTo, sortBy, sortOrder } = query;

  /*
   * We use drizzle sql`` with a LATERAL join to pick each member's latest
   * membership. Status is derived from that latest membership, not from
   * the (possibly stale) members.status column.
   */

  // Build dynamic WHERE conditions using drizzle sql fragments
  const whereParts: ReturnType<typeof sql>[] = [sql`m.gym_id = ${gymId}`];

  if (search) {
    const pattern = `%${search}%`;
    whereParts.push(sql`(m.name ILIKE ${pattern} OR m.phone ILIKE ${pattern})`);
  }
  if (joinDateFrom) {
    whereParts.push(sql`m.join_date >= ${joinDateFrom}`);
  }
  if (joinDateTo) {
    whereParts.push(sql`m.join_date <= ${joinDateTo}`);
  }
  if (status) {
    whereParts.push(sql`COALESCE(lm.ms_status::text, m.status::text) = ${status}`);
  }

  // Combine WHERE parts with AND
  const whereClause = whereParts.reduce((acc, part, i) =>
    i === 0 ? part : sql`${acc} AND ${part}`
  );

  // Sort mapping — use sql.raw for column names (safe: no user input)
  const sortMap: Record<string, string> = {
    name: "m.name",
    joinDate: "m.join_date",
    createdAt: "m.created_at",
  };
  const sortCol = sql.raw(sortMap[sortBy] ?? "m.created_at");
  const orderDir = sql.raw(sortOrder === "asc" ? "ASC" : "DESC");
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    db.execute(sql`
      SELECT
        m.id,
        m.name,
        m.phone,
        m.email,
        m.gender,
        m.join_date   AS "joinDate",
        m.photo_url   AS "photoUrl",
        m.created_at  AS "createdAt",
        COALESCE(lm.ms_status::text, m.status::text) AS status,
        lm.ms_plan_name   AS "latestPlanName",
        lm.ms_start_date  AS "latestStartDate",
        lm.ms_end_date    AS "latestEndDate",
        lm.ms_status      AS "latestMsStatus"
      FROM members m
      LEFT JOIN LATERAL (
        SELECT
          mm.status     AS ms_status,
          mm.start_date AS ms_start_date,
          mm.end_date   AS ms_end_date,
          mp.name       AS ms_plan_name
        FROM member_memberships mm
        JOIN membership_plans mp ON mp.id = mm.plan_id
        WHERE mm.member_id = m.id
        ORDER BY mm.end_date DESC, mm.created_at DESC
        LIMIT 1
      ) lm ON true
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${orderDir}
      LIMIT ${limit} OFFSET ${offset}
    `),
    db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM members m
      LEFT JOIN LATERAL (
        SELECT mm.status AS ms_status
        FROM member_memberships mm
        WHERE mm.member_id = m.id
        ORDER BY mm.end_date DESC, mm.created_at DESC
        LIMIT 1
      ) lm ON true
      WHERE ${whereClause}
    `),
  ]);

  // neon-http returns array directly; some drizzle versions wrap in { rows }
  const data = ((dataResult as any).rows ?? dataResult) as any[];
  const totalRows = ((countResult as any).rows ?? countResult) as any[];
  const total: number = totalRows[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Shape items to include latestMembership nested object
  const items = data.map((row: any) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    gender: row.gender,
    joinDate: row.joinDate,
    status: row.status,
    photoUrl: row.photoUrl,
    createdAt: row.createdAt,
    latestMembership: row.latestPlanName
      ? {
          planName: row.latestPlanName,
          startDate: row.latestStartDate,
          endDate: row.latestEndDate,
          status: row.latestMsStatus,
        }
      : null,
  }));

  return {
    items,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

// ─── Notes ──────────────────────────────────────────────────────

export async function addNote(
  ctx: ServiceContext,
  memberId: string,
  input: CreateMemberNoteInput
) {
  const { db, gymId, userId } = ctx;

  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.gymId, gymId)))
    .limit(1);

  if (!member) {
    throw AppError.notFound("Member");
  }

  const [note] = await db
    .insert(memberNotes)
    .values({
      memberId,
      gymId,
      content: input.content,
      createdBy: userId,
    })
    .returning();

  return note!;
}

export async function listNotes(ctx: ServiceContext, memberId: string) {
  const { db, gymId } = ctx;

  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.gymId, gymId)))
    .limit(1);

  if (!member) {
    throw AppError.notFound("Member");
  }

  const notes = await db
    .select({
      id: memberNotes.id,
      content: memberNotes.content,
      createdAt: memberNotes.createdAt,
      createdByName: users.name,
    })
    .from(memberNotes)
    .leftJoin(users, eq(memberNotes.createdBy, users.id))
    .where(and(eq(memberNotes.memberId, memberId), eq(memberNotes.gymId, gymId)))
    .orderBy(desc(memberNotes.createdAt));

  return notes;
}

export async function deleteNote(
  ctx: ServiceContext,
  memberId: string,
  noteId: string
) {
  const { db, gymId, userId } = ctx;

  const [note] = await db
    .select()
    .from(memberNotes)
    .where(
      and(
        eq(memberNotes.id, noteId),
        eq(memberNotes.memberId, memberId),
        eq(memberNotes.gymId, gymId)
      )
    )
    .limit(1);

  if (!note) {
    throw AppError.notFound("Note");
  }

  await db
    .delete(memberNotes)
    .where(eq(memberNotes.id, noteId));

  await createAuditLog(db, {
    gymId,
    userId,
    action: "member_updated",
    entityType: "member_note",
    entityId: noteId,
    oldValues: { content: note.content, memberId: note.memberId },
    newValues: null,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

// ─── Batch Delete Members ──────────────────────────────────────

export async function batchDeleteMembers(
  ctx: ServiceContext,
  memberIds: string[]
) {
  const { db, gymId, userId } = ctx;

  if (memberIds.length === 0) return { deleted: 0 };
  if (memberIds.length > 50) {
    throw AppError.badRequest("Cannot delete more than 50 members at once");
  }

  // Verify all members belong to this gym
  const existing = await db
    .select({ id: members.id, name: members.name })
    .from(members)
    .where(and(eq(members.gymId, gymId), inArray(members.id, memberIds)));

  if (existing.length !== memberIds.length) {
    throw AppError.badRequest(
      `Some member IDs are invalid or don't belong to this gym`
    );
  }

  // Get membership IDs for these members (needed to delete freezes)
  const membershipRows = await db
    .select({ id: memberMemberships.id })
    .from(memberMemberships)
    .where(inArray(memberMemberships.memberId, memberIds));
  const membershipIds = membershipRows.map((r) => r.id);

  // Delete in FK-safe order: freezes → payments → memberships → notes → members
  if (membershipIds.length > 0) {
    await db
      .delete(membershipFreezes)
      .where(inArray(membershipFreezes.membershipId, membershipIds));
  }

  await db
    .delete(payments)
    .where(inArray(payments.memberId, memberIds));

  if (membershipIds.length > 0) {
    await db
      .delete(memberMemberships)
      .where(inArray(memberMemberships.id, membershipIds));
  }

  await db
    .delete(memberNotes)
    .where(inArray(memberNotes.memberId, memberIds));

  await db
    .delete(members)
    .where(inArray(members.id, memberIds));

  // Audit each deletion
  for (const m of existing) {
    await createAuditLog(db, {
      gymId,
      userId,
      action: "member_deleted",
      entityType: "member",
      entityId: m.id,
      oldValues: { name: m.name },
      newValues: null,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  return { deleted: existing.length };
}
