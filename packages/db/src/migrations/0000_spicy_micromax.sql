CREATE TYPE "public"."audit_action" AS ENUM('member_created', 'member_updated', 'member_status_changed', 'membership_created', 'membership_renewed', 'membership_cancelled', 'membership_frozen', 'membership_unfrozen', 'payment_created', 'payment_voided', 'expense_created', 'expense_updated', 'expense_deleted', 'plan_created', 'plan_updated', 'user_created', 'user_updated', 'user_login', 'user_logout', 'gym_updated');--> statement-breakpoint
CREATE TYPE "public"."freeze_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'expired', 'inactive', 'frozen');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'expired', 'cancelled', 'frozen');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('whatsapp', 'sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('welcome', 'renewal_reminder', 'expiry_notice', 'payment_receipt', 'freeze_notice', 'daily_summary', 'custom');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'upi', 'card', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'partial', 'pending', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'receptionist', 'trainer');--> statement-breakpoint
CREATE TABLE "gyms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"pincode" varchar(10),
	"phone" varchar(20),
	"email" varchar(255),
	"logo_url" text,
	"timezone" varchar(50) DEFAULT 'Asia/Kolkata' NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gyms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"role" "user_role" DEFAULT 'receptionist' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"gym_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"gender" "gender",
	"date_of_birth" date,
	"address" text,
	"emergency_contact_name" varchar(255),
	"emergency_contact_phone" varchar(20),
	"photo_url" text,
	"join_date" date NOT NULL,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "member_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"gym_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "end_after_start" CHECK ("member_memberships"."end_date" >= "member_memberships"."start_date"),
	CONSTRAINT "discount_within_total" CHECK ("member_memberships"."discount_amount" <= "member_memberships"."total_amount"),
	CONSTRAINT "paid_within_net" CHECK ("member_memberships"."paid_amount" <= ("member_memberships"."total_amount" - "member_memberships"."discount_amount"))
);
--> statement-breakpoint
CREATE TABLE "membership_freezes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"gym_id" uuid NOT NULL,
	"freeze_start" date NOT NULL,
	"freeze_end" date,
	"reason" text,
	"status" "freeze_status" DEFAULT 'active' NOT NULL,
	"days_added" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "freeze_end_after_start" CHECK ("membership_freezes"."freeze_end" IS NULL OR "membership_freezes"."freeze_end" >= "membership_freezes"."freeze_start")
);
--> statement-breakpoint
CREATE TABLE "membership_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"duration_days" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "duration_positive" CHECK ("membership_plans"."duration_days" > 0),
	CONSTRAINT "price_non_negative" CHECK ("membership_plans"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"membership_id" uuid,
	"receipt_number" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'paid' NOT NULL,
	"payment_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "amount_positive" CHECK ("payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"expense_date" date NOT NULL,
	"payment_method" "payment_method",
	"receipt_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "expense_amount_positive" CHECK ("expenses"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"user_id" uuid,
	"action" "audit_action" NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" uuid,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"recipient" text NOT NULL,
	"content" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_memberships" ADD CONSTRAINT "member_memberships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_memberships" ADD CONSTRAINT "member_memberships_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_memberships" ADD CONSTRAINT "member_memberships_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_memberships" ADD CONSTRAINT "member_memberships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_freezes" ADD CONSTRAINT "membership_freezes_membership_id_member_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."member_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_freezes" ADD CONSTRAINT "membership_freezes_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_freezes" ADD CONSTRAINT "membership_freezes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_plans" ADD CONSTRAINT "membership_plans_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_membership_id_member_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."member_memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications_log" ADD CONSTRAINT "notifications_log_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications_log" ADD CONSTRAINT "notifications_log_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_gym_email_idx" ON "users" USING btree ("gym_id","email");--> statement-breakpoint
CREATE INDEX "users_gym_role_idx" ON "users" USING btree ("gym_id","role");--> statement-breakpoint
CREATE INDEX "member_notes_member_idx" ON "member_notes" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "members_gym_phone_uniq" ON "members" USING btree ("gym_id","phone");--> statement-breakpoint
CREATE INDEX "members_gym_status_idx" ON "members" USING btree ("gym_id","status");--> statement-breakpoint
CREATE INDEX "members_gym_name_idx" ON "members" USING btree ("gym_id","name");--> statement-breakpoint
CREATE INDEX "members_gym_join_date_idx" ON "members" USING btree ("gym_id","join_date");--> statement-breakpoint
CREATE INDEX "member_memberships_member_idx" ON "member_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_memberships_gym_status_idx" ON "member_memberships" USING btree ("gym_id","status");--> statement-breakpoint
CREATE INDEX "member_memberships_end_date_idx" ON "member_memberships" USING btree ("gym_id","end_date");--> statement-breakpoint
CREATE INDEX "membership_freezes_membership_idx" ON "membership_freezes" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "membership_freezes_gym_status_idx" ON "membership_freezes" USING btree ("gym_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_plans_gym_name_uniq" ON "membership_plans" USING btree ("gym_id","name");--> statement-breakpoint
CREATE INDEX "membership_plans_gym_active_idx" ON "membership_plans" USING btree ("gym_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_gym_receipt_uniq" ON "payments" USING btree ("gym_id","receipt_number");--> statement-breakpoint
CREATE INDEX "payments_gym_date_idx" ON "payments" USING btree ("gym_id","payment_date");--> statement-breakpoint
CREATE INDEX "payments_gym_method_idx" ON "payments" USING btree ("gym_id","payment_method");--> statement-breakpoint
CREATE INDEX "payments_gym_status_idx" ON "payments" USING btree ("gym_id","payment_status");--> statement-breakpoint
CREATE INDEX "payments_member_idx" ON "payments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "payments_membership_idx" ON "payments" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_gym_name_uniq" ON "expense_categories" USING btree ("gym_id","name");--> statement-breakpoint
CREATE INDEX "expense_categories_gym_active_idx" ON "expense_categories" USING btree ("gym_id","is_active");--> statement-breakpoint
CREATE INDEX "expenses_gym_date_idx" ON "expenses" USING btree ("gym_id","expense_date");--> statement-breakpoint
CREATE INDEX "expenses_gym_category_idx" ON "expenses" USING btree ("gym_id","category_id");--> statement-breakpoint
CREATE INDEX "audit_logs_gym_created_idx" ON "audit_logs" USING btree ("gym_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_gym_action_idx" ON "audit_logs" USING btree ("gym_id","action");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_gym_created_idx" ON "notifications_log" USING btree ("gym_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_member_idx" ON "notifications_log" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "notifications_gym_type_idx" ON "notifications_log" USING btree ("gym_id","type");