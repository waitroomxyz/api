import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";

// Core waitlist table
export const waitlists = pgTable(
  "waitlists",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    // Multi-tenant support
    projectId: text("project_id").notNull(), // API key or project identifier

    // User data
    username: text("username").notNull(),
    email: text("email").notNull(),
    displayUsername: text("display_username").notNull(),

    // Metadata
    metadata: text("metadata"),
    tags: text("tags"),

    // Referral system
    referredBy: text("referred_by"), // username of who referred them
    inviteCode: text("invite_code").notNull().unique(), // unique invite code for sharing

    // Verification
    isEmailVerified: boolean("is_email_verified")
      .notNull()
      .$defaultFn(() => false),

    // Scoring system fields
    priorityScore: text("priority_score").default("0"), // stored as string to avoid precision issues
    initialPosition: text("initial_position"), // position when they first joined
    joinIndex: text("join_index"), // their join order
    totalAtJoin: text("total_at_join"), // total users when they joined
    timeScore: text("time_score"), // frozen time score
    verifiedReferralsCount: text("verified_referrals_count").default("0"),
    verifiedSharesCount: text("verified_shares_count").default("0"),

    /* Status
     active, invited, converted, blocked (better approch can be enum which is already defined below as "WaitlistStatus") 
    */
    status: text("status").notNull().default("active"),

    // Timestamps
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Indexes for better query performance
    projectUsernameIdx: index("waitlists_project_username_idx").on(
      table.projectId,
      table.username
    ),
    projectEmailIdx: index("waitlists_project_email_idx").on(
      table.projectId,
      table.email
    ),
    projectScoreIdx: index("waitlists_project_score_idx").on(
      table.projectId,
      table.priorityScore
    ),
    projectStatusIdx: index("waitlists_project_status_idx").on(
      table.projectId,
      table.status
    ),
  })
);

// Users table - people who create waitlists
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"), // nullable for OAuth-only users

  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Projects/Waitlists that users create
export const projects = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // API keys
    apiKey: text("api_key").notNull().unique(), // Public API key
    secretKey: text("secret_key").notNull().unique(), // Secret for webhooks/admin

    // Basic project info
    name: text("name").notNull(),
    description: text("description"),

    // Simple settings JSON
    settings: text("settings"), // project-specific settings

    // Basic usage tracking
    totalEntries: text("total_entries").default("0"),

    // Status
    isActive: boolean("is_active")
      .notNull()
      .$defaultFn(() => true),

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("projects_user_id_idx").on(table.userId),
  })
);

// Referral tracking table
export const waitlistReferrals = pgTable(
  "waitlist_referrals",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    referrerUsername: text("referrer_username").notNull(),
    refereeUsername: text("referee_username").notNull(),

    isVerified: boolean("is_verified")
      .notNull()
      .$defaultFn(() => true), // optimistically verified
    verificationMethod: text("verification_method").default("invite_code"), // 'invite_code', 'manual', etc. (can switch to enum later)

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    projectReferrerIdx: index("referrals_project_referrer_idx").on(
      table.projectId,
      table.referrerUsername
    ),
    projectRefereeIdx: index("referrals_project_referee_idx").on(
      table.projectId,
      table.refereeUsername
    ),
  })
);

// Social activity tracking table
export const waitlistSocialShares = pgTable(
  "waitlist_social_shares",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    username: text("username").notNull(),

    platform: text("platform").notNull(), // 'twitter', 'facebook', 'linkedin', etc.
    shareUrl: text("share_url"), // the URL they shared
    platformPostId: text("platform_post_id"), // platform-specific post ID if verifiable
    verificationToken: text("verification_token"), // unique token that user must include in their post

    isVerified: boolean("is_verified")
      .notNull()
      .$defaultFn(() => false), // require actual verification
    verificationMethod: text("verification_method").default(
      "token_verification"
    ), // 'token_verification', 'manual', 'optimistic'

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    projectUsernameIdx: index("social_shares_project_username_idx").on(
      table.projectId,
      table.username
    ),
    projectPlatformIdx: index("social_shares_project_platform_idx").on(
      table.projectId,
      table.platform
    ),
  })
);

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Waitlist = typeof waitlists.$inferSelect;
export type NewWaitlist = typeof waitlists.$inferInsert;

export type WaitlistReferral = typeof waitlistReferrals.$inferSelect;
export type NewWaitlistReferral = typeof waitlistReferrals.$inferInsert;

export type WaitlistSocialShare = typeof waitlistSocialShares.$inferSelect;
export type NewWaitlistSocialShare = typeof waitlistSocialShares.$inferInsert;

// Enums for better type safety
export const WaitlistStatus = {
  ACTIVE: "active",
  INVITED: "invited",
  CONVERTED: "converted",
  BLOCKED: "blocked",
} as const;

export const EventType = {
  JOINED: "joined",
  INVITED: "invited",
  REFERRED: "referred",
  SHARED: "shared",
  VERIFIED: "verified",
  CONVERTED: "converted",
  POSITION_UPDATED: "position_updated",
} as const;

export const Platform = {
  TWITTER: "twitter",
  FACEBOOK: "facebook",
  LINKEDIN: "linkedin",
  INSTAGRAM: "instagram",
  TIKTOK: "tiktok",
  REDDIT: "reddit",
  OTHER: "other",
} as const;
