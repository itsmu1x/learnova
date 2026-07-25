ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "playback_id" varchar(191);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "thumbnail_url" text;
