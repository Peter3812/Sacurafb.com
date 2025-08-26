import {
  users,
  facebookPages,
  generatedContent,
  messengerBots,
  analytics,
  adIntelligence,
  type User,
  type UpsertUser,
  type FacebookPage,
  type InsertFacebookPage,
  type GeneratedContent,
  type InsertGeneratedContent,
  type MessengerBot,
  type InsertMessengerBot,
  type Analytics,
  type InsertAnalytics,
  type AdIntelligence,
  type InsertAdIntelligence,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  
  // Facebook Pages
  getFacebookPages(userId: string): Promise<FacebookPage[]>;
  getFacebookPage(id: string): Promise<FacebookPage | undefined>;
  createFacebookPage(page: InsertFacebookPage): Promise<FacebookPage>;
  updateFacebookPage(id: string, updates: Partial<InsertFacebookPage>): Promise<FacebookPage>;
  deleteFacebookPage(id: string): Promise<void>;
  
  // Generated Content
  getGeneratedContent(userId: string, limit?: number): Promise<GeneratedContent[]>;
  getGeneratedContentById(id: string): Promise<GeneratedContent | undefined>;
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  updateGeneratedContent(id: string, updates: Partial<InsertGeneratedContent>): Promise<GeneratedContent>;
  deleteGeneratedContent(id: string): Promise<void>;
  getScheduledContent(): Promise<GeneratedContent[]>;
  
  // Messenger Bots
  getMessengerBot(pageId: string): Promise<MessengerBot | undefined>;
  createMessengerBot(bot: InsertMessengerBot): Promise<MessengerBot>;
  updateMessengerBot(pageId: string, updates: Partial<InsertMessengerBot>): Promise<MessengerBot>;
  
  // Analytics
  getAnalytics(pageId: string, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getDashboardStats(userId: string): Promise<{
    totalPosts: number;
    totalPages: number;
    totalReach: number;
    totalEngagement: number;
    avgEngagementRate: number;
    totalSpend: number;
  }>;
  
  // Ad Intelligence
  getAdIntelligence(userId: string, limit?: number): Promise<AdIntelligence[]>;
  createAdIntelligence(adData: InsertAdIntelligence): Promise<AdIntelligence>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Facebook Pages
  async getFacebookPages(userId: string): Promise<FacebookPage[]> {
    return await db
      .select()
      .from(facebookPages)
      .where(eq(facebookPages.userId, userId))
      .orderBy(desc(facebookPages.createdAt));
  }

  async getFacebookPage(id: string): Promise<FacebookPage | undefined> {
    const [page] = await db
      .select()
      .from(facebookPages)
      .where(eq(facebookPages.id, id));
    return page;
  }

  async createFacebookPage(page: InsertFacebookPage): Promise<FacebookPage> {
    const [newPage] = await db
      .insert(facebookPages)
      .values(page)
      .returning();
    return newPage;
  }

  async updateFacebookPage(id: string, updates: Partial<InsertFacebookPage>): Promise<FacebookPage> {
    const [page] = await db
      .update(facebookPages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(facebookPages.id, id))
      .returning();
    return page;
  }

  async deleteFacebookPage(id: string): Promise<void> {
    await db.delete(facebookPages).where(eq(facebookPages.id, id));
  }

  // Generated Content
  async getGeneratedContent(userId: string, limit = 50): Promise<GeneratedContent[]> {
    return await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.userId, userId))
      .orderBy(desc(generatedContent.createdAt))
      .limit(limit);
  }

  async getGeneratedContentById(id: string): Promise<GeneratedContent | undefined> {
    const [content] = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.id, id));
    return content;
  }

  async createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent> {
    const [newContent] = await db
      .insert(generatedContent)
      .values(content)
      .returning();
    return newContent;
  }

  async updateGeneratedContent(id: string, updates: Partial<InsertGeneratedContent>): Promise<GeneratedContent> {
    const [content] = await db
      .update(generatedContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(generatedContent.id, id))
      .returning();
    return content;
  }

  async deleteGeneratedContent(id: string): Promise<void> {
    await db.delete(generatedContent).where(eq(generatedContent.id, id));
  }

  async getScheduledContent(): Promise<GeneratedContent[]> {
    const now = new Date();
    return await db
      .select()
      .from(generatedContent)
      .where(
        and(
          eq(generatedContent.status, "scheduled"),
          lte(generatedContent.scheduledAt, now)
        )
      );
  }

  // Messenger Bots
  async getMessengerBot(pageId: string): Promise<MessengerBot | undefined> {
    const [bot] = await db
      .select()
      .from(messengerBots)
      .where(eq(messengerBots.pageId, pageId));
    return bot;
  }

  async createMessengerBot(bot: InsertMessengerBot): Promise<MessengerBot> {
    const [newBot] = await db
      .insert(messengerBots)
      .values(bot)
      .returning();
    return newBot;
  }

  async updateMessengerBot(pageId: string, updates: Partial<InsertMessengerBot>): Promise<MessengerBot> {
    const [bot] = await db
      .update(messengerBots)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(messengerBots.pageId, pageId))
      .returning();
    return bot;
  }

  // Analytics
  async getAnalytics(pageId: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    let query = db
      .select()
      .from(analytics)
      .where(eq(analytics.pageId, pageId));

    if (startDate && endDate) {
      return await db
        .select()
        .from(analytics)
        .where(
          and(
            eq(analytics.pageId, pageId),
            gte(analytics.date, startDate),
            lte(analytics.date, endDate)
          )
        )
        .orderBy(desc(analytics.date));
    }

    return await query.orderBy(desc(analytics.date));
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [newAnalytics] = await db
      .insert(analytics)
      .values(analyticsData)
      .returning();
    return newAnalytics;
  }

  async getDashboardStats(userId: string): Promise<{
    totalPosts: number;
    totalPages: number;
    totalReach: number;
    totalEngagement: number;
    avgEngagementRate: number;
    totalSpend: number;
  }> {
    // Get user's pages
    const userPages = await db
      .select()
      .from(facebookPages)
      .where(eq(facebookPages.userId, userId));

    const pageIds = userPages.map(page => page.id);

    // Get total posts
    const totalPostsResult = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.userId, userId));

    // Get analytics for all user pages
    let totalReach = 0;
    let totalEngagement = 0;
    let totalSpend = 0;

    if (pageIds.length > 0) {
      const analyticsData = await db
        .select()
        .from(analytics)
        .where(
          and(
            gte(analytics.date, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
          )
        );

      totalReach = analyticsData.reduce((sum, a) => sum + (a.reach || 0), 0);
      totalEngagement = analyticsData.reduce((sum, a) => sum + (a.engagements || 0), 0);
      totalSpend = analyticsData.reduce((sum, a) => sum + parseFloat(a.spend || "0"), 0);
    }

    const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    return {
      totalPosts: totalPostsResult.length,
      totalPages: userPages.length,
      totalReach,
      totalEngagement,
      avgEngagementRate,
      totalSpend,
    };
  }

  // Ad Intelligence
  async getAdIntelligence(userId: string, limit = 50): Promise<AdIntelligence[]> {
    return await db
      .select()
      .from(adIntelligence)
      .where(eq(adIntelligence.userId, userId))
      .orderBy(desc(adIntelligence.createdAt))
      .limit(limit);
  }

  async createAdIntelligence(adData: InsertAdIntelligence): Promise<AdIntelligence> {
    const [newAd] = await db
      .insert(adIntelligence)
      .values(adData)
      .returning();
    return newAd;
  }
}

export const storage = new DatabaseStorage();
