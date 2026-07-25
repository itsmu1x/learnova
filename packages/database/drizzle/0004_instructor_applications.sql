CREATE TYPE "public"."instructor_application_status" AS ENUM('pending', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instructor_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "instructor_application_status" DEFAULT 'pending' NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"headline" varchar(200),
	"bio" text,
	"expertise" text NOT NULL,
	"motivation" text NOT NULL,
	"experience_years" integer,
	"portfolio_url" text,
	"linkedin_url" text,
	"certificate_url" text,
	"certificate_file_name" varchar(255),
	"admin_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instructor_applications_user_idx" ON "instructor_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instructor_applications_status_idx" ON "instructor_applications" USING btree ("status");
