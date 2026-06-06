import {
  eq,
  and,
  or,
  ilike,
  gte,
  lte,
  asc,
  desc,
  count,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { members, memberNotes, users } from "@gymflow/db";
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

const sortColumns = {
  name: members.name,
  joinDate: members.joinDate,
  createdAt: members.createdAt,
} as const;

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

  const conditions: SQL[] = [eq(members.gymId, gymId)];

  if (status) {
    conditions.push(eq(members.status, status));
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(ilike(members.name, pattern), ilike(members.phone, pattern))!
    );
  }

  if (joinDateFrom) {
    conditions.push(gte(members.joinDate, joinDateFrom));
  }
  if (joinDateTo) {
    conditions.push(lte(members.joinDate, joinDateTo));
  }

  const where = and(...conditions)!;
  const sortCol = sortColumns[sortBy];
  const orderFn = sortOrder === "asc" ? asc : desc;
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: members.id,
        name: members.name,
        phone: members.phone,
        email: members.email,
        gender: members.gender,
        joinDate: members.joinDate,
        status: members.status,
        photoUrl: members.photoUrl,
        createdAt: members.createdAt,
      })
      .from(members)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(members)
      .where(where),
  ]);

  const total = totalResult[0]!.total;
  const totalPages = Math.ceil(total / limit);

  return {
    items: data,
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
