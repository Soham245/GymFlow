/**
 * demo-seed.ts — GymFlow realistic demo dataset
 *
 * ~100 members, 6 months of gym operations with realistic Indian gym economics.
 * Plans: Monthly ₹800, Quarterly ₹2,000, Half-Yearly ₹4,000, Annual ₹8,000
 * Run via: pnpm --filter @gymflow/db demo
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "../schema/index.js";
import { hash } from "./hash-helper.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function date(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addDays(d: string, n: number): string {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0]!;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function money(n: number): string {
  return n.toFixed(2);
}

function ts(d: string): Date {
  return new Date(d + "T10:00:00+05:30");
}

// ═══════════════════════════════════════════════════════════════
// Data Constants
// ═══════════════════════════════════════════════════════════════

const MALE_NAMES = [
  "Aarav Sharma", "Vivaan Patel", "Aditya Gupta", "Arjun Das", "Sai Reddy",
  "Rohan Mehta", "Kartik Nair", "Ishaan Roy", "Dhruv Joshi", "Kabir Singh",
  "Arnav Iyer", "Reyansh Rao", "Vihaan Pillai", "Atharv Mishra", "Krishna Bhatt",
  "Ayaan Khanna", "Parth Deshmukh", "Manav Saxena", "Anirudh Kulkarni", "Rudra Verma",
  "Yash Malhotra", "Dev Chauhan", "Harsh Tiwari", "Rahul Pandey", "Amit Sen",
  "Nikhil Banerjee", "Sumit Mukherjee", "Vikram Chatterjee", "Rishi Bose", "Pranav Dutta",
  "Karan Sinha", "Siddharth Ghosh", "Ankit Sarkar", "Raj Mohan", "Suresh Yadav",
  "Tanmay Kapur", "Gaurav Thakur", "Sahil Bajaj", "Deepak Rathore", "Tushar Aggarwal",
  "Mayank Dubey", "Shivam Choudhary", "Kunal Mehra", "Varun Kapoor", "Akash Dixit",
  "Piyush Mahajan", "Abhishek Sethi", "Rajat Bhatia", "Tarun Grover", "Mohit Tandon",
  "Vishal Arora", "Naveen Khatri", "Ritesh Purohit", "Ajay Goswami", "Prateek Jain",
  "Sourav Halder", "Debashis Mondal", "Sandip Dey", "Biplab Kar", "Tapan Mitra",
  "Subhajit Pal", "Arka Bhowmick", "Joydip Saha", "Prosenjit Dhar", "Animesh Ganguly",
];

const FEMALE_NAMES = [
  "Ananya Sharma", "Aarohi Patel", "Diya Gupta", "Priya Das", "Kiara Reddy",
  "Sara Mehta", "Ishita Nair", "Myra Roy", "Riya Joshi", "Anika Singh",
  "Kavya Iyer", "Tara Rao", "Nisha Pillai", "Pooja Mishra", "Shruti Bhatt",
  "Meera Khanna", "Neha Deshmukh", "Sneha Saxena", "Divya Kulkarni", "Swati Verma",
  "Priyanka Basu", "Tanisha Agarwal", "Ritika Chopra", "Manaswi Srivastava", "Aditi Menon",
  "Pallavi Shetty", "Simran Kaur", "Anjali Tiwari", "Deepika Rajan", "Shalini Prasad",
  "Moumita Sen", "Sayantani Ghosh", "Arpita Chakraborty", "Sucharita Banerjee", "Debasmita Roy",
];

const NOTE_TEMPLATES = [
  "Has a lower back issue — avoid heavy deadlifts. Doctor's note on file.",
  "Interested in personal training sessions. Follow up next visit.",
  "Wants to switch to a quarterly plan on next renewal.",
  "Works night shifts — prefers early morning slots (5-7 AM).",
  "Preparing for a marathon. Needs cardio-focused routine.",
  "Has knee surgery recovery. Physiotherapist recommended light workouts only.",
  "Referred 2 new members last month. Consider loyalty discount.",
  "Requested locker facility. Added to waitlist.",
  "Missed last 2 weeks. Call to check in and re-engage.",
  "Diabetic — always carries glucose tablets. Staff should be aware.",
  "College student — asked about student discount for annual plan.",
  "Called about freezing membership due to work travel next month.",
  "Payment discussion — agreed to clear outstanding by month end.",
  "Wants to join yoga batch starting next month.",
  "Complained about AC not working in evening — maintenance notified.",
  "Birthday on 15th — send greeting and offer renewal discount.",
  "Bringing spouse for trial next week. Potential new member.",
  "Very regular — hasn't missed a day in 3 months. Potential brand ambassador.",
  "Asked about supplement recommendations. Referred to trainer.",
  "Freeze request approved — travelling abroad for 3 weeks.",
  "Renewed after 1-month gap. Offered 10% comeback discount.",
  "Senior member — needs assistance with equipment. Staff briefed.",
  "Competitive bodybuilder — needs access to heavy weights section.",
  "Requested diet plan. Scheduled consultation with nutritionist.",
  "Payment bounced — follow up on next visit.",
  "Morning batch regular. Helped organize member cricket match.",
  "Ankle sprain last week — resting for 10 days. Monitor return.",
  "Group fitness enthusiast — always joins Zumba and HIIT classes.",
  "Asked about bringing 10-year-old son. Explained age policy.",
  "Corporate member from TCS batch. Invoice to be sent to HR.",
];

const FREEZE_REASONS = [
  "Travelling abroad for family wedding",
  "Work relocation for 3 weeks — Bangalore project",
  "Knee injury — doctor advised rest for 2 weeks",
  "University semester exams preparation",
  "Post-surgery recovery — appendix operation",
  "Extended business trip to Mumbai",
  "Monsoon flooding — unable to commute",
  "Family emergency — visiting hometown",
  "COVID recovery — self-isolation period",
  "Shifting to new apartment — will resume after settling",
];

// ═══════════════════════════════════════════════════════════════
// Main Seed Function
// ═══════════════════════════════════════════════════════════════

async function demoSeed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  GymFlow Demo Dataset Generator                     ║");
  console.log("║  ~100 members · 6 months · realistic gym economics  ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // ─── Step 0: Clean all operational data ─────────────────────
  console.log("Step 0: Cleaning existing data...");
  await sql(
    "TRUNCATE TABLE audit_logs, message_log, scheduled_messages, message_templates, notifications_log, member_notes, membership_freezes, payments, member_memberships, expenses, expense_categories, membership_plans, members, refresh_tokens, users, gyms CASCADE"
  );
  console.log("  All tables cleared.\n");

  // ─── Step 1: Gym ───────────────────────────────────────────
  console.log("Step 1: Creating gym...");
  const [gym] = await db
    .insert(schema.gyms)
    .values({
      name: "Iron Paradise Gym",
      slug: "iron-paradise",
      address: "42/A Park Street, Near Metro Station",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700016",
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
  const gymId = gym!.id;
  console.log(`  Created: ${gym!.name}\n`);

  // ─── Step 2: Users ─────────────────────────────────────────
  console.log("Step 2: Creating users...");
  const passwordHash = await hash("Admin@123");
  const [owner] = await db
    .insert(schema.users)
    .values({
      gymId,
      email: "owner@ironparadise.in",
      passwordHash,
      name: "Rahul Sharma",
      phone: "+919876543210",
      role: "owner",
    })
    .returning();
  const ownerId = owner!.id;

  const [receptionist] = await db
    .insert(schema.users)
    .values({
      gymId,
      email: "reception@ironparadise.in",
      passwordHash: await hash("Reception@123"),
      name: "Priya Das",
      phone: "+919876543211",
      role: "receptionist",
    })
    .returning();
  const receptionistId = receptionist!.id;
  console.log(`  Owner: ${owner!.name}`);
  console.log(`  Receptionist: ${receptionist!.name}\n`);

  // ─── Step 3: Membership Plans ──────────────────────────────
  console.log("Step 3: Creating membership plans...");
  const planRows = await db
    .insert(schema.membershipPlans)
    .values([
      { gymId, name: "Monthly", durationDays: 30, price: "800.00", sortOrder: 1 },
      { gymId, name: "Quarterly", durationDays: 90, price: "2000.00", sortOrder: 2 },
      { gymId, name: "Half-Yearly", durationDays: 180, price: "4000.00", sortOrder: 3 },
      { gymId, name: "Annual", durationDays: 365, price: "8000.00", sortOrder: 4 },
    ])
    .returning();
  const plans: Record<string, typeof planRows[0]> = {};
  for (const p of planRows) plans[p.name] = p;
  console.log(`  Created ${planRows.length} plans\n`);

  // ─── Step 4: Expense Categories ────────────────────────────
  console.log("Step 4: Creating expense categories...");
  const catNames = [
    "Rent", "Electricity", "Internet", "Water", "Equipment Maintenance",
    "Cleaning", "Staff Salary", "Marketing", "Supplements", "Insurance", "Miscellaneous",
  ];
  const catRows = await db
    .insert(schema.expenseCategories)
    .values(catNames.map((name) => ({ gymId, name })))
    .returning();
  const cats: Record<string, typeof catRows[0]> = {};
  for (const c of catRows) cats[c.name] = c;
  console.log(`  Created ${catRows.length} categories\n`);

  // ─── Step 5: Generate ~100 Members ─────────────────────────
  console.log("Step 5: Creating members...");

  const TODAY = "2026-06-12";

  interface MemberSpec {
    name: string;
    phone: string;
    gender: "male" | "female";
    joinDate: string;
    status: "active" | "expired" | "frozen" | "inactive";
    dateOfBirth?: string;
    email?: string;
  }

  const memberSpecs: MemberSpec[] = [];
  let phoneCounter = 9800010001;
  let maleIdx = 0;
  let femaleIdx = 0;

  function nextName(isFemale: boolean): string {
    if (isFemale) {
      return FEMALE_NAMES[femaleIdx++ % FEMALE_NAMES.length]!;
    }
    return MALE_NAMES[maleIdx++ % MALE_NAMES.length]!;
  }

  // 60 Active members — joined 1-6 months ago (established base)
  for (let i = 0; i < 60; i++) {
    const isFemale = i % 3 === 0;
    const monthsAgo = randomInt(1, 5);
    const dayOfMonth = randomInt(1, 28);
    const joinMonth = 6 - monthsAgo;
    const joinYear = joinMonth <= 0 ? 2025 : 2026;
    const adjustedMonth = joinMonth <= 0 ? joinMonth + 12 : joinMonth;
    memberSpecs.push({
      name: nextName(isFemale),
      phone: `+91${phoneCounter++}`,
      gender: isFemale ? "female" : "male",
      joinDate: date(joinYear, adjustedMonth, dayOfMonth),
      status: "active",
      dateOfBirth: date(randomInt(1985, 2004), randomInt(1, 12), randomInt(1, 28)),
    });
  }

  // 18 Active members — joined in last 30 days (recent growth)
  for (let i = 0; i < 18; i++) {
    const isFemale = i % 3 === 0;
    const daysAgo = randomInt(1, 30);
    memberSpecs.push({
      name: nextName(isFemale),
      phone: `+91${phoneCounter++}`,
      gender: isFemale ? "female" : "male",
      joinDate: addDays(TODAY, -daysAgo),
      status: "active",
      dateOfBirth: date(randomInt(1990, 2005), randomInt(1, 12), randomInt(1, 28)),
    });
  }

  // 7 Active members — joined this week (brand new)
  for (let i = 0; i < 7; i++) {
    const isFemale = i % 4 === 0;
    const daysAgo = randomInt(0, 6);
    memberSpecs.push({
      name: nextName(isFemale),
      phone: `+91${phoneCounter++}`,
      gender: isFemale ? "female" : "male",
      joinDate: addDays(TODAY, -daysAgo),
      status: "active",
      dateOfBirth: date(randomInt(1992, 2006), randomInt(1, 12), randomInt(1, 28)),
    });
  }

  // 5 Frozen members — joined 2-4 months ago
  for (let i = 0; i < 5; i++) {
    const isFemale = i % 2 === 0;
    memberSpecs.push({
      name: nextName(isFemale),
      phone: `+91${phoneCounter++}`,
      gender: isFemale ? "female" : "male",
      joinDate: date(2026, randomInt(2, 4), randomInt(1, 28)),
      status: "frozen",
      dateOfBirth: date(randomInt(1988, 2001), randomInt(1, 12), randomInt(1, 28)),
    });
  }

  // 12 Expired members — joined 3-6 months ago, churned
  for (let i = 0; i < 12; i++) {
    const isFemale = i % 4 === 0;
    const monthsAgo = randomInt(3, 6);
    const joinMonth = 6 - monthsAgo;
    const joinYear = joinMonth <= 0 ? 2025 : 2026;
    const adjustedMonth = joinMonth <= 0 ? joinMonth + 12 : joinMonth;
    memberSpecs.push({
      name: nextName(isFemale),
      phone: `+91${phoneCounter++}`,
      gender: isFemale ? "female" : "male",
      joinDate: date(joinYear, adjustedMonth, randomInt(1, 28)),
      status: "expired",
      dateOfBirth: date(randomInt(1980, 2002), randomInt(1, 12), randomInt(1, 28)),
    });
  }

  const memberRows = await db
    .insert(schema.members)
    .values(
      memberSpecs.map((m) => ({
        gymId,
        name: m.name,
        phone: m.phone,
        gender: m.gender,
        joinDate: m.joinDate,
        status: m.status,
        dateOfBirth: m.dateOfBirth,
        createdBy: Math.random() > 0.3 ? ownerId : receptionistId,
        createdAt: ts(m.joinDate),
        updatedAt: ts(m.joinDate),
      }))
    )
    .returning();
  console.log(`  Created ${memberRows.length} members (${memberSpecs.filter(m => m.status === "active").length} active, ${memberSpecs.filter(m => m.status === "frozen").length} frozen, ${memberSpecs.filter(m => m.status === "expired").length} expired)\n`);

  // ─── Step 6: Memberships ───────────────────────────────────
  console.log("Step 6: Creating memberships...");

  interface MembershipSpec {
    memberId: string;
    planName: string;
    startDate: string;
    endDate: string;
    status: "active" | "expired" | "cancelled" | "frozen";
    totalAmount: number;
    discountAmount: number;
    paidAmount: number;
    notes?: string;
    createdAt: string;
  }

  const membershipSpecs: MembershipSpec[] = [];

  const PLAN_DURATIONS: Record<string, number> = {
    Monthly: 30, Quarterly: 90, "Half-Yearly": 180, Annual: 365,
  };
  const PLAN_PRICES: Record<string, number> = {
    Monthly: 800, Quarterly: 2000, "Half-Yearly": 4000, Annual: 8000,
  };

  const PLAN_NAMES = ["Monthly", "Quarterly", "Half-Yearly", "Annual"] as const;
  const PLAN_WEIGHTS = [40, 28, 18, 14];

  const PAY_METHODS: Array<"cash" | "upi" | "card" | "bank_transfer"> = ["upi", "cash", "bank_transfer", "card"];
  const PAY_WEIGHTS = [44, 28, 18, 10];

  function pickPlan(): string {
    return weightedPick([...PLAN_NAMES], PLAN_WEIGHTS);
  }

  function pickPayMethod(): "cash" | "upi" | "card" | "bank_transfer" {
    return weightedPick(PAY_METHODS, PAY_WEIGHTS);
  }

  let outstandingCount = 0;
  const MAX_OUTSTANDING = 8;

  function shouldBePartiallyPaid(): boolean {
    if (outstandingCount >= MAX_OUTSTANDING) return false;
    if (Math.random() < 0.12) {
      outstandingCount++;
      return true;
    }
    return false;
  }

  function createMonthlyChain(memberId: string, startDate: string, count: number, lastIsActive: boolean) {
    let cursor = startDate;
    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const endDate = addDays(cursor, 30);
      const price = 800;
      const discount = (i > 0 && Math.random() < 0.1) ? 50 : 0;
      const net = price - discount;
      const isPartial = isLast && lastIsActive && shouldBePartiallyPaid();
      const paid = isPartial ? Math.round(net * 0.5) : net;
      membershipSpecs.push({
        memberId,
        planName: "Monthly",
        startDate: cursor,
        endDate,
        status: isLast && lastIsActive ? "active" : "expired",
        totalAmount: price,
        discountAmount: discount,
        paidAmount: paid,
        notes: discount > 0 ? "Loyalty renewal discount" : isPartial ? "Will pay balance next visit" : undefined,
        createdAt: cursor,
      });
      cursor = addDays(endDate, randomInt(0, 2));
    }
  }

  for (let mi = 0; mi < memberRows.length; mi++) {
    const member = memberRows[mi]!;
    const spec = memberSpecs[mi]!;
    const memberJoin = member.joinDate;

    if (spec.status === "active" && mi < 60) {
      if (mi < 15) {
        const chainLen = randomInt(2, 5);
        createMonthlyChain(member.id, memberJoin, chainLen, true);
      } else if (mi < 28) {
        const priorPlan = randomPick(["Monthly", "Monthly", "Quarterly"]);
        const priorDur = PLAN_DURATIONS[priorPlan]!;
        const priorStart = memberJoin;
        const priorEnd = addDays(priorStart, priorDur);
        const priorPrice = PLAN_PRICES[priorPlan]!;
        membershipSpecs.push({
          memberId: member.id,
          planName: priorPlan,
          startDate: priorStart,
          endDate: priorEnd,
          status: "expired",
          totalAmount: priorPrice,
          discountAmount: 0,
          paidAmount: priorPrice,
          createdAt: priorStart,
        });

        const upgradePlans = ["Quarterly", "Half-Yearly", "Annual"];
        const currentPlan = randomPick(upgradePlans);
        const currentDur = PLAN_DURATIONS[currentPlan]!;
        const renewStart = addDays(priorEnd, randomInt(0, 4));
        const renewEnd = addDays(renewStart, currentDur);
        const currentPrice = PLAN_PRICES[currentPlan]!;
        const discount = Math.random() < 0.2 ? Math.round(currentPrice * 0.1) : 0;
        const net = currentPrice - discount;
        const isPartial = shouldBePartiallyPaid();
        const paid = isPartial ? Math.round(net * 0.6) : net;
        membershipSpecs.push({
          memberId: member.id,
          planName: currentPlan,
          startDate: renewStart,
          endDate: renewEnd,
          status: "active",
          totalAmount: currentPrice,
          discountAmount: discount,
          paidAmount: paid,
          notes: discount > 0 ? "Upgrade discount applied" : isPartial ? `Balance ₹${net - paid} pending` : undefined,
          createdAt: renewStart,
        });
      } else if (mi < 38) {
        let cursor = memberJoin;
        for (let j = 0; j < 2; j++) {
          const pPlan = randomPick(["Monthly", "Quarterly"]);
          const pDur = PLAN_DURATIONS[pPlan]!;
          const pEnd = addDays(cursor, pDur);
          const pPrice = PLAN_PRICES[pPlan]!;
          membershipSpecs.push({
            memberId: member.id,
            planName: pPlan,
            startDate: cursor,
            endDate: pEnd,
            status: "expired",
            totalAmount: pPrice,
            discountAmount: 0,
            paidAmount: pPrice,
            createdAt: cursor,
          });
          cursor = addDays(pEnd, randomInt(0, 5));
        }

        const cPlan = pickPlan();
        const cDur = PLAN_DURATIONS[cPlan]!;
        const cEnd = addDays(cursor, cDur);
        const cPrice = PLAN_PRICES[cPlan]!;
        const disc = Math.random() < 0.25 ? Math.round(cPrice * 0.1) : 0;
        const net = cPrice - disc;
        const isPartial = shouldBePartiallyPaid();
        const paid = isPartial ? Math.round(net * 0.65) : net;
        membershipSpecs.push({
          memberId: member.id,
          planName: cPlan,
          startDate: cursor,
          endDate: cEnd,
          status: "active",
          totalAmount: cPrice,
          discountAmount: disc,
          paidAmount: paid,
          notes: disc > 0 ? "Long-term member discount" : isPartial ? `Owes ₹${net - paid}` : undefined,
          createdAt: cursor,
        });
      } else {
        const planName = pickPlan();
        const dur = PLAN_DURATIONS[planName]!;
        const startDate = memberJoin;
        const endDate = addDays(startDate, dur);
        const price = PLAN_PRICES[planName]!;
        const discount = Math.random() < 0.08 ? Math.round(price * 0.1) : 0;
        const net = price - discount;
        const isPartial = shouldBePartiallyPaid();
        const paid = isPartial ? Math.round(net * 0.5) : net;
        membershipSpecs.push({
          memberId: member.id,
          planName,
          startDate,
          endDate,
          status: "active",
          totalAmount: price,
          discountAmount: discount,
          paidAmount: paid,
          notes: discount > 0 ? "First-time member discount" : isPartial ? `Half payment — balance ₹${net - paid}` : undefined,
          createdAt: startDate,
        });
      }
    } else if (spec.status === "active" && mi >= 60 && mi < 78) {
      const planName = pickPlan();
      const dur = PLAN_DURATIONS[planName]!;
      const endDate = addDays(memberJoin, dur);
      const price = PLAN_PRICES[planName]!;
      const isPartial = shouldBePartiallyPaid();
      const paid = isPartial ? Math.round(price * 0.5) : price;
      membershipSpecs.push({
        memberId: member.id,
        planName,
        startDate: memberJoin,
        endDate,
        status: "active",
        totalAmount: price,
        discountAmount: 0,
        paidAmount: paid,
        notes: isPartial ? "Will complete payment within the week" : undefined,
        createdAt: memberJoin,
      });
    } else if (spec.status === "active" && mi >= 78 && mi < 85) {
      const planName = pickPlan();
      const dur = PLAN_DURATIONS[planName]!;
      const endDate = addDays(memberJoin, dur);
      const price = PLAN_PRICES[planName]!;
      membershipSpecs.push({
        memberId: member.id,
        planName,
        startDate: memberJoin,
        endDate,
        status: "active",
        totalAmount: price,
        discountAmount: 0,
        paidAmount: price,
        createdAt: memberJoin,
      });
    } else if (spec.status === "frozen") {
      const priorEnd = addDays(memberJoin, 30);
      membershipSpecs.push({
        memberId: member.id,
        planName: "Monthly",
        startDate: memberJoin,
        endDate: priorEnd,
        status: "expired",
        totalAmount: 800,
        discountAmount: 0,
        paidAmount: 800,
        createdAt: memberJoin,
      });
      const frozenPlan = randomPick(["Quarterly", "Half-Yearly"]);
      const dur = PLAN_DURATIONS[frozenPlan]!;
      const frozenStart = addDays(priorEnd, randomInt(0, 3));
      const frozenEnd = addDays(frozenStart, dur);
      const price = PLAN_PRICES[frozenPlan]!;
      membershipSpecs.push({
        memberId: member.id,
        planName: frozenPlan,
        startDate: frozenStart,
        endDate: frozenEnd,
        status: "frozen",
        totalAmount: price,
        discountAmount: 0,
        paidAmount: price,
        notes: "Membership frozen — see freeze record",
        createdAt: frozenStart,
      });
    } else if (spec.status === "expired") {
      const numMs = randomInt(1, 2);
      let cursor = memberJoin;
      for (let j = 0; j < numMs; j++) {
        const planName = randomPick(["Monthly", "Monthly", "Quarterly"]);
        const dur = PLAN_DURATIONS[planName]!;
        const endDate = addDays(cursor, dur);
        const price = PLAN_PRICES[planName]!;
        const unpaid = Math.random() < 0.15;
        const paid = unpaid ? Math.round(price * 0.6) : price;
        membershipSpecs.push({
          memberId: member.id,
          planName,
          startDate: cursor,
          endDate,
          status: "expired",
          totalAmount: price,
          discountAmount: 0,
          paidAmount: paid,
          notes: unpaid ? `Owes ₹${price - paid}` : undefined,
          createdAt: cursor,
        });
        cursor = addDays(endDate, randomInt(1, 7));
      }
    }
  }

  const membershipRows = await db
    .insert(schema.memberMemberships)
    .values(
      membershipSpecs.map((ms) => ({
        memberId: ms.memberId,
        gymId,
        planId: plans[ms.planName]!.id,
        startDate: ms.startDate,
        endDate: ms.endDate,
        status: ms.status,
        totalAmount: money(ms.totalAmount),
        discountAmount: money(ms.discountAmount),
        paidAmount: money(ms.paidAmount),
        notes: ms.notes,
        createdBy: Math.random() > 0.4 ? ownerId : receptionistId,
        createdAt: ts(ms.createdAt),
        updatedAt: ts(ms.createdAt),
      }))
    )
    .returning();
  console.log(`  Created ${membershipRows.length} memberships\n`);

  const membershipByMember = new Map<string, typeof membershipRows>();
  for (const ms of membershipRows) {
    if (!membershipByMember.has(ms.memberId)) membershipByMember.set(ms.memberId, []);
    membershipByMember.get(ms.memberId)!.push(ms);
  }

  // ─── Step 7: Payments ──────────────────────────────────────
  console.log("Step 7: Creating payments...");

  interface PaymentSpec {
    memberId: string;
    membershipId: string;
    amount: number;
    method: "cash" | "upi" | "card" | "bank_transfer";
    status: "paid" | "partial";
    paymentDate: string;
    notes?: string;
  }

  const paymentSpecs: PaymentSpec[] = [];

  for (let msi = 0; msi < membershipSpecs.length; msi++) {
    const ms = membershipSpecs[msi]!;
    const msRow = membershipRows[msi]!;
    const paidTotal = ms.paidAmount;
    if (paidTotal <= 0) continue;

    const net = ms.totalAmount - ms.discountAmount;
    const isPartiallyPaid = paidTotal < net;

    if (ms.totalAmount <= 800) {
      paymentSpecs.push({
        memberId: ms.memberId,
        membershipId: msRow.id,
        amount: paidTotal,
        method: pickPayMethod(),
        status: isPartiallyPaid ? "partial" : "paid",
        paymentDate: ms.startDate,
        notes: isPartiallyPaid ? `Partial — balance ₹${net - paidTotal}` : undefined,
      });
    } else if (ms.totalAmount <= 2000) {
      if (Math.random() < 0.6) {
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: paidTotal,
          method: pickPayMethod(),
          status: isPartiallyPaid ? "partial" : "paid",
          paymentDate: ms.startDate,
          notes: isPartiallyPaid ? `Partial — balance ₹${net - paidTotal}` : undefined,
        });
      } else {
        const first = Math.round(paidTotal * 0.55);
        const second = paidTotal - first;
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: first,
          method: pickPayMethod(),
          status: "partial",
          paymentDate: ms.startDate,
          notes: "First installment",
        });
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: second,
          method: pickPayMethod(),
          status: isPartiallyPaid ? "partial" : "paid",
          paymentDate: addDays(ms.startDate, randomInt(7, 20)),
          notes: isPartiallyPaid ? "Second installment — balance remains" : "Final installment",
        });
      }
    } else if (ms.totalAmount <= 4000) {
      if (Math.random() < 0.4) {
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: paidTotal,
          method: pickPayMethod(),
          status: isPartiallyPaid ? "partial" : "paid",
          paymentDate: ms.startDate,
          notes: isPartiallyPaid ? `Partial — balance ₹${net - paidTotal}` : undefined,
        });
      } else {
        const first = Math.round(paidTotal * 0.5);
        const second = paidTotal - first;
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: first,
          method: pickPayMethod(),
          status: "partial",
          paymentDate: ms.startDate,
          notes: "Installment 1 of 2",
        });
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: second,
          method: pickPayMethod(),
          status: isPartiallyPaid ? "partial" : "paid",
          paymentDate: addDays(ms.startDate, randomInt(10, 25)),
          notes: isPartiallyPaid ? "Installment 2 — balance remains" : "Final installment",
        });
      }
    } else {
      if (Math.random() < 0.35) {
        const first = Math.round(paidTotal * 0.55);
        const second = paidTotal - first;
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: first,
          method: pickPayMethod(),
          status: "partial",
          paymentDate: ms.startDate,
          notes: "Installment 1 of 2",
        });
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: second,
          method: pickPayMethod(),
          status: isPartiallyPaid ? "partial" : "paid",
          paymentDate: addDays(ms.startDate, randomInt(10, 20)),
          notes: isPartiallyPaid ? "Installment 2 — balance remains" : "Final installment",
        });
      } else {
        const first = Math.round(paidTotal * 0.4);
        const second = Math.round(paidTotal * 0.35);
        const third = paidTotal - first - second;
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: first,
          method: pickPayMethod(),
          status: "partial",
          paymentDate: ms.startDate,
          notes: "Installment 1 of 3",
        });
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: second,
          method: pickPayMethod(),
          status: "partial",
          paymentDate: addDays(ms.startDate, randomInt(12, 20)),
          notes: "Installment 2 of 3",
        });
        paymentSpecs.push({
          memberId: ms.memberId,
          membershipId: msRow.id,
          amount: third,
          method: pickPayMethod(),
          status: isPartiallyPaid ? "partial" : "paid",
          paymentDate: addDays(ms.startDate, randomInt(25, 45)),
          notes: isPartiallyPaid ? "Installment 3 — balance remains" : "Final installment",
        });
      }
    }
  }

  paymentSpecs.sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));

  const receiptCounters: Record<number, number> = {};
  const paymentInserts = paymentSpecs.map((p) => {
    const year = parseInt(p.paymentDate.substring(0, 4));
    if (!receiptCounters[year]) receiptCounters[year] = 0;
    receiptCounters[year]!++;
    const receiptNumber = `GYM-${year}-${String(receiptCounters[year]).padStart(6, "0")}`;

    return {
      gymId,
      memberId: p.memberId,
      membershipId: p.membershipId,
      receiptNumber,
      amount: money(p.amount),
      paymentMethod: p.method,
      paymentStatus: p.status,
      paymentDate: p.paymentDate,
      notes: p.notes,
      createdBy: Math.random() > 0.4 ? ownerId : receptionistId,
      createdAt: ts(p.paymentDate),
    };
  });

  const paymentRows = [];
  for (let i = 0; i < paymentInserts.length; i += 50) {
    const batch = paymentInserts.slice(i, i + 50);
    const rows = await db.insert(schema.payments).values(batch).returning();
    paymentRows.push(...rows);
  }
  console.log(`  Created ${paymentRows.length} payments\n`);

  // ─── Step 8: Expenses ──────────────────────────────────────
  console.log("Step 8: Creating expenses...");

  interface ExpenseSpec {
    categoryName: string;
    amount: number;
    description: string;
    expenseDate: string;
    method: "cash" | "upi" | "card" | "bank_transfer";
  }

  const expenseSpecs: ExpenseSpec[] = [];

  for (let month = 1; month <= 6; month++) {
    const monthName = ["", "January", "February", "March", "April", "May", "June"][month]!;
    const y = 2026;

    expenseSpecs.push({
      categoryName: "Rent",
      amount: 15000,
      description: `${monthName} ${y} rent — 42/A Park Street`,
      expenseDate: date(y, month, 1),
      method: "bank_transfer",
    });

    const baseSalary = month <= 3 ? 14000 : 15000;
    expenseSpecs.push({
      categoryName: "Staff Salary",
      amount: baseSalary + randomInt(-500, 500),
      description: `${monthName} ${y} — trainer + helper salaries`,
      expenseDate: date(y, month, 1),
      method: "bank_transfer",
    });

    const baseElectricity = month <= 2 ? 2800 : month <= 4 ? 3400 : 4000;
    expenseSpecs.push({
      categoryName: "Electricity",
      amount: baseElectricity + randomInt(-200, 300),
      description: `${monthName} ${y} electricity bill`,
      expenseDate: date(y, month, 10),
      method: "upi",
    });

    expenseSpecs.push({
      categoryName: "Cleaning",
      amount: randomInt(2000, 3000),
      description: `${monthName} ${y} cleaning service`,
      expenseDate: date(y, month, 5),
      method: "cash",
    });

    expenseSpecs.push({
      categoryName: "Water",
      amount: randomInt(600, 900),
      description: `${monthName} ${y} water supply`,
      expenseDate: date(y, month, 8),
      method: "cash",
    });

    expenseSpecs.push({
      categoryName: "Internet",
      amount: 999,
      description: `${monthName} ${y} broadband (Jio Fiber)`,
      expenseDate: date(y, month, 12),
      method: "upi",
    });
  }

  expenseSpecs.push(
    {
      categoryName: "Equipment Maintenance",
      amount: 4500,
      description: "Treadmill belt replacement + servicing",
      expenseDate: date(2026, 1, 18),
      method: "upi",
    },
    {
      categoryName: "Equipment Maintenance",
      amount: 3200,
      description: "Cable machine pulley repair",
      expenseDate: date(2026, 3, 8),
      method: "cash",
    },
    {
      categoryName: "Equipment Maintenance",
      amount: 8500,
      description: "New set of dumbbells (5kg-20kg)",
      expenseDate: date(2026, 4, 15),
      method: "bank_transfer",
    },
    {
      categoryName: "Equipment Maintenance",
      amount: 2800,
      description: "Cross trainer console repair",
      expenseDate: date(2026, 5, 22),
      method: "cash",
    },
    {
      categoryName: "Equipment Maintenance",
      amount: 3500,
      description: "Smith machine cable replacement",
      expenseDate: date(2026, 6, 3),
      method: "upi",
    },
    {
      categoryName: "Marketing",
      amount: 5000,
      description: "Instagram + Facebook ads — January campaign",
      expenseDate: date(2026, 1, 20),
      method: "upi",
    },
    {
      categoryName: "Marketing",
      amount: 3000,
      description: "Pamphlet printing (500 copies)",
      expenseDate: date(2026, 2, 15),
      method: "cash",
    },
    {
      categoryName: "Marketing",
      amount: 4000,
      description: "YouTube fitness channel sponsorship",
      expenseDate: date(2026, 3, 12),
      method: "upi",
    },
    {
      categoryName: "Marketing",
      amount: 4500,
      description: "Summer membership drive — banner + social ads",
      expenseDate: date(2026, 5, 1),
      method: "upi",
    },
    {
      categoryName: "Marketing",
      amount: 2500,
      description: "Referral program flyers + promotion design",
      expenseDate: date(2026, 6, 1),
      method: "cash",
    },
    {
      categoryName: "Insurance",
      amount: 8000,
      description: "Annual gym liability insurance renewal",
      expenseDate: date(2026, 1, 15),
      method: "bank_transfer",
    },
    {
      categoryName: "Supplements",
      amount: 5500,
      description: "Protein powder + BCAA stock for resale",
      expenseDate: date(2026, 2, 5),
      method: "upi",
    },
    {
      categoryName: "Supplements",
      amount: 4200,
      description: "Pre-workout and shaker bottles restock",
      expenseDate: date(2026, 4, 8),
      method: "cash",
    },
    {
      categoryName: "Supplements",
      amount: 6800,
      description: "Whey protein bulk order (4 tubs) for resale",
      expenseDate: date(2026, 6, 5),
      method: "bank_transfer",
    },
    {
      categoryName: "Miscellaneous",
      amount: 1500,
      description: "Water dispenser maintenance",
      expenseDate: date(2026, 1, 25),
      method: "cash",
    },
    {
      categoryName: "Miscellaneous",
      amount: 2200,
      description: "New wall mirrors for stretching area",
      expenseDate: date(2026, 2, 20),
      method: "cash",
    },
    {
      categoryName: "Miscellaneous",
      amount: 3500,
      description: "AC servicing — all 4 units",
      expenseDate: date(2026, 3, 25),
      method: "cash",
    },
    {
      categoryName: "Miscellaneous",
      amount: 950,
      description: "Gym towels restock (50 pcs)",
      expenseDate: date(2026, 4, 18),
      method: "cash",
    },
    {
      categoryName: "Miscellaneous",
      amount: 2800,
      description: "CCTV camera repair (2 units)",
      expenseDate: date(2026, 5, 18),
      method: "upi",
    },
    {
      categoryName: "Miscellaneous",
      amount: 1800,
      description: "First aid kit refill + sanitizer bulk purchase",
      expenseDate: date(2026, 6, 8),
      method: "cash",
    },
    {
      categoryName: "Cleaning",
      amount: 1800,
      description: "Deep cleaning — post-Holi festival",
      expenseDate: date(2026, 3, 16),
      method: "cash",
    },
  );

  const expenseInserts = expenseSpecs.map((e) => ({
    gymId,
    categoryId: cats[e.categoryName]!.id,
    amount: money(e.amount),
    description: e.description,
    expenseDate: e.expenseDate,
    paymentMethod: e.method,
    createdBy: ownerId,
    createdAt: ts(e.expenseDate),
    updatedAt: ts(e.expenseDate),
  }));

  const expenseRows = [];
  for (let i = 0; i < expenseInserts.length; i += 50) {
    const batch = expenseInserts.slice(i, i + 50);
    const rows = await db.insert(schema.expenses).values(batch).returning();
    expenseRows.push(...rows);
  }
  console.log(`  Created ${expenseRows.length} expenses\n`);

  // ─── Step 9: Member Notes ──────────────────────────────────
  console.log("Step 9: Creating member notes...");
  const noteInserts = [];
  const notedMembers = new Set<number>();
  while (notedMembers.size < 30) {
    notedMembers.add(randomInt(0, memberRows.length - 1));
  }

  let noteIdx = 0;
  for (const mi of notedMembers) {
    const member = memberRows[mi]!;
    const note = NOTE_TEMPLATES[noteIdx % NOTE_TEMPLATES.length]!;
    const daysAgo = randomInt(1, 90);
    noteInserts.push({
      memberId: member.id,
      gymId,
      content: note,
      createdBy: Math.random() > 0.5 ? ownerId : receptionistId,
      createdAt: ts(addDays(TODAY, -daysAgo)),
    });
    noteIdx++;
  }

  await db.insert(schema.memberNotes).values(noteInserts);
  console.log(`  Created ${noteInserts.length} notes\n`);

  // ─── Step 10: Membership Freezes ───────────────────────────
  console.log("Step 10: Creating membership freezes...");
  const frozenMemberIndices = memberSpecs
    .map((m, i) => (m.status === "frozen" ? i : -1))
    .filter((i) => i >= 0);

  const freezeInserts = [];
  for (let fi = 0; fi < frozenMemberIndices.length; fi++) {
    const mi = frozenMemberIndices[fi]!;
    const memberships = membershipByMember.get(memberRows[mi]!.id);
    if (!memberships || memberships.length === 0) continue;
    const frozenMs = memberships.find((ms) => ms.status === "frozen");
    if (!frozenMs) continue;

    const freezeDaysAgo = randomInt(5, 25);
    const freezeStart = addDays(TODAY, -freezeDaysAgo);
    freezeInserts.push({
      membershipId: frozenMs.id,
      gymId,
      freezeStart,
      freezeEnd: null as string | null,
      reason: FREEZE_REASONS[fi % FREEZE_REASONS.length]!,
      status: "active" as const,
      daysAdded: 0,
      createdBy: ownerId,
      createdAt: ts(freezeStart),
    });
  }

  const activeMembersForCompletedFreezes = [5, 12, 18, 25, 32, 45];
  for (const mi of activeMembersForCompletedFreezes) {
    if (mi >= memberRows.length) continue;
    const memberships = membershipByMember.get(memberRows[mi]!.id);
    if (!memberships || memberships.length === 0) continue;
    const ms = memberships[0]!;
    const freezeStartDaysAgo = randomInt(30, 60);
    const freezeDuration = randomInt(7, 14);
    const freezeStart = addDays(TODAY, -freezeStartDaysAgo);
    const freezeEnd = addDays(freezeStart, freezeDuration);
    freezeInserts.push({
      membershipId: ms.id,
      gymId,
      freezeStart,
      freezeEnd,
      reason: FREEZE_REASONS[(mi + 3) % FREEZE_REASONS.length]!,
      status: "completed" as const,
      daysAdded: freezeDuration,
      createdBy: receptionistId,
      createdAt: ts(freezeStart),
    });
  }

  if (freezeInserts.length > 0) {
    await db.insert(schema.membershipFreezes).values(freezeInserts);
  }
  console.log(`  Created ${freezeInserts.length} freezes\n`);

  // ─── Step 11: Audit Logs ───────────────────────────────────
  console.log("Step 11: Creating audit logs...");
  const auditInserts: Array<{
    gymId: string;
    userId: string;
    action: typeof schema.auditLogs.$inferInsert.action;
    entityType: string;
    entityId: string;
    createdAt: Date;
  }> = [];

  for (const m of memberRows) {
    auditInserts.push({
      gymId,
      userId: ownerId,
      action: "member_created",
      entityType: "member",
      entityId: m.id,
      createdAt: ts(m.joinDate),
    });
  }

  for (let i = 0; i < membershipRows.length; i++) {
    const ms = membershipRows[i]!;
    const spec = membershipSpecs[i]!;
    auditInserts.push({
      gymId,
      userId: ownerId,
      action: "membership_created",
      entityType: "membership",
      entityId: ms.id,
      createdAt: ts(spec.startDate),
    });
  }

  for (const p of paymentRows) {
    auditInserts.push({
      gymId,
      userId: ownerId,
      action: "payment_created",
      entityType: "payment",
      entityId: p.id,
      createdAt: ts(p.paymentDate),
    });
  }

  for (let i = 0; i < auditInserts.length; i += 50) {
    const batch = auditInserts.slice(i, i + 50);
    await db.insert(schema.auditLogs).values(batch);
  }
  console.log(`  Created ${auditInserts.length} audit log entries\n`);

  // ─── Summary ───────────────────────────────────────────────
  const totalRevenue = paymentSpecs.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenseAmount = expenseSpecs.reduce((sum, e) => sum + e.amount, 0);
  const totalOutstanding = membershipSpecs.reduce((sum, ms) => {
    const net = ms.totalAmount - ms.discountAmount;
    return sum + Math.max(0, net - ms.paidAmount);
  }, 0);

  const methodTotals: Record<string, number> = {};
  for (const p of paymentSpecs) {
    methodTotals[p.method] = (methodTotals[p.method] || 0) + p.amount;
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log("  DEMO DATASET SUMMARY");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Total Members:       ${memberRows.length}`);
  console.log(`    Active:            ${memberSpecs.filter((m) => m.status === "active").length}`);
  console.log(`    Frozen:            ${memberSpecs.filter((m) => m.status === "frozen").length}`);
  console.log(`    Expired:           ${memberSpecs.filter((m) => m.status === "expired").length}`);
  console.log(`  Total Memberships:   ${membershipRows.length}`);
  console.log(`  Total Payments:      ${paymentRows.length}`);
  console.log(`  Total Expenses:      ${expenseRows.length}`);
  console.log(`  Total Notes:         ${noteInserts.length}`);
  console.log(`  Total Freezes:       ${freezeInserts.length}`);
  console.log(`  Total Audit Logs:    ${auditInserts.length}`);
  console.log("  ─────────────────────────────────────────────────────");
  console.log(`  Total Revenue:       ₹${totalRevenue.toLocaleString("en-IN")}`);
  console.log(`  Total Expenses:      ₹${totalExpenseAmount.toLocaleString("en-IN")}`);
  console.log(`  Net Profit:          ₹${(totalRevenue - totalExpenseAmount).toLocaleString("en-IN")}`);
  console.log(`  Outstanding:         ₹${totalOutstanding.toLocaleString("en-IN")}`);
  console.log(`  Members w/ Dues:     ${membershipSpecs.filter(ms => (ms.totalAmount - ms.discountAmount - ms.paidAmount) > 0).length}`);
  console.log("  ─────────────────────────────────────────────────────");
  console.log("  Payment Methods:");
  for (const [method, total] of Object.entries(methodTotals).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${method.padEnd(15)} ₹${total.toLocaleString("en-IN")}`);
  }
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("Demo dataset generation complete!");
  console.log("Login: owner@ironparadise.in / Admin@123\n");
}

demoSeed().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
