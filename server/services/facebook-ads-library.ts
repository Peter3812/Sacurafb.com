import axios from 'axios';
import { storage } from '../storage';
import type { InsertAdIntelligence } from '@shared/schema';

interface FacebookAdsLibraryResponse {
  data: FacebookAd[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

interface FacebookAd {
  id: string;
  ad_creation_time: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_titles?: string[];
  ad_delivery_start_time: string;
  ad_delivery_stop_time?: string;
  ad_snapshot_url: string;
  bylines?: string;
  currency: string;
  demographic_distribution?: any[];
  estimated_audience_size?: {
    lower_bound: number;
    upper_bound: number;
  };
  funding_entity?: string;
  impressions?: {
    lower_bound: number;
    upper_bound: number;
  };
  languages?: string[];
  page_id: string;
  page_name: string;
  platforms?: string[];
  publisher_platforms?: string[];
  regions?: any[];
  spend?: {
    lower_bound: number;
    upper_bound: number;
  };
}

export class FacebookAdsLibraryService {
  private baseUrl = 'https://graph.facebook.com/v19.0/ads_archive';
  private accessToken: string;

  constructor() {
    // Note: In production, you would need a valid Facebook access token
    // For development, we'll simulate the API responses
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN || 'demo_token';
  }

  async searchAds(params: {
    searchTerms: string;
    adType?: string;
    countries?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<FacebookAdsLibraryResponse> {
    const {
      searchTerms,
      adType = 'ALL',
      countries = ['US'],
      startDate,
      endDate,
      limit = 100
    } = params;

    // For demo purposes, return simulated data
    // In production, you would make actual API calls to Facebook
    if (this.accessToken === 'demo_token') {
      return this.generateDemoAdsData(searchTerms, limit);
    }

    try {
      const queryParams = new URLSearchParams({
        search_terms: searchTerms,
        ad_type: adType,
        ad_reached_countries: countries.join(','),
        limit: limit.toString(),
        access_token: this.accessToken,
        fields: [
          'id',
          'ad_creation_time',
          'ad_creative_bodies',
          'ad_creative_link_captions',
          'ad_creative_link_descriptions',
          'ad_creative_link_titles',
          'ad_delivery_start_time',
          'ad_delivery_stop_time',
          'ad_snapshot_url',
          'bylines',
          'currency',
          'demographic_distribution',
          'estimated_audience_size',
          'funding_entity',
          'impressions',
          'languages',
          'page_id',
          'page_name',
          'platforms',
          'publisher_platforms',
          'regions',
          'spend'
        ].join(',')
      });

      if (startDate) {
        queryParams.append('ad_delivery_date_min', startDate);
      }
      if (endDate) {
        queryParams.append('ad_delivery_date_max', endDate);
      }

      const response = await axios.get(`${this.baseUrl}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Facebook Ads Library API error:', error);
      throw new Error('Failed to fetch ads from Facebook Ads Library');
    }
  }

  private generateDemoAdsData(searchTerms: string, limit: number): FacebookAdsLibraryResponse {
    const demoAds: FacebookAd[] = [];
    
    // Generate demo ads based on search terms
    const categories = [
      { type: 'E-commerce', keywords: ['shop', 'buy', 'sale', 'product'] },
      { type: 'Technology', keywords: ['tech', 'software', 'app', 'digital'] },
      { type: 'Healthcare', keywords: ['health', 'medical', 'wellness', 'fitness'] },
      { type: 'Education', keywords: ['learn', 'course', 'training', 'education'] },
      { type: 'Finance', keywords: ['bank', 'loan', 'invest', 'money'] }
    ];

    const getCategory = () => {
      const lower = searchTerms.toLowerCase();
      for (const cat of categories) {
        if (cat.keywords.some(keyword => lower.includes(keyword))) {
          return cat.type;
        }
      }
      return 'General';
    };

    const category = getCategory();
    const numAds = Math.min(limit, Math.floor(Math.random() * 20) + 5);

    for (let i = 0; i < numAds; i++) {
      const adId = `demo_ad_${Date.now()}_${i}`;
      const pageId = `page_${Math.floor(Math.random() * 1000)}`;
      const pageName = `${category} Company ${i + 1}`;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 15) + 1);

      demoAds.push({
        id: adId,
        ad_creation_time: startDate.toISOString(),
        ad_creative_bodies: [
          `Discover amazing ${searchTerms} solutions that will transform your business. Join thousands of satisfied customers today!`,
          `Limited time offer on ${searchTerms}! Don't miss out on this exclusive opportunity.`
        ],
        ad_creative_link_titles: [`Best ${searchTerms} Solutions 2024`],
        ad_creative_link_descriptions: [`Professional ${searchTerms} services with guaranteed results`],
        ad_delivery_start_time: startDate.toISOString(),
        ad_delivery_stop_time: Math.random() > 0.3 ? endDate.toISOString() : undefined,
        ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${adId}`,
        bylines: `Paid for by ${pageName}`,
        currency: 'USD',
        demographic_distribution: [
          { age: '25-34', gender: 'male', percentage: 0.3 },
          { age: '25-34', gender: 'female', percentage: 0.25 },
          { age: '35-44', gender: 'male', percentage: 0.25 },
          { age: '35-44', gender: 'female', percentage: 0.2 }
        ],
        estimated_audience_size: {
          lower_bound: Math.floor(Math.random() * 50000) + 10000,
          upper_bound: Math.floor(Math.random() * 100000) + 60000
        },
        funding_entity: pageName,
        impressions: {
          lower_bound: Math.floor(Math.random() * 100000) + 50000,
          upper_bound: Math.floor(Math.random() * 200000) + 150000
        },
        languages: ['en'],
        page_id: pageId,
        page_name: pageName,
        platforms: ['Facebook', 'Instagram'],
        publisher_platforms: ['facebook', 'instagram'],
        regions: [
          { name: 'United States', percentage: 0.7 },
          { name: 'Canada', percentage: 0.2 },
          { name: 'United Kingdom', percentage: 0.1 }
        ],
        spend: {
          lower_bound: Math.floor(Math.random() * 5000) + 1000,
          upper_bound: Math.floor(Math.random() * 10000) + 6000
        }
      });
    }

    return {
      data: demoAds,
      paging: {
        cursors: {
          before: 'demo_before_cursor',
          after: 'demo_after_cursor'
        }
      }
    };
  }

  async storeAdsIntelligence(userId: string, adsData: FacebookAd[]): Promise<void> {
    for (const ad of adsData) {
      try {
        const adIntelligenceData: InsertAdIntelligence = {
          userId,
          adId: ad.id,
          pageId: ad.page_id,
          pageName: ad.page_name,
          adContent: ad.ad_creative_bodies?.[0] || '',
          adImageUrl: null, // Would need to extract from ad_snapshot_url
          adVideoUrl: null,
          adType: 'ALL',
          adCategory: this.categorizeAd(ad),
          startDate: new Date(ad.ad_delivery_start_time),
          endDate: ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : null,
          isActive: !ad.ad_delivery_stop_time,
          spend: ad.spend ? ad.spend.lower_bound.toString() : '0',
          impressions: ad.impressions?.lower_bound || 0,
          targetAudience: {
            estimated_size: ad.estimated_audience_size,
            demographic_distribution: ad.demographic_distribution || []
          },
          demographicDistribution: ad.demographic_distribution || {},
          countries: ['US'], // Would extract from regions
          regions: ad.regions || [],
          platforms: ad.platforms || [],
          funding: ad.funding_entity || '',
          disclaimer: ad.bylines || '',
          adLibraryUrl: ad.ad_snapshot_url,
          currency: ad.currency || 'USD',
          estimatedAudience: ad.estimated_audience_size || {}
        };

        await storage.createAdIntelligence(adIntelligenceData);
      } catch (error) {
        console.error('Error storing ad intelligence:', error);
        // Continue with next ad even if one fails
      }
    }
  }

  private categorizeAd(ad: FacebookAd): string {
    const content = (ad.ad_creative_bodies?.[0] || '').toLowerCase();
    const title = (ad.ad_creative_link_titles?.[0] || '').toLowerCase();
    const description = (ad.ad_creative_link_descriptions?.[0] || '').toLowerCase();
    
    const allText = `${content} ${title} ${description}`;

    if (allText.includes('shop') || allText.includes('buy') || allText.includes('sale')) {
      return 'E-commerce';
    }
    if (allText.includes('tech') || allText.includes('software') || allText.includes('app')) {
      return 'Technology';
    }
    if (allText.includes('health') || allText.includes('medical') || allText.includes('wellness')) {
      return 'Healthcare';
    }
    if (allText.includes('learn') || allText.includes('course') || allText.includes('education')) {
      return 'Education';
    }
    if (allText.includes('bank') || allText.includes('loan') || allText.includes('invest')) {
      return 'Finance';
    }
    
    return 'General';
  }

  async getAdInsights(adId: string): Promise<any> {
    // In production, this would fetch detailed insights from Facebook API
    // For demo, return simulated insights
    return {
      reach: Math.floor(Math.random() * 100000) + 50000,
      frequency: (Math.random() * 3 + 1).toFixed(2),
      ctr: (Math.random() * 2 + 0.5).toFixed(3),
      cpc: (Math.random() * 2 + 0.5).toFixed(2),
      cpm: (Math.random() * 10 + 5).toFixed(2),
      engagement_rate: (Math.random() * 5 + 1).toFixed(2),
      video_views: Math.floor(Math.random() * 50000) + 10000,
      link_clicks: Math.floor(Math.random() * 5000) + 1000
    };
  }
}

export const facebookAdsLibraryService = new FacebookAdsLibraryService();