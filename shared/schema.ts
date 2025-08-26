import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("inactive"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facebook Pages
export const facebookPages = pgTable("facebook_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  facebookPageId: varchar("facebook_page_id").notNull().unique(),
  name: text("name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  followers: integer("followers").default(0),
  accessToken: text("access_token").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Generated Content
export const generatedContent = pgTable("generated_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pageId: varchar("page_id").references(() => facebookPages.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  contentType: varchar("content_type").notNull().default("post"), // post, story, ad
  aiModel: varchar("ai_model").notNull(), // gpt-5, claude, perplexity
  prompt: text("prompt"),
  imageUrl: varchar("image_url"),
  status: varchar("status").notNull().default("draft"), // draft, scheduled, published, failed
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messenger Bot Configuration
export const messengerBots = pgTable("messenger_bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => facebookPages.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(false),
  welcomeMessage: text("welcome_message"),
  fallbackMessage: text("fallback_message"),
  aiModel: varchar("ai_model").default("gpt-5"),
  settings: jsonb("settings").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics Data
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => facebookPages.id, { onDelete: "cascade" }),
  contentId: varchar("content_id").references(() => generatedContent.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  reach: integer("reach").default(0),
  impressions: integer("impressions").default(0),
  engagements: integer("engagements").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  clicks: integer("clicks").default(0),
  spend: decimal("spend", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ad Intelligence Data
export const adIntelligence = pgTable("ad_intelligence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adId: varchar("ad_id").notNull(),
  pageId: varchar("page_id"),
  pageName: text("page_name"),
  adContent: text("ad_content"),
  adImageUrl: varchar("ad_image_url"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  spend: decimal("spend", { precision: 10, scale: 2 }),
  impressions: integer("impressions"),
  targetAudience: jsonb("target_audience").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  facebookPages: many(facebookPages),
  generatedContent: many(generatedContent),
  adIntelligence: many(adIntelligence),
}));

export const facebookPagesRelations = relations(facebookPages, ({ one, many }) => ({
  user: one(users, {
    fields: [facebookPages.userId],
    references: [users.id],
  }),
  generatedContent: many(generatedContent),
  messengerBot: one(messengerBots),
  analytics: many(analytics),
}));

export const generatedContentRelations = relations(generatedContent, ({ one, many }) => ({
  user: one(users, {
    fields: [generatedContent.userId],
    references: [users.id],
  }),
  page: one(facebookPages, {
    fields: [generatedContent.pageId],
    references: [facebookPages.id],
  }),
  analytics: many(analytics),
}));

export const messengerBotsRelations = relations(messengerBots, ({ one }) => ({
  page: one(facebookPages, {
    fields: [messengerBots.pageId],
    references: [facebookPages.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  page: one(facebookPages, {
    fields: [analytics.pageId],
    references: [facebookPages.id],
  }),
  content: one(generatedContent, {
    fields: [analytics.contentId],
    references: [generatedContent.id],
  }),
}));

export const adIntelligenceRelations = relations(adIntelligence, ({ one }) => ({
  user: one(users, {
    fields: [adIntelligence.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacebookPageSchema = createInsertSchema(facebookPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedContentSchema = createInsertSchema(generatedContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessengerBotSchema = createInsertSchema(messengerBots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

export const insertAdIntelligenceSchema = createInsertSchema(adIntelligence).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FacebookPage = typeof facebookPages.$inferSelect;
export type InsertFacebookPage = z.infer<typeof insertFacebookPageSchema>;

export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;

export type MessengerBot = typeof messengerBots.$inferSelect;
export type InsertMessengerBot = z.infer<typeof insertMessengerBotSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type AdIntelligence = typeof adIntelligence.$inferSelect;
export type InsertAdIntelligence = z.infer<typeof insertAdIntelligenceSchema>;
