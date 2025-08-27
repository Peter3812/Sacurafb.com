import axios from 'axios';

const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';

export interface FacebookOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface FacebookAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface FacebookUserInfo {
  id: string;
  name: string;
  email?: string;
}

export class FacebookOAuthService {
  private config: FacebookOAuthConfig;

  constructor(config: FacebookOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate Facebook OAuth URL with comprehensive permissions for all services
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: [
        // Page management permissions
        'pages_manage_posts',
        'pages_read_engagement', 
        'pages_read_user_content',
        'pages_show_list',
        
        // Messenger bot permissions
        'pages_messaging',
        'pages_messaging_subscriptions',
        
        // Analytics and insights permissions
        'read_insights',
        'pages_manage_metadata',
        
        // Ad intelligence permissions (if available)
        'ads_read',
        
        // Basic permissions
        'email',
        'public_profile'
      ].join(','),
      ...(state && { state })
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<FacebookAccessTokenResponse> {
    try {
      const response = await axios.get(`${FACEBOOK_API_BASE}/oauth/access_token`, {
        params: {
          client_id: this.config.appId,
          client_secret: this.config.appSecret,
          redirect_uri: this.config.redirectUri,
          code: code,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  /**
   * Get long-lived access token (60 days)
   */
  async getLongLivedToken(shortLivedToken: string): Promise<FacebookAccessTokenResponse> {
    try {
      const response = await axios.get(`${FACEBOOK_API_BASE}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.config.appId,
          client_secret: this.config.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting long-lived token:', error.response?.data || error.message);
      throw new Error('Failed to get long-lived access token');
    }
  }

  /**
   * Validate access token and get user info
   */
  async validateTokenAndGetUser(accessToken: string): Promise<FacebookUserInfo> {
    try {
      const response = await axios.get(`${FACEBOOK_API_BASE}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,email',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error validating token:', error.response?.data || error.message);
      throw new Error('Invalid access token');
    }
  }

  /**
   * Get user's Facebook pages with extended permissions
   */
  async getUserPages(userAccessToken: string) {
    try {
      const response = await axios.get(`${FACEBOOK_API_BASE}/me/accounts`, {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,access_token,followers_count,picture{url},permissions,tasks',
        },
      });

      return response.data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        followers_count: page.followers_count || 0,
        profile_picture_url: page.picture?.data?.url,
        access_token: page.access_token,
        permissions: page.permissions || [],
        tasks: page.tasks || [],
      }));
    } catch (error: any) {
      console.error('Error fetching Facebook pages:', error.response?.data || error.message);
      throw new Error('Failed to fetch Facebook pages');
    }
  }

  /**
   * Check if user has necessary permissions for all services
   */
  async checkPermissions(accessToken: string): Promise<{ [permission: string]: boolean }> {
    try {
      const response = await axios.get(`${FACEBOOK_API_BASE}/me/permissions`, {
        params: {
          access_token: accessToken,
        },
      });

      const permissions: { [permission: string]: boolean } = {};
      response.data.data.forEach((perm: any) => {
        permissions[perm.permission] = perm.status === 'granted';
      });

      return permissions;
    } catch (error: any) {
      console.error('Error checking permissions:', error.response?.data || error.message);
      return {};
    }
  }
}

// Export configured service instance
export const facebookOAuth = new FacebookOAuthService({
  appId: process.env.FACEBOOK_APP_ID!,
  appSecret: process.env.FACEBOOK_APP_SECRET!,
  redirectUri: `${process.env.REPLIT_DOMAINS?.split(',')[0] ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/api/facebook/callback`,
});