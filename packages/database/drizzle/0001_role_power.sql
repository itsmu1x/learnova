ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "power" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
UPDATE "roles" SET "power" = 10 WHERE "slug" = 'student';--> statement-breakpoint
UPDATE "roles" SET "power" = 40 WHERE "slug" = 'instructor';--> statement-breakpoint
UPDATE "roles" SET "power" = 100 WHERE "slug" = 'admin';
