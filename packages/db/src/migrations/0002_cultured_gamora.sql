ALTER TYPE "public"."audit_action" ADD VALUE 'member_deleted' BEFORE 'member_status_changed';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'payment_updated' BEFORE 'payment_voided';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'payment_deleted' BEFORE 'payment_voided';--> statement-breakpoint
ALTER TABLE "message_templates" ALTER COLUMN "channels" SET DEFAULT '["whatsapp"]'::jsonb;