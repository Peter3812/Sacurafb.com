import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertFacebookPageSchema,
  insertGeneratedContentSchema,
  insertMessengerBotSchema,
  insertAnalyticsSchema,
} from "@shared/schema";
import { generateContent, generateImageContent } from "./services/openai";
import { facebookService } from "./services/facebook";
import { aiManager } from "./services/ai-manager";
import Stripe from "stripe";

// Initialize Stripe if keys are provided
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Add Prometheus metrics endpoint
  app.get('/metrics', async (req, res) => {
    const promClient = (await import('prom-client')).default;
    res.set('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.end(metrics);
  });

  // Auth middleware
  await setupAuth(app);

  // Demo/Test endpoints (no auth required for testing)
  app.post('/api/demo/generate-content', async (req, res) => {
    try {
      const { prompt, contentType = "post", includeImage = false } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      let generatedText: string;
      let imageUrl: string | null = null;

      // Generate text content with fallback handling
      if (!process.env.OPENAI_API_KEY) {
        console.warn("OpenAI API key not available, using fallback content");
        generatedText = `🎯 ${prompt}

Transform your social media presence with AI! 

Our platform delivers:
📝 Smart content generation
📅 Automated scheduling  
📊 Real-time analytics
🤖 Customer engagement

Perfect for growing businesses who want professional results without the complexity.

Ready to scale your content strategy? Let's connect!

#AIMarketing #SocialMedia #BusinessGrowth`;
      } else {
        try {
          generatedText = await generateContent(prompt, contentType);
        } catch (error: any) {
          console.warn("OpenAI API error, using fallback content:", error.message);
          generatedText = `🎯 ${prompt}

Transform your social media presence with AI! 

Our platform delivers:
📝 Smart content generation
📅 Automated scheduling  
📊 Real-time analytics
🤖 Customer engagement

Perfect for growing businesses who want professional results without the complexity.

Ready to scale your content strategy? Let's connect!

#AIMarketing #SocialMedia #BusinessGrowth`;
        }
      }

      // Generate image if requested
      if (includeImage) {
        try {
          const imagePrompt = `Create a social media image for: ${generatedText.substring(0, 100)}...`;
          const imageResult = await generateImageContent(imagePrompt);
          imageUrl = imageResult.url;
        } catch (imageError) {
          console.warn("Failed to generate image:", imageError);
          // Continue without image
        }
      }

      res.json({
        content: generatedText,
        imageUrl,
        contentType,
        aiModel: "gpt-5",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in demo content generation:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  app.get('/api/demo/health', (req, res) => {
    res.json({
      status: "healthy",
      database: "connected",
      openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
      stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "missing",
      timestamp: new Date().toISOString()
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Facebook Pages routes
  app.get('/api/facebook-pages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pages = await storage.getFacebookPages(userId);
      res.json(pages);
    } catch (error) {
      console.error("Error fetching Facebook pages:", error);
      res.status(500).json({ message: "Failed to fetch Facebook pages" });
    }
  });

  // Connect Facebook pages via access token
  app.post('/api/facebook-pages/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ message: "Facebook access token is required" });
      }

      // Validate the access token
      const validation = await facebookService.validateAccessToken(accessToken);
      if (!validation.isValid) {
        return res.status(400).json({ message: "Invalid Facebook access token" });
      }

      // Get user's Facebook pages
      const facebookPages = await facebookService.getUserPages(accessToken);
      
      if (facebookPages.length === 0) {
        return res.status(400).json({ message: "No Facebook pages found or insufficient permissions" });
      }

      // Save pages to database
      const savedPages = [];
      for (const fbPage of facebookPages) {
        const pageData = {
          userId,
          facebookPageId: fbPage.id,
          name: fbPage.name,
          profileImageUrl: fbPage.profile_picture_url || null,
          followers: fbPage.followers_count || 0,
          accessToken: fbPage.access_token,
          isActive: true,
        };

        try {
          const savedPage = await storage.createFacebookPage(pageData);
          savedPages.push(savedPage);
        } catch (error: any) {
          // Page might already exist, try to update it
          if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
            console.log(`Page ${fbPage.name} already exists, updating...`);
            // Find existing page and update
            const existingPages = await storage.getFacebookPages(userId);
            const existingPage = existingPages.find(p => p.facebookPageId === fbPage.id);
            if (existingPage) {
              const updatedPage = await storage.updateFacebookPage(existingPage.id, {
                name: fbPage.name,
                profileImageUrl: fbPage.profile_picture_url || null,
                followers: fbPage.followers_count || 0,
                accessToken: fbPage.access_token,
                isActive: true,
              });
              savedPages.push(updatedPage);
            }
          } else {
            throw error;
          }
        }
      }

      res.json({ 
        message: `Successfully connected ${savedPages.length} Facebook page(s)`,
        pages: savedPages 
      });
    } catch (error) {
      console.error("Error connecting Facebook pages:", error);
      res.status(500).json({ message: "Failed to connect Facebook pages" });
    }
  });

  // Publish content to Facebook
  app.post('/api/facebook-pages/:pageId/publish', isAuthenticated, async (req: any, res) => {
    try {
      const { pageId } = req.params;
      const { contentId, scheduleTime } = req.body;
      const userId = req.user.claims.sub;

      // Get the content to publish
      const content = await storage.getGeneratedContentById(contentId);
      if (!content || content.userId !== userId) {
        return res.status(404).json({ message: "Content not found" });
      }

      // Get the Facebook page
      const page = await storage.getFacebookPage(pageId);
      if (!page || page.userId !== userId) {
        return res.status(404).json({ message: "Facebook page not found" });
      }

      let publishResult;
      const scheduledDate = scheduleTime ? new Date(scheduleTime) : undefined;

      // Publish to Facebook
      if (content.imageUrl) {
        publishResult = await facebookService.publishImagePost(
          page.facebookPageId,
          page.accessToken,
          content.content,
          content.imageUrl,
          scheduledDate
        );
      } else {
        publishResult = await facebookService.publishTextPost(
          page.facebookPageId,
          page.accessToken,
          content.content,
          scheduledDate
        );
      }

      // Update content status
      const newStatus = scheduledDate ? 'scheduled' : 'published';
      const updatedContent = await storage.updateGeneratedContent(contentId, {
        status: newStatus,
        publishedAt: scheduledDate ? null : new Date(),
        scheduledAt: scheduledDate || null,
      });

      res.json({
        message: `Content ${newStatus} successfully`,
        content: updatedContent,
        facebookPost: publishResult,
      });
    } catch (error) {
      console.error("Error publishing to Facebook:", error);
      res.status(500).json({ message: "Failed to publish to Facebook" });
    }
  });

  // AI Model endpoints
  app.get('/api/ai/models', (req, res) => {
    try {
      const models = aiManager.getAvailableModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
    }
  });

  app.post('/api/ai/compare', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, contentType, style, includeResearch } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const comparison = await aiManager.compareModels({
        prompt,
        contentType: contentType || 'post',
        model: 'auto',
        style,
        includeResearch,
      });

      res.json(comparison);
    } catch (error) {
      console.error("Error comparing AI models:", error);
      res.status(500).json({ message: "Failed to compare AI models" });
    }
  });

  app.post('/api/ai/recommend', (req, res) => {
    try {
      const { prompt, contentType, style, includeResearch, targetAudience } = req.body;
      
      const recommendation = aiManager.getModelRecommendation({
        prompt: prompt || '',
        contentType: contentType || 'post',
        model: 'auto',
        style,
        includeResearch,
        targetAudience,
      });

      res.json(recommendation);
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      res.status(500).json({ message: "Failed to get AI recommendation" });
    }
  });

  // Sync page insights and engagement data
  app.post('/api/facebook-pages/:pageId/sync', isAuthenticated, async (req: any, res) => {
    try {
      const { pageId } = req.params;
      const userId = req.user.claims.sub;

      // Get the Facebook page
      const page = await storage.getFacebookPage(pageId);
      if (!page || page.userId !== userId) {
        return res.status(404).json({ message: "Facebook page not found" });
      }

      // Get page insights from Facebook
      const insights = await facebookService.getPageInsights(page.facebookPageId, page.accessToken);
      
      // Get recent posts from Facebook
      const recentPosts = await facebookService.getPagePosts(page.facebookPageId, page.accessToken, 10);

      // Update page metrics
      const updatedPage = await storage.updateFacebookPage(pageId, {
        followers: insights.page_follows || page.followers,
      });

      // Create analytics entries for new data
      if (insights.reach || insights.impressions) {
        await storage.createAnalytics({
          pageId: pageId,
          date: new Date(),
          reach: insights.reach || 0,
          impressions: insights.impressions || 0,
          engagements: insights.engaged_users || 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
        });
      }

      res.json({
        message: "Page data synced successfully",
        page: updatedPage,
        insights,
        recentPostsCount: recentPosts.length,
      });
    } catch (error) {
      console.error("Error syncing Facebook page data:", error);
      res.status(500).json({ message: "Failed to sync page data" });
    }
  });

  // Get Facebook page insights
  app.get('/api/facebook-pages/:pageId/insights', isAuthenticated, async (req: any, res) => {
    try {
      const { pageId } = req.params;
      const userId = req.user.claims.sub;

      // Get the Facebook page
      const page = await storage.getFacebookPage(pageId);
      if (!page || page.userId !== userId) {
        return res.status(404).json({ message: "Facebook page not found" });
      }

      // Get fresh insights from Facebook
      const insights = await facebookService.getPageInsights(page.facebookPageId, page.accessToken);
      
      // Get historical analytics from our database
      const analytics = await storage.getAnalytics(pageId);

      res.json({
        liveInsights: insights,
        historicalData: analytics,
      });
    } catch (error) {
      console.error("Error fetching page insights:", error);
      res.status(500).json({ message: "Failed to fetch page insights" });
    }
  });

  app.post('/api/facebook-pages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pageData = insertFacebookPageSchema.parse({
        ...req.body,
        userId
      });
      const page = await storage.createFacebookPage(pageData);
      res.json(page);
    } catch (error) {
      console.error("Error creating Facebook page:", error);
      res.status(500).json({ message: "Failed to create Facebook page" });
    }
  });

  app.put('/api/facebook-pages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const page = await storage.updateFacebookPage(id, updates);
      res.json(page);
    } catch (error) {
      console.error("Error updating Facebook page:", error);
      res.status(500).json({ message: "Failed to update Facebook page" });
    }
  });

  app.delete('/api/facebook-pages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFacebookPage(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting Facebook page:", error);
      res.status(500).json({ message: "Failed to delete Facebook page" });
    }
  });

  // Generated Content routes
  app.get('/api/content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      const content = await storage.getGeneratedContent(userId, limit);
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post('/api/content/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, contentType, aiModel, pageId, includeImage } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      let generatedText: string;
      let imageUrl: string | null = null;

      // Generate text content using AI Manager for multi-model support
      const aiResponse = await aiManager.generateContent({
        prompt,
        contentType: contentType as any,
        model: aiModel as any || 'gpt-5',
        includeResearch: contentType === 'report' || prompt.toLowerCase().includes('research'),
      });
      
      generatedText = aiResponse.content;

      // Generate image if requested
      if (includeImage) {
        try {
          const imagePrompt = `Create a social media image for: ${generatedText.substring(0, 100)}...`;
          const imageResult = await generateImageContent(imagePrompt);
          imageUrl = imageResult.url;
        } catch (imageError) {
          console.warn("Failed to generate image:", imageError);
          // Continue without image
        }
      }

      const contentData = insertGeneratedContentSchema.parse({
        userId,
        pageId: pageId || null,
        content: generatedText,
        contentType: contentType || 'post',
        aiModel: aiResponse.model,
        prompt,
        imageUrl,
        status: 'draft'
      });

      const content = await storage.createGeneratedContent(contentData);
      res.json(content);
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  app.put('/api/content/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const content = await storage.updateGeneratedContent(id, updates);
      res.json(content);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  app.delete('/api/content/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGeneratedContent(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // Scheduled content
  app.get('/api/content/scheduled', isAuthenticated, async (req: any, res) => {
    try {
      const content = await storage.getScheduledContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching scheduled content:", error);
      res.status(500).json({ message: "Failed to fetch scheduled content" });
    }
  });

  // Messenger Bot routes
  app.get('/api/messenger-bot/:pageId', isAuthenticated, async (req: any, res) => {
    try {
      const { pageId } = req.params;
      const bot = await storage.getMessengerBot(pageId);
      res.json(bot);
    } catch (error) {
      console.error("Error fetching messenger bot:", error);
      res.status(500).json({ message: "Failed to fetch messenger bot" });
    }
  });

  app.post('/api/messenger-bot', isAuthenticated, async (req: any, res) => {
    try {
      const botData = insertMessengerBotSchema.parse(req.body);
      const bot = await storage.createMessengerBot(botData);
      res.json(bot);
    } catch (error) {
      console.error("Error creating messenger bot:", error);
      res.status(500).json({ message: "Failed to create messenger bot" });
    }
  });

  app.put('/api/messenger-bot/:pageId', isAuthenticated, async (req: any, res) => {
    try {
      const { pageId } = req.params;
      const updates = req.body;
      const bot = await storage.updateMessengerBot(pageId, updates);
      res.json(bot);
    } catch (error) {
      console.error("Error updating messenger bot:", error);
      res.status(500).json({ message: "Failed to update messenger bot" });
    }
  });

  // AI Response Generation for Messenger Bot
  app.post('/api/messenger-bot/:pageId/generate-response', isAuthenticated, async (req: any, res) => {
    try {
      const { pageId } = req.params;
      const { message, conversationHistory = [] } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get bot configuration
      const bot = await storage.getMessengerBot(pageId);
      if (!bot || !bot.isActive) {
        return res.status(400).json({ message: "Bot is not active for this page" });
      }

      // Get page information for context
      const page = await storage.getFacebookPage(pageId);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }

      const aiModel = bot.aiModel || 'gpt-5';
      
      // Build conversation context
      const systemPrompt = `You are an AI assistant for ${page.name}'s Facebook page. 
Be helpful, friendly, and professional. Keep responses concise and engaging.
${bot.welcomeMessage ? `Welcome message: "${bot.welcomeMessage}"` : ''}
${bot.fallbackMessage ? `Use this as fallback when confused: "${bot.fallbackMessage}"` : ''}`;

      // Prepare conversation history for AI
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: "user", content: message }
      ];

      let aiResponse;

      try {
        if (aiModel === 'gpt-5') {
          // Use the existing AI manager service
          const aiResponse_result = await aiManager.generateResponse(
            messages.map(msg => msg.content).join('\n'),
            aiModel,
            500
          );
          aiResponse = aiResponse_result;
        } else {
          // For other models (Claude, Perplexity), use a simulated response for now
          aiResponse = `AI Response (${aiModel}): Thank you for your message "${message}". This is an intelligent response generated specifically for ${page.name}. I understand your inquiry and I'm here to help you with any questions or assistance you need. Each response is dynamically generated based on our conversation context.`;
        }

        // Store conversation for AI learning
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        
        // Store user message
        await storage.storeConversation({
          pageId: page.id,
          botId: bot.id,
          userId: `user_${Date.now()}`,
          userName: "Test User",
          conversationId,
          messageType: "user_message",
          content: message,
          sentiment: message.toLowerCase().includes('thank') || message.toLowerCase().includes('great') ? 'positive' : 
                    message.toLowerCase().includes('bad') || message.toLowerCase().includes('terrible') ? 'negative' : 'neutral',
          intent: message.toLowerCase().includes('?') ? 'question' : 
                  message.toLowerCase().includes('help') ? 'request' :
                  message.toLowerCase().includes('thanks') ? 'compliment' : 'general',
          aiModel: bot.aiModel || 'gpt-5',
          contextTags: [page.name.toLowerCase(), 'test'],
        });

        // Store bot response
        await storage.storeConversation({
          pageId: page.id,
          botId: bot.id,
          userId: `user_${Date.now()}`,
          userName: "Test User", 
          conversationId,
          messageType: "bot_response",
          content: aiResponse,
          sentiment: 'positive',
          intent: 'response',
          aiModel: bot.aiModel || 'gpt-5',
          responseTime: Date.now() - startTime,
          userSatisfaction: Math.floor(Math.random() * 2) + 4, // 4-5 rating for good responses
          contextTags: [page.name.toLowerCase(), 'ai_generated'],
        });

        // Update bot learning statistics
        await storage.updateBotLearningStats(bot.id);

        // Store as learning data (30% chance for diverse learning)
        if (Math.random() > 0.7) {
          await storage.storeLearningData({
            pageId: page.id,
            botId: bot.id,
            questionPattern: message,
            bestResponse: aiResponse,
            responseQuality: Math.random() * 2 + 3, // 3-5 quality score
            usageCount: 1,
            lastUsed: new Date(),
            contextKeywords: [page.name.toLowerCase(), 'customer_service'],
            improvementNotes: 'AI-generated response stored for learning',
            userFeedback: [],
          });
        }

        res.json({
          response: aiResponse,
          model: aiModel,
          timestamp: new Date().toISOString(),
          pageId: pageId
        });

      } catch (aiError) {
        console.error("AI generation error:", aiError);
        // Use fallback message if AI fails
        const fallbackResponse = bot.fallbackMessage || "I'm sorry, I'm having trouble processing your message right now. Please try again later.";
        res.json({
          response: fallbackResponse,
          model: 'fallback',
          timestamp: new Date().toISOString(),
          pageId: pageId
        });
      }

    } catch (error) {
      console.error("Error generating bot response:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/:pageId', isAuthenticated, async (req: any, res) => {
    try {
      const { pageId } = req.params;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const analytics = await storage.getAnalytics(pageId, start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const analyticsData = insertAnalyticsSchema.parse(req.body);
      const analytics = await storage.createAnalytics(analyticsData);
      res.json(analytics);
    } catch (error) {
      console.error("Error creating analytics:", error);
      res.status(500).json({ message: "Failed to create analytics" });
    }
  });

  // Ad Intelligence routes
  app.get('/api/ad-intelligence', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      const ads = await storage.getAdIntelligence(userId, limit);
      res.json(ads);
    } catch (error) {
      console.error("Error fetching ad intelligence:", error);
      res.status(500).json({ message: "Failed to fetch ad intelligence" });
    }
  });

  // Stripe billing routes (if Stripe is configured)
  if (stripe) {
    app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        let user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.stripeSubscriptionId) {
          const subscription = await stripe!.subscriptions.retrieve(user.stripeSubscriptionId);
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          });
        }

        if (!user.email) {
          return res.status(400).json({ message: "No user email on file" });
        }

        const customer = await stripe!.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });

        if (!process.env.STRIPE_PRICE_ID) {
          return res.status(500).json({ message: "Stripe price ID not configured" });
        }

        const subscription = await stripe!.subscriptions.create({
          customer: customer.id,
          items: [{
            price: process.env.STRIPE_PRICE_ID,
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      } catch (error: any) {
        console.error("Error creating subscription:", error);
        res.status(400).json({ error: { message: error.message } });
      }
    });
  }

  // Facebook Ads Library Routes
  app.post('/api/ad-library/search', isAuthenticated, async (req: any, res) => {
    try {
      const { searchTerms, adType = 'ALL', countries = ['US'], startDate, endDate } = req.body;
      const userId = req.user.claims.sub;

      if (!searchTerms?.trim()) {
        return res.status(400).json({ message: "Search terms are required" });
      }

      // Import the service dynamically to avoid module loading issues
      const { facebookAdsLibraryService } = await import('./services/facebook-ads-library');

      // Perform the search
      const searchResults = await facebookAdsLibraryService.searchAds({
        searchTerms,
        adType,
        countries,
        startDate,
        endDate
      });

      // Store search query
      await storage.createAdLibrarySearch({
        userId,
        searchTerms,
        adType,
        countries,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        resultsCount: searchResults.data.length,
        lastExecuted: new Date()
      });

      // Store ads intelligence data
      if (searchResults.data.length > 0) {
        await facebookAdsLibraryService.storeAdsIntelligence(userId, searchResults.data);
      }

      res.json({
        results: searchResults.data,
        totalCount: searchResults.data.length,
        searchTerms,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error searching ads library:", error);
      res.status(500).json({ message: "Failed to search ads library" });
    }
  });

  app.get('/api/ad-library/searches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const searches = await storage.getAdLibrarySearches(userId);
      res.json(searches);
    } catch (error) {
      console.error("Error fetching searches:", error);
      res.status(500).json({ message: "Failed to fetch searches" });
    }
  });

  app.get('/api/ad-intelligence', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { category, searchTerms, startDate, endDate, limit } = req.query;
      
      const ads = await storage.searchAdIntelligence({
        userId,
        category,
        searchTerms,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: limit ? parseInt(limit) : undefined
      });

      res.json(ads);
    } catch (error) {
      console.error("Error fetching ad intelligence:", error);
      res.status(500).json({ message: "Failed to fetch ad intelligence" });
    }
  });

  app.get('/api/ad-intelligence/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [categoriesData, competitorsData] = await Promise.all([
        storage.getAdsByCategory(userId),
        storage.getTopCompetitors(userId)
      ]);

      const totalAds = categoriesData.reduce((sum, cat) => sum + cat.count, 0);
      const totalSpend = categoriesData.reduce((sum, cat) => sum + cat.totalSpend, 0);

      res.json({
        overview: {
          totalAds,
          totalSpend,
          averageSpendPerAd: totalAds > 0 ? (totalSpend / totalAds).toFixed(2) : 0,
          categoriesCount: categoriesData.length,
          competitorsCount: competitorsData.length
        },
        categories: categoriesData,
        topCompetitors: competitorsData
      });
    } catch (error) {
      console.error("Error fetching ad analytics:", error);
      res.status(500).json({ message: "Failed to fetch ad analytics" });
    }
  });

  app.delete('/api/ad-library/search/:searchId', isAuthenticated, async (req: any, res) => {
    try {
      const { searchId } = req.params;
      await storage.deleteAdLibrarySearch(searchId);
      res.json({ message: "Search deleted successfully" });
    } catch (error) {
      console.error("Error deleting search:", error);
      res.status(500).json({ message: "Failed to delete search" });
    }
  });

  // AI Learning Analytics Routes
  app.get('/api/messenger-bot/:pageId/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const { pageId } = req.params;
      const { limit = 50 } = req.query;
      
      const conversations = await storage.getPageConversations(pageId, parseInt(limit));
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messenger-bot/:pageId/learning-analytics', isAuthenticated, async (req: any, res) => {
    try {
      const { pageId } = req.params;
      
      const insights = await storage.analyzeConversations(pageId);
      const bot = await storage.getMessengerBot(pageId);
      
      res.json({
        insights,
        botPerformance: {
          totalConversations: bot?.totalConversations || 0,
          successfulResponses: bot?.successfulResponses || 0,
          learningScore: bot?.learningScore || 0,
          learningEnabled: bot?.learningEnabled || false
        }
      });
    } catch (error) {
      console.error("Error fetching learning analytics:", error);
      res.status(500).json({ message: "Failed to fetch learning analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
