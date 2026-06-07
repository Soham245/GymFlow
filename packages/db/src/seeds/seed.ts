import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "../schema/index.js";
import { hash } from "./hash-helper.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

export async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("Seeding database (non-destructive)...\n");

  // ─── 0. Check if data already exists ────────────────────────
  const existingGyms = await db.select().from(schema.gyms).limit(1);
  if (existingGyms.length > 0) {
    console.log("Database already has data — skipping seed.");
    console.log("Use `pnpm db:reset` to truncate and reseed (development only).\n");
    return;
  }

  // ─── 1. Gym ─────────────────────────────────────────────────
  const [gym] = await db
    .insert(schema.gyms)
    .values({
      name: "Iron Paradise Gym",
      slug: "iron-paradise",
      address: "123 MG Road, Sector 15",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700001",
      phone: "+919876543210",
      email: "owner@ironparadise.in",
      timezone: "Asia/Kolkata",
      currency: "INR",
      settings: {
        renewalReminderDays: 7,
        allowPartialPayments: true,
        defaultPaymentMethod: "cash",
      },
    })
    .returning();
  console.log(`Created gym: ${gym!.name}`);

  // ─── 2. Owner User ──────────────────────────────────────────
  const passwordHash = await hash("Admin@123");
  const [owner] = await db
    .insert(schema.users)
    .values({
      gymId: gym!.id,
      email: "owner@ironparadise.in",
      passwordHash,
      name: "Rahul Sharma",
      phone: "+919876543210",
      role: "owner",
    })
    .returning();
  console.log(`Created owner: ${owner!.name}`);

  // ─── 3. Receptionist ────────────────────────────────────────
  const [receptionist] = await db
    .insert(schema.users)
    .values({
      gymId: gym!.id,
      email: "reception@ironparadise.in",
      passwordHash: await hash("Reception@123"),
      name: "Priya Das",
      phone: "+919876543211",
      role: "receptionist",
    })
    .returning();
  console.log(`Created receptionist: ${receptionist!.name}`);

  // ─── 4. Membership Plans (ordered by duration) ──────────────
  const plans = await db
    .insert(schema.membershipPlans)
    .values([
      { gymId: gym!.id, name: "Monthly", durationDays: 30, price: "1500.00", sortOrder: 1 },
      { gymId: gym!.id, name: "Quarterly", durationDays: 90, price: "4000.00", sortOrder: 2 },
      { gymId: gym!.id, name: "Half-Yearly", durationDays: 180, price: "7000.00", sortOrder: 3 },
      { gymId: gym!.id, name: "Annual", durationDays: 365, price: "12000.00", sortOrder: 4 },
    ])
    .returning();
  console.log(`Created ${plans.length} membership plans`);

  // ─── 5. Expense Categories ──────────────────────────────────
  const defaultCategories = [
    "Rent", "Electricity", "Water", "Salaries", "Equipment",
    "Maintenance", "Marketing", "Supplements", "Cleaning",
    "Insurance", "Miscellaneous",
  ];
  const categories = await db
    .insert(schema.expenseCategories)
    .values(defaultCategories.map((name) => ({ gymId: gym!.id, name })))
    .returning();
  console.log(`Created ${categories.length} expense categories`);

  // ─── 6. Sample Members ──────────────────────────────────────
  const memberData = [
    { name: "Amit Roy", phone: "+919800001001", gender: "male" as const, joinDate: "2025-01-10" },
    { name: "Sneha Banerjee", phone: "+919800001002", gender: "female" as const, joinDate: "2025-02-15" },
    { name: "Rajesh Kumar", phone: "+919800001003", gender: "male" as const, joinDate: "2025-03-01" },
    { name: "Pooja Ghosh", phone: "+919800001004", gender: "female" as const, joinDate: "2025-04-05" },
    { name: "Vikram Singh", phone: "+919800001005", gender: "male" as const, joinDate: "2025-05-20" },
  ];

  const members = await db
    .insert(schema.members)
    .values(
      memberData.map((m) => ({
        gymId: gym!.id,
        name: m.name,
        phone: m.phone,
        gender: m.gender,
        joinDate: m.joinDate,
        status: "active" as const,
        createdBy: owner!.id,
      }))
    )
    .returning();
  console.log(`Created ${members.length} members`);

  // ─── 7. Sample Memberships ──────────────────────────────────
  const monthlyPlan = plans.find((p) => p.name === "Monthly")!;
  const quarterlyPlan = plans.find((p) => p.name === "Quarterly")!;

  const memberships = await db
    .insert(schema.memberMemberships)
    .values([
      {
        memberId: members[0]!.id,
        gymId: gym!.id,
        planId: quarterlyPlan.id,
        startDate: "2025-05-01",
        endDate: "2025-07-30",
        status: "active" as const,
        totalAmount: "4000.00",
        discountAmount: "500.00",
        paidAmount: "3500.00",
        createdBy: owner!.id,
      },
      {
        memberId: members[1]!.id,
        gymId: gym!.id,
        planId: monthlyPlan.id,
        startDate: "2025-05-15",
        endDate: "2025-06-14",
        status: "active" as const,
        totalAmount: "1500.00",
        paidAmount: "1500.00",
        createdBy: receptionist!.id,
      },
      {
        memberId: members[2]!.id,
        gymId: gym!.id,
        planId: monthlyPlan.id,
        startDate: "2025-05-01",
        endDate: "2025-05-31",
        status: "expired" as const,
        totalAmount: "1500.00",
        paidAmount: "1000.00",
        notes: "Partial payment — owes 500",
        createdBy: receptionist!.id,
      },
    ])
    .returning();
  console.log(`Created ${memberships.length} memberships`);

  // ─── 8. Sample Payments ─────────────────────────────────────
  const paymentRows = await db
    .insert(schema.payments)
    .values([
      {
        gymId: gym!.id,
        memberId: members[0]!.id,
        membershipId: memberships[0]!.id,
        receiptNumber: "IRON-PARADISE-000001",
        amount: "3500.00",
        paymentMethod: "upi" as const,
        paymentStatus: "paid" as const,
        paymentDate: "2025-05-01",
        createdBy: owner!.id,
      },
      {
        gymId: gym!.id,
        memberId: members[1]!.id,
        membershipId: memberships[1]!.id,
        receiptNumber: "IRON-PARADISE-000002",
        amount: "1500.00",
        paymentMethod: "cash" as const,
        paymentStatus: "paid" as const,
        paymentDate: "2025-05-15",
        createdBy: receptionist!.id,
      },
      {
        gymId: gym!.id,
        memberId: members[2]!.id,
        membershipId: memberships[2]!.id,
        receiptNumber: "IRON-PARADISE-000003",
        amount: "1000.00",
        paymentMethod: "cash" as const,
        paymentStatus: "partial" as const,
        paymentDate: "2025-05-01",
        notes: "Will pay remaining 500 next week",
        createdBy: receptionist!.id,
      },
    ])
    .returning();
  console.log(`Created ${paymentRows.length} payments`);

  // ─── 9. Sample Expenses ─────────────────────────────────────
  const rentCategory = categories.find((c) => c.name === "Rent")!;
  const electricityCategory = categories.find((c) => c.name === "Electricity")!;

  const expenseRows = await db
    .insert(schema.expenses)
    .values([
      {
        gymId: gym!.id,
        categoryId: rentCategory.id,
        amount: "25000.00",
        description: "May 2025 rent",
        expenseDate: "2025-05-01",
        paymentMethod: "bank_transfer" as const,
        createdBy: owner!.id,
      },
      {
        gymId: gym!.id,
        categoryId: electricityCategory.id,
        amount: "4500.00",
        description: "May 2025 electricity bill",
        expenseDate: "2025-05-10",
        paymentMethod: "upi" as const,
        createdBy: owner!.id,
      },
    ])
    .returning();
  console.log(`Created ${expenseRows.length} expenses`);

  // ─── 10. Sample Member Notes ────────────────────────────────
  await db.insert(schema.memberNotes).values([
    {
      memberId: members[0]!.id,
      gymId: gym!.id,
      content: "Interested in personal training sessions",
      createdBy: receptionist!.id,
    },
    {
      memberId: members[2]!.id,
      gymId: gym!.id,
      content: "Promised to clear pending 500 by next Monday",
      createdBy: receptionist!.id,
    },
  ]);
  console.log("Created 2 member notes");

  console.log("\nSeed complete!");
}

// Run directly when executed as a script (not when imported by reset.ts)
const isDirectRun = process.argv[1]?.includes("seed") && !process.argv[1]?.includes("reset");
if (isDirectRun) {
  seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
