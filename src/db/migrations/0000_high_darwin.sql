CREATE TABLE "projects" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"api_key" text NOT NULL,
	"secret_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"settings" text,
	"total_entries" text DEFAULT '0',
	"is_active" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "projects_api_key_unique" UNIQUE("api_key"),
	CONSTRAINT "projects_secret_key_unique" UNIQUE("secret_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "waitlist_referrals" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"referrer_username" text NOT NULL,
	"referee_username" text NOT NULL,
	"is_verified" boolean NOT NULL,
	"verification_method" text DEFAULT 'invite_code',
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_social_shares" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"username" text NOT NULL,
	"platform" text NOT NULL,
	"share_url" text,
	"platform_post_id" text,
	"verification_token" text,
	"is_verified" boolean NOT NULL,
	"verification_method" text DEFAULT 'token_verification',
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlists" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"display_username" text NOT NULL,
	"metadata" text,
	"tags" text,
	"referred_by" text,
	"invite_code" text NOT NULL,
	"is_email_verified" boolean NOT NULL,
	"priority_score" text DEFAULT '0',
	"initial_position" text,
	"join_index" text,
	"total_at_join" text,
	"time_score" text,
	"verified_referrals_count" text DEFAULT '0',
	"verified_shares_count" text DEFAULT '0',
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "waitlists_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_referrals" ADD CONSTRAINT "waitlist_referrals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_social_shares" ADD CONSTRAINT "waitlist_social_shares_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "referrals_project_referrer_idx" ON "waitlist_referrals" USING btree ("project_id","referrer_username");--> statement-breakpoint
CREATE INDEX "referrals_project_referee_idx" ON "waitlist_referrals" USING btree ("project_id","referee_username");--> statement-breakpoint
CREATE INDEX "social_shares_project_username_idx" ON "waitlist_social_shares" USING btree ("project_id","username");--> statement-breakpoint
CREATE INDEX "social_shares_project_platform_idx" ON "waitlist_social_shares" USING btree ("project_id","platform");--> statement-breakpoint
CREATE INDEX "waitlists_project_username_idx" ON "waitlists" USING btree ("project_id","username");--> statement-breakpoint
CREATE INDEX "waitlists_project_email_idx" ON "waitlists" USING btree ("project_id","email");--> statement-breakpoint
CREATE INDEX "waitlists_project_score_idx" ON "waitlists" USING btree ("project_id","priority_score");--> statement-breakpoint
CREATE INDEX "waitlists_project_status_idx" ON "waitlists" USING btree ("project_id","status");