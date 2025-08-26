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
import Stripe from "stripe";

// Initialize Stripe if keys are provided
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

      // Generate text content
      if (aiModel === 'gpt-5' || !aiModel) {
        generatedText = await generateContent(prompt, contentType);
      } else {
        // For other AI models, we'd integrate Claude/Perplexity here
        // For now, fallback to OpenAI
        generatedText = await generateContent(prompt, contentType);
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

      const contentData = insertGeneratedContentSchema.parse({
        userId,
        pageId: pageId || null,
        content: generatedText,
        contentType: contentType || 'post',
        aiModel: aiModel || 'gpt-5',
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

  const httpServer = createServer(app);
  return httpServer;
}
