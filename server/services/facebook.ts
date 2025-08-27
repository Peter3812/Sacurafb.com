import axios from 'axios';
import FormData from 'form-data';

const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';

export interface FacebookPageInfo {
  id: string;
  name: string;
  followers_count?: number;
  profile_picture_url?: string;
  access_token: string;
}

export interface FacebookPostResult {
  id: string;
  created_time: string;
  message?: string;
  permalink_url?: string;
}

export interface FacebookEngagementData {
  reach?: number;
  impressions?: number;
  engaged_users?: number;
  post_clicks?: number;
  page_likes?: number;
  page_follows?: number;
}

export class FacebookService {
  /**
   * Get user's Facebook pages with management permissions
   */
  async getUserPages(userAccessToken: string): Promise<FacebookPageInfo[]> {
    try {
      const response = await axios.get(`${FACEBOOK_API_BASE}/me/accounts`, {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,access_token,followers_count,picture{url}',
        },
      });

      return response.data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        followers_count: page.followers_count || 0,
        profile_picture_url: page.picture?.data?.url,
        access_token: page.access_token,
      }));
    } catch (error: any) {
      console.error('Error fetching Facebook pages:', error.response?.data || error.message);
      throw new Error('Failed to fetch Facebook pages');
    }
  }

  /**
   * Publish a text post to a Facebook page
   */
  async publishTextPost(
    pageId: string,
    pageAccessToken: string,
    message: string,
    scheduled?: Date
  ): Promise<FacebookPostResult> {
    try {
      const params: any = {
        access_token: pageAccessToken,
        message: message,
      };

      // Add scheduling if specified
      if (scheduled && scheduled > new Date()) {
        params.published = false;
        params.scheduled_publish_time = Math.floor(scheduled.getTime() / 1000);
      }

      const response = await axios.post(`${FACEBOOK_API_BASE}/${pageId}/feed`, params);

      return {
        id: response.data.id,
        created_time: new Date().toISOString(),
        message: message,
      };
    } catch (error: any) {
      console.error('Error publishing Facebook post:', error.response?.data || error.message);
      throw new Error(`Failed to publish Facebook post: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publish a post with image to Facebook page
   */
  async publishImagePost(
    pageId: string,
    pageAccessToken: string,
    message: string,
    imageUrl: string,
    scheduled?: Date
  ): Promise<FacebookPostResult> {
    try {
      // First, upload the image
      const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
      
      const formData = new FormData();
      formData.append('access_token', pageAccessToken);
      formData.append('source', imageResponse.data);
      formData.append('published', 'false'); // Upload unpublished first

      const photoUpload = await axios.post(
        `${FACEBOOK_API_BASE}/${pageId}/photos`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      const photoId = photoUpload.data.id;

      // Then create the post with the uploaded photo
      const params: any = {
        access_token: pageAccessToken,
        message: message,
        object_attachment: photoId,
      };

      if (scheduled && scheduled > new Date()) {
        params.published = false;
        params.scheduled_publish_time = Math.floor(scheduled.getTime() / 1000);
      }

      const response = await axios.post(`${FACEBOOK_API_BASE}/${pageId}/feed`, params);

      return {
        id: response.data.id,
        created_time: new Date().toISOString(),
        message: message,
      };
    } catch (error: any) {
      console.error('Error publishing Facebook image post:', error.response?.data || error.message);
      throw new Error(`Failed to publish Facebook image post: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get engagement data for a specific post
   */
  async getPostEngagement(postId: string, pageAccessToken: string): Promise<FacebookEngagementData> {
    try {
      const response = await axios.get(`${FACEBOOK_API_BASE}/${postId}/insights`, {
        params: {
          access_token: pageAccessToken,
          metric: 'post_impressions,post_engaged_users,post_clicks,post_reactions_like_total',
        },
      });

      const insights = response.data.data || [];
      const engagement: FacebookEngagementData = {};

      insights.forEach((insight: any) => {
        switch (insight.name) {
          case 'post_impressions':
            engagement.impressions = insight.values?.[0]?.value || 0;
            break;
          case 'post_engaged_users':
            engagement.engaged_users = insight.values?.[0]?.value || 0;
            break;
          case 'post_clicks':
            engagement.post_clicks = insight.values?.[0]?.value || 0;
            break;
          case 'post_reactions_like_total':
            engagement.page_likes = insight.values?.[0]?.value || 0;
            break;
        }
      });

      return engagement;
    } catch (error: any) {
      console.error('Error fetching post engagement:', error.response?.data || error.message);
      // Return empty data instead of throwing to avoid breaking the app
      return {};
    }
  }

  /**
   * Get page insights and metrics
   */
  async getPageInsights(pageId: string, pageAccessToken: string): Promise<FacebookEngagementData> {
    try {
      const response = await axios.get(`${FACEBOOK_API_BASE}/${pageId}/insights`, {
        params: {
          access_token: pageAccessToken,
          metric: 'page_impressions,page_reach,page_engaged_users,page_fan_adds',
          period: 'day',
        },
      });

      const insights = response.data.data || [];
      const metrics: FacebookEngagementData = {};

      insights.forEach((insight: any) => {
        const latestValue = insight.values?.[insight.values.length - 1]?.value || 0;
        
        switch (insight.name) {
          case 'page_impressions':
            metrics.impressions = latestValue;
            break;
          case 'page_reach':
            metrics.reach = latestValue;
            break;
          case 'page_engaged_users':
            metrics.engaged_users = latestValue;
            break;
          case 'page_fan_adds':
            metrics.page_follows = latestValue;
            break;
        }
      });

      return metrics;
    } catch (error: any) {
      console.error('Error fetching page insights:', error.response?.data || error.message);
      return {};
    }
  }

  /**
   * Validate Facebook access token
   */
  async validateAccessToken(accessToken: string): Promise<{ isValid: boolean; userId?: string; scopes?: string[] }> {
    try {
      const response = await axios.get(`${FACEBOOK_API_BASE}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name',
        },
      });

      return {
        isValid: true,
        userId: response.data.id,
      };
    } catch (error: any) {
      return {
        isValid: false,
      };
    }
  }

  /**
   * Get existing posts from a Facebook page
   */
  async getPagePosts(pageId: string, pageAccessToken: string, limit = 10): Promise<any[]> {
    try {
      const response = await axios.get(`${FACEBOOK_API_BASE}/${pageId}/posts`, {
        params: {
          access_token: pageAccessToken,
          fields: 'id,message,created_time,permalink_url,full_picture,reactions.summary(true),comments.summary(true),shares',
          limit: limit,
        },
      });

      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching page posts:', error.response?.data || error.message);
      return [];
    }
  }
}

export const facebookService = new FacebookService();