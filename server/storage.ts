import {
  users,
  facebookPages,
  generatedContent,
  messengerBots,
  conversations,
  conversationInsights,
  botLearningData,
  analytics,
  adIntelligence,
  adLibrarySearches,
  type User,
  type UpsertUser,
  type FacebookPage,
  type InsertFacebookPage,
  type GeneratedContent,
  type InsertGeneratedContent,
  type MessengerBot,
  type InsertMessengerBot,
  type Conversation,
  type InsertConversation,
  type ConversationInsight,
  type InsertConversationInsight,
  type BotLearningData,
  type InsertBotLearningData,
  type Analytics,
  type InsertAnalytics,
  type AdIntelligence,
  type InsertAdIntelligence,
  type AdLibrarySearch,
  type InsertAdLibrarySearch,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

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

  async searchAdIntelligence(params: {
    userId: string;
    searchTerms?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AdIntelligence[]> {
    const { userId, searchTerms, category, startDate, endDate, limit = 50 } = params;
    
    let query = db
      .select()
      .from(adIntelligence)
      .where(eq(adIntelligence.userId, userId));

    if (searchTerms) {
      // In production, you might use full-text search or better pattern matching
      query = query.where(
        sql`${adIntelligence.adContent} ILIKE '%' || ${searchTerms} || '%' OR ${adIntelligence.pageName} ILIKE '%' || ${searchTerms} || '%'`
      );
    }

    if (category) {
      query = query.where(eq(adIntelligence.adCategory, category));
    }

    if (startDate) {
      query = query.where(gte(adIntelligence.startDate, startDate));
    }

    if (endDate) {
      query = query.where(lte(adIntelligence.endDate, endDate));
    }

    return await query
      .orderBy(desc(adIntelligence.createdAt))
      .limit(limit);
  }

  async getAdsByCategory(userId: string): Promise<{category: string, count: number, totalSpend: number}[]> {
    const results = await db
      .select({
        category: adIntelligence.adCategory,
        count: sql<number>`count(*)::int`,
        totalSpend: sql<number>`sum(${adIntelligence.spend}::numeric)::numeric`
      })
      .from(adIntelligence)
      .where(eq(adIntelligence.userId, userId))
      .groupBy(adIntelligence.adCategory)
      .orderBy(desc(sql`count(*)`));

    return results.map(row => ({
      category: row.category || 'Unknown',
      count: row.count,
      totalSpend: Number(row.totalSpend) || 0
    }));
  }

  async getTopCompetitors(userId: string, limit: number = 10): Promise<{pageName: string, adCount: number, totalSpend: number}[]> {
    const results = await db
      .select({
        pageName: adIntelligence.pageName,
        adCount: sql<number>`count(*)::int`,
        totalSpend: sql<number>`sum(${adIntelligence.spend}::numeric)::numeric`
      })
      .from(adIntelligence)
      .where(eq(adIntelligence.userId, userId))
      .groupBy(adIntelligence.pageName)
      .orderBy(desc(sql`sum(${adIntelligence.spend}::numeric)`))
      .limit(limit);

    return results.map(row => ({
      pageName: row.pageName || 'Unknown',
      adCount: row.adCount,
      totalSpend: Number(row.totalSpend) || 0
    }));
  }

  // Ad Library Search Management
  async createAdLibrarySearch(searchData: InsertAdLibrarySearch): Promise<AdLibrarySearch> {
    const [newSearch] = await db
      .insert(adLibrarySearches)
      .values(searchData)
      .returning();
    return newSearch;
  }

  async getAdLibrarySearches(userId: string): Promise<AdLibrarySearch[]> {
    return await db
      .select()
      .from(adLibrarySearches)
      .where(eq(adLibrarySearches.userId, userId))
      .orderBy(desc(adLibrarySearches.createdAt));
  }

  async updateAdLibrarySearch(searchId: string, updates: Partial<InsertAdLibrarySearch>): Promise<AdLibrarySearch> {
    const [updatedSearch] = await db
      .update(adLibrarySearches)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adLibrarySearches.id, searchId))
      .returning();
    return updatedSearch;
  }

  async deleteAdLibrarySearch(searchId: string): Promise<void> {
    await db.delete(adLibrarySearches).where(eq(adLibrarySearches.id, searchId));
  }

  // AI Learning and Conversation operations
  async storeConversation(conversation: InsertConversation): Promise<Conversation> {
    const [result] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return result;
  }

  async getConversationHistory(pageId: string, conversationId: string, limit: number = 10): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.pageId, pageId),
        eq(conversations.conversationId, conversationId)
      ))
      .orderBy(desc(conversations.createdAt))
      .limit(limit);
  }

  async getPageConversations(pageId: string, limit: number = 100): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.pageId, pageId))
      .orderBy(desc(conversations.createdAt))
      .limit(limit);
  }

  async analyzeConversations(pageId: string): Promise<ConversationInsight | null> {
    // Get recent conversations for analysis
    const recentConversations = await this.getPageConversations(pageId, 500);
    
    if (recentConversations.length === 0) {
      return null;
    }

    // Analyze conversations and create insights
    const totalConversations = recentConversations.length;
    const avgResponseTime = recentConversations
      .filter(c => c.responseTime)
      .reduce((sum, c) => sum + (c.responseTime || 0), 0) / 
      recentConversations.filter(c => c.responseTime).length;

    const avgSatisfaction = recentConversations
      .filter(c => c.userSatisfaction)
      .reduce((sum, c) => sum + (c.userSatisfaction || 0), 0) / 
      recentConversations.filter(c => c.userSatisfaction).length;

    // Collect common intents
    const intents = recentConversations
      .map(c => c.intent)
      .filter(Boolean)
      .reduce((acc: {[key: string]: number}, intent) => {
        acc[intent!] = (acc[intent!] || 0) + 1;
        return acc;
      }, {});

    const commonIntents = Object.entries(intents)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([intent, count]) => ({ intent, count }));

    // Sentiment distribution
    const sentiments = recentConversations
      .map(c => c.sentiment)
      .filter(Boolean)
      .reduce((acc: {[key: string]: number}, sentiment) => {
        acc[sentiment!] = (acc[sentiment!] || 0) + 1;
        return acc;
      }, {});

    const botId = recentConversations[0]?.botId;
    if (!botId) return null;

    const insightData: InsertConversationInsight = {
      pageId,
      botId,
      totalConversations,
      avgResponseTime: avgResponseTime ? parseFloat(avgResponseTime.toFixed(2)) : null,
      avgSatisfaction: avgSatisfaction ? parseFloat(avgSatisfaction.toFixed(2)) : null,
      commonIntents,
      sentimentDistribution: sentiments,
      popularTopics: [],
      improvedResponses: [],
      learningRecommendations: this.generateLearningRecommendations(commonIntents, sentiments),
    };

    const [result] = await db
      .insert(conversationInsights)
      .values(insightData)
      .returning();

    return result;
  }

  private generateLearningRecommendations(intents: any[], sentiments: {[key: string]: number}): string {
    const recommendations = [];
    
    if (intents.length > 0) {
      const topIntent = intents[0];
      recommendations.push(`Focus on improving responses for "${topIntent.intent}" (${topIntent.count} occurrences).`);
    }

    const totalSentiments = Object.values(sentiments).reduce((a, b) => a + b, 0);
    const negativePercentage = ((sentiments.negative || 0) / totalSentiments) * 100;
    
    if (negativePercentage > 20) {
      recommendations.push(`${negativePercentage.toFixed(1)}% of conversations show negative sentiment. Consider improving tone and helpfulness.`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Performance is good. Continue monitoring conversation patterns for optimization opportunities.");
    }

    return recommendations.join(" ");
  }

  async storeLearningData(learningData: InsertBotLearningData): Promise<BotLearningData> {
    const [result] = await db
      .insert(botLearningData)
      .values(learningData)
      .returning();
    return result;
  }

  async getBotLearningData(pageId: string, botId: string): Promise<BotLearningData[]> {
    return await db
      .select()
      .from(botLearningData)
      .where(and(
        eq(botLearningData.pageId, pageId),
        eq(botLearningData.botId, botId),
        eq(botLearningData.isActive, true)
      ))
      .orderBy(desc(botLearningData.responseQuality), desc(botLearningData.usageCount));
  }

  async updateBotLearningStats(botId: string): Promise<void> {
    // Update bot performance statistics
    const botConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.botId, botId));

    const totalConversations = botConversations.length;
    const successfulResponses = botConversations.filter(c => c.messageType === 'bot_response').length;
    const learningScore = successfulResponses > 0 ? (successfulResponses / totalConversations) * 100 : 0;

    await db
      .update(messengerBots)
      .set({
        totalConversations,
        successfulResponses,
        learningScore: parseFloat(learningScore.toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(messengerBots.id, botId));
  }

  async findSimilarLearning(pageId: string, message: string): Promise<BotLearningData | null> {
    // Simple pattern matching - in production, you'd use vector similarity
    const learningData = await this.getBotLearningData(pageId, pageId);
    
    const messageLower = message.toLowerCase();
    
    for (const learning of learningData) {
      const patternLower = learning.questionPattern.toLowerCase();
      
      // Simple keyword matching - could be enhanced with NLP
      if (messageLower.includes(patternLower) || patternLower.includes(messageLower)) {
        // Update usage count
        await db
          .update(botLearningData)
          .set({
            usageCount: learning.usageCount + 1,
            lastUsed: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(botLearningData.id, learning.id));
        
        return learning;
      }
    }
    
    return null;
  }
}

export const storage = new DatabaseStorage();
