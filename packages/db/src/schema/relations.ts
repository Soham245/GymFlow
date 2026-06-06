import { relations } from "drizzle-orm";
import { gyms } from "./gyms.js";
import { users, refreshTokens } from "./users.js";
import { members, memberNotes } from "./members.js";
import {
  membershipPlans,
  memberMemberships,
  membershipFreezes,
} from "./memberships.js";
import { payments } from "./payments.js";
import { expenseCategories, expenses } from "./expenses.js";
import { auditLogs } from "./audit.js";
import { notificationsLog } from "./notifications.js";
import {
  messageTemplates,
  scheduledMessages,
  messageLog,
} from "./messaging.js";

// ─── Gym Relations ──────────────────────────────────────────────
export const gymsRelations = relations(gyms, ({ many }) => ({
  users: many(users),
  members: many(members),
  membershipPlans: many(membershipPlans),
  memberMemberships: many(memberMemberships),
  payments: many(payments),
  expenseCategories: many(expenseCategories),
  expenses: many(expenses),
  auditLogs: many(auditLogs),
  notificationsLog: many(notificationsLog),
  messageTemplates: many(messageTemplates),
  scheduledMessages: many(scheduledMessages),
  messageLog: many(messageLog),
}));

// ─── User Relations ─────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  gym: one(gyms, { fields: [users.gymId], references: [gyms.id] }),
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

// ─── Member Relations ───────────────────────────────────────────
export const membersRelations = relations(members, ({ one, many }) => ({
  gym: one(gyms, { fields: [members.gymId], references: [gyms.id] }),
  createdByUser: one(users, {
    fields: [members.createdBy],
    references: [users.id],
  }),
  memberships: many(memberMemberships),
  payments: many(payments),
  notes: many(memberNotes),
  notifications: many(notificationsLog),
}));

export const memberNotesRelations = relations(memberNotes, ({ one }) => ({
  member: one(members, {
    fields: [memberNotes.memberId],
    references: [members.id],
  }),
  gym: one(gyms, { fields: [memberNotes.gymId], references: [gyms.id] }),
  createdByUser: one(users, {
    fields: [memberNotes.createdBy],
    references: [users.id],
  }),
}));

// ─── Membership Plan Relations ──────────────────────────────────
export const membershipPlansRelations = relations(
  membershipPlans,
  ({ one, many }) => ({
    gym: one(gyms, {
      fields: [membershipPlans.gymId],
      references: [gyms.id],
    }),
    memberships: many(memberMemberships),
  })
);

// ─── Member Membership Relations ────────────────────────────────
export const memberMembershipsRelations = relations(
  memberMemberships,
  ({ one, many }) => ({
    member: one(members, {
      fields: [memberMemberships.memberId],
      references: [members.id],
    }),
    gym: one(gyms, {
      fields: [memberMemberships.gymId],
      references: [gyms.id],
    }),
    plan: one(membershipPlans, {
      fields: [memberMemberships.planId],
      references: [membershipPlans.id],
    }),
    createdByUser: one(users, {
      fields: [memberMemberships.createdBy],
      references: [users.id],
    }),
    payments: many(payments),
    freezes: many(membershipFreezes),
  })
);

// ─── Membership Freeze Relations ────────────────────────────────
export const membershipFreezesRelations = relations(
  membershipFreezes,
  ({ one }) => ({
    membership: one(memberMemberships, {
      fields: [membershipFreezes.membershipId],
      references: [memberMemberships.id],
    }),
    gym: one(gyms, {
      fields: [membershipFreezes.gymId],
      references: [gyms.id],
    }),
    createdByUser: one(users, {
      fields: [membershipFreezes.createdBy],
      references: [users.id],
    }),
  })
);

// ─── Payment Relations ──────────────────────────────────────────
export const paymentsRelations = relations(payments, ({ one }) => ({
  gym: one(gyms, { fields: [payments.gymId], references: [gyms.id] }),
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
  membership: one(memberMemberships, {
    fields: [payments.membershipId],
    references: [memberMemberships.id],
  }),
  createdByUser: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

// ─── Expense Relations ──────────────────────────────────────────
export const expenseCategoriesRelations = relations(
  expenseCategories,
  ({ one, many }) => ({
    gym: one(gyms, {
      fields: [expenseCategories.gymId],
      references: [gyms.id],
    }),
    expenses: many(expenses),
  })
);

export const expensesRelations = relations(expenses, ({ one }) => ({
  gym: one(gyms, { fields: [expenses.gymId], references: [gyms.id] }),
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  createdByUser: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
}));

// ─── Audit Log Relations ────────────────────────────────────────
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  gym: one(gyms, { fields: [auditLogs.gymId], references: [gyms.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// ─── Notification Log Relations ─────────────────────────────────
export const notificationsLogRelations = relations(
  notificationsLog,
  ({ one }) => ({
    gym: one(gyms, {
      fields: [notificationsLog.gymId],
      references: [gyms.id],
    }),
    member: one(members, {
      fields: [notificationsLog.memberId],
      references: [members.id],
    }),
  })
);

// ─── Message Template Relations ────────────────────────────────
export const messageTemplatesRelations = relations(
  messageTemplates,
  ({ one, many }) => ({
    gym: one(gyms, {
      fields: [messageTemplates.gymId],
      references: [gyms.id],
    }),
    createdByUser: one(users, {
      fields: [messageTemplates.createdBy],
      references: [users.id],
    }),
    scheduledMessages: many(scheduledMessages),
    messageLog: many(messageLog),
  })
);

// ─── Scheduled Message Relations ───────────────────────────────
export const scheduledMessagesRelations = relations(
  scheduledMessages,
  ({ one, many }) => ({
    gym: one(gyms, {
      fields: [scheduledMessages.gymId],
      references: [gyms.id],
    }),
    template: one(messageTemplates, {
      fields: [scheduledMessages.templateId],
      references: [messageTemplates.id],
    }),
    createdByUser: one(users, {
      fields: [scheduledMessages.createdBy],
      references: [users.id],
    }),
    messageLog: many(messageLog),
  })
);

// ─── Message Log Relations ─────────────────────────────────────
export const messageLogRelations = relations(messageLog, ({ one }) => ({
  gym: one(gyms, {
    fields: [messageLog.gymId],
    references: [gyms.id],
  }),
  member: one(members, {
    fields: [messageLog.memberId],
    references: [members.id],
  }),
  template: one(messageTemplates, {
    fields: [messageLog.templateId],
    references: [messageTemplates.id],
  }),
  scheduledMessage: one(scheduledMessages, {
    fields: [messageLog.scheduledMessageId],
    references: [scheduledMessages.id],
  }),
}));
