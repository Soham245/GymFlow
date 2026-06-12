CREATE TYPE "public"."in_app_notification_type" AS ENUM('membership_expiring_7_days', 'membership_expiring_3_days', 'membership_expiring_today', 'membership_expired', 'outstanding_balance', 'freeze_ending', 'system');--> statement-breakpoint
CREATE TABLE "in_app_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"type" "in_app_notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"related_entity_type" varchar(50),
	"related_entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "in_app_notif_gym_created_idx" ON "in_app_notifications" USING btree ("gym_id","created_at");--> statement-breakpoint
CREATE INDEX "in_app_notif_gym_unread_idx" ON "in_app_notifications" USING btree ("gym_id","is_read");--> statement-breakpoint
CREATE INDEX "in_app_notif_gym_type_idx" ON "in_app_notifications" USING btree ("gym_id","type");--> statement-breakpoint
CREATE INDEX "in_app_notif_entity_idx" ON "in_app_notifications" USING btree ("related_entity_type","related_entity_id");