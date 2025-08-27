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
  learningEnabled: boolean("learning_enabled").default(true),
  totalConversations: integer("total_conversations").default(0),
  successfulResponses: integer("successful_responses").default(0),
  learningScore: decimal("learning_score", { precision: 5, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversation Storage for AI Learning
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => facebookPages.id, { onDelete: "cascade" }),
  botId: varchar("bot_id").notNull().references(() => messengerBots.id, { onDelete: "cascade" }),
  userId: varchar("user_id"), // Facebook user ID
  userName: varchar("user_name"),
  conversationId: varchar("conversation_id").notNull(), // Groups messages by conversation
  messageType: varchar("message_type").notNull(), // 'user_message', 'bot_response'
  content: text("content").notNull(),
  sentiment: varchar("sentiment"), // positive, negative, neutral
  intent: varchar("intent"), // question, complaint, compliment, request, etc.
  aiModel: varchar("ai_model"),
  responseTime: integer("response_time"), // milliseconds
  userSatisfaction: integer("user_satisfaction"), // 1-5 rating if available
  contextTags: jsonb("context_tags").default('[]'), // topics, keywords
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversation Analysis and Insights
export const conversationInsights = pgTable("conversation_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => facebookPages.id, { onDelete: "cascade" }),
  botId: varchar("bot_id").notNull().references(() => messengerBots.id, { onDelete: "cascade" }),
  analysisDate: timestamp("analysis_date").defaultNow(),
  totalConversations: integer("total_conversations").default(0),
  avgResponseTime: decimal("avg_response_time", { precision: 8, scale: 2 }),
  avgSatisfaction: decimal("avg_satisfaction", { precision: 3, scale: 2 }),
  commonIntents: jsonb("common_intents").default('[]'),
  sentimentDistribution: jsonb("sentiment_distribution").default('{}'),
  popularTopics: jsonb("popular_topics").default('[]'),
  improvedResponses: jsonb("improved_responses").default('[]'),
  learningRecommendations: text("learning_recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bot Learning Knowledge Base
export const botLearningData = pgTable("bot_learning_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => facebookPages.id, { onDelete: "cascade" }),
  botId: varchar("bot_id").notNull().references(() => messengerBots.id, { onDelete: "cascade" }),
  questionPattern: text("question_pattern").notNull(),
  bestResponse: text("best_response").notNull(),
  responseQuality: decimal("response_quality", { precision: 3, scale: 2 }).default("0.00"),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  userFeedback: jsonb("user_feedback").default('[]'),
  contextKeywords: jsonb("context_keywords").default('[]'),
  improvementNotes: text("improvement_notes"),
  isActive: boolean("is_active").default(true),
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
  adVideoUrl: varchar("ad_video_url"),
  adType: varchar("ad_type"), // POLITICAL_AND_ISSUE_ADS, ALL
  adCategory: varchar("ad_category"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  spend: decimal("spend", { precision: 10, scale: 2 }),
  impressions: integer("impressions"),
  targetAudience: jsonb("target_audience").default('{}'),
  demographicDistribution: jsonb("demographic_distribution").default('{}'),
  countries: jsonb("countries").default('[]'),
  regions: jsonb("regions").default('[]'),
  platforms: jsonb("platforms").default('[]'), // Facebook, Instagram, etc.
  funding: text("funding"), // Who paid for the ad
  disclaimer: text("disclaimer"),
  adLibraryUrl: varchar("ad_library_url"),
  currency: varchar("currency").default("USD"),
  estimatedAudience: jsonb("estimated_audience").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facebook Ads Library Search Queries
export const adLibrarySearches = pgTable("ad_library_searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  searchTerms: text("search_terms").notNull(),
  adType: varchar("ad_type").default("ALL"), // POLITICAL_AND_ISSUE_ADS, ALL
  countries: jsonb("countries").default('["US"]'),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  resultsCount: integer("results_count").default(0),
  lastExecuted: timestamp("last_executed"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  conversations: many(conversations),
}));

export const messengerBotsRelations = relations(messengerBots, ({ one, many }) => ({
  page: one(facebookPages, {
    fields: [messengerBots.pageId],
    references: [facebookPages.id],
  }),
  conversations: many(conversations),
  insights: many(conversationInsights),
  learningData: many(botLearningData),
}));

export const conversationsRelations = relations(conversations, ({ one }) => ({
  page: one(facebookPages, {
    fields: [conversations.pageId],
    references: [facebookPages.id],
  }),
  bot: one(messengerBots, {
    fields: [conversations.botId],
    references: [messengerBots.id],
  }),
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

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertConversationInsightSchema = createInsertSchema(conversationInsights).omit({
  id: true,
  createdAt: true,
});

export const insertBotLearningDataSchema = createInsertSchema(botLearningData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdLibrarySearchSchema = createInsertSchema(adLibrarySearches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type ConversationInsight = typeof conversationInsights.$inferSelect;
export type InsertConversationInsight = z.infer<typeof insertConversationInsightSchema>;

export type BotLearningData = typeof botLearningData.$inferSelect;
export type InsertBotLearningData = z.infer<typeof insertBotLearningDataSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type AdIntelligence = typeof adIntelligence.$inferSelect;
export type InsertAdIntelligence = z.infer<typeof insertAdIntelligenceSchema>;

export type AdLibrarySearch = typeof adLibrarySearches.$inferSelect;
export type InsertAdLibrarySearch = z.infer<typeof insertAdLibrarySearchSchema>;
