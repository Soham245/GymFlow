CREATE TYPE "public"."message_trigger_type" AS ENUM('member_created', 'membership_expiring_7_days', 'membership_expiring_3_days', 'membership_expiring_1_day', 'membership_expired', 'payment_received', 'manual');--> statement-breakpoint
CREATE TYPE "public"."scheduled_message_status" AS ENUM('draft', 'scheduled', 'sent', 'cancelled');--> statement-breakpoint
CREATE TABLE "message_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" uuid,
	"template_id" uuid,
	"scheduled_message_id" uuid,
	"trigger_type" "message_trigger_type",
	"channel" "notification_channel" NOT NULL,
	"recipient" text NOT NULL,
	"content" text,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"trigger_type" "message_trigger_type",
	"channels" jsonb DEFAULT '["whatsapp"]' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "scheduled_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"target_filter" jsonb,
	"status" "scheduled_message_status" DEFAULT 'draft' NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_scheduled_message_id_scheduled_messages_id_fk" FOREIGN KEY ("scheduled_message_id") REFERENCES "public"."scheduled_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_log_gym_created_idx" ON "message_log" USING btree ("gym_id","created_at");--> statement-breakpoint
CREATE INDEX "message_log_member_idx" ON "message_log" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "message_log_template_idx" ON "message_log" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "message_log_trigger_idx" ON "message_log" USING btree ("gym_id","trigger_type");--> statement-breakpoint
CREATE INDEX "message_log_scheduled_idx" ON "message_log" USING btree ("scheduled_message_id");--> statement-breakpoint
CREATE INDEX "message_log_gym_status_idx" ON "message_log" USING btree ("gym_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "message_templates_gym_name_uniq" ON "message_templates" USING btree ("gym_id","name");--> statement-breakpoint
CREATE INDEX "message_templates_gym_active_idx" ON "message_templates" USING btree ("gym_id","is_active");--> statement-breakpoint
CREATE INDEX "message_templates_gym_trigger_idx" ON "message_templates" USING btree ("gym_id","trigger_type");--> statement-breakpoint
CREATE INDEX "scheduled_messages_gym_status_idx" ON "scheduled_messages" USING btree ("gym_id","status");--> statement-breakpoint
CREATE INDEX "scheduled_messages_scheduled_at_idx" ON "scheduled_messages" USING btree ("scheduled_at");