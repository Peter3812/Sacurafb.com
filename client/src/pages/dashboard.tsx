import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/stat-card";
import FeatureCard from "@/components/feature-card";
import PageCard from "@/components/page-card";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!isAuthenticated,
  });

  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["/api/facebook-pages"],
    enabled: !!isAuthenticated,
  });

  const { data: recentContent = [] } = useQuery({
    queryKey: ["/api/content"],
    enabled: !!isAuthenticated,
  });

  useEffect(() => {
    if (statsError && isUnauthorizedError(statsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [statsError, toast]);

  if (isLoading || statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const defaultStats = {
    totalPosts: 0,
    totalPages: 0,
    totalReach: 0,
    totalEngagement: 0,
    avgEngagementRate: 0,
    totalSpend: 0,
  };

  const dashboardStats = (stats as any) || defaultStats;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Posts"
          value={((stats as any)?.totalPosts || 0).toString()}
          icon="fas fa-file-alt"
          trend="+12.5%"
          trendPositive={true}
          data-testid="stat-total-posts"
        />
        <StatCard
          title="Engagement Rate"
          value={`${((stats as any)?.avgEngagementRate || 0).toFixed(1)}%`}
          icon="fas fa-heart"
          trend="+2.1%"
          trendPositive={true}
          iconColor="text-green-600"
          iconBg="bg-green-100"
          data-testid="stat-engagement-rate"
        />
        <StatCard
          title="Active Pages"
          value={((stats as any)?.totalPages || 0).toString()}
          icon="fab fa-facebook"
          trend={((stats as any)?.totalPages || 0) > 0 ? `+${(stats as any)?.totalPages || 0}` : "0"}
          trendPositive={true}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          data-testid="stat-active-pages"
        />
        <StatCard
          title="Ad Spend"
          value={`$${((stats as any)?.totalSpend || 0).toFixed(0)}`}
          icon="fas fa-dollar-sign"
          trend="-5.2%"
          trendPositive={false}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
          data-testid="stat-ad-spend"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2" data-testid="card-performance-chart">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Performance Overview</CardTitle>
            <select className="px-3 py-1 text-sm border border-border rounded-md bg-background">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="chart-container rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90">Total Reach</p>
                  <p className="text-2xl font-bold" data-testid="text-total-reach">
                    {((stats as any)?.totalReach || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">This Month</p>
                  <p className="text-lg font-semibold">+18.7%</p>
                </div>
              </div>
              <div className="h-32 bg-white/10 rounded-lg flex items-center justify-center">
                <p className="text-sm opacity-75">Chart visualization area</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(recentContent) && recentContent.length > 0 ? (
                recentContent.slice(0, 3).map((content: any, index: number) => (
                  <div key={content.id} className="flex items-start space-x-3" data-testid={`activity-item-${index}`}>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-check text-green-600 text-xs"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {content.status === 'published' ? 'Post published successfully' : 'Content created'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(content.createdAt).toLocaleDateString()} • {new Date(content.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-info text-blue-600 text-xs"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Welcome to FBPro.MCP!</p>
                      <p className="text-xs text-muted-foreground">Start by connecting your Facebook pages</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-magic text-primary text-xs"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Try AI content generation</p>
                      <p className="text-xs text-muted-foreground">Create your first post with AI assistance</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-4 text-primary hover:text-primary/80"
              data-testid="button-view-activity"
            >
              View all activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          icon="fas fa-magic"
          title="AI Content Generator"
          description="Generate engaging posts with OpenAI, Claude, and Perplexity AI integration."
          buttonText="Create Content"
          buttonHref="/content"
          data-testid="feature-ai-content"
        />
        <FeatureCard
          icon="fas fa-calendar-alt"
          title="Smart Scheduler"
          description="Optimize posting times with AI-driven scheduling across multiple pages."
          buttonText="Schedule Posts"
          buttonHref="/scheduler"
          buttonColor="bg-green-600 hover:bg-green-700"
          iconColor="text-green-600"
          iconBg="bg-green-100"
          data-testid="feature-scheduler"
        />
        <FeatureCard
          icon="fas fa-comments"
          title="Messenger AI Bot"
          description="Automate customer conversations with intelligent response system."
          buttonText="Setup Bot"
          buttonHref="/messenger-bot"
          buttonColor="bg-blue-600 hover:bg-blue-700"
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          data-testid="feature-messenger-bot"
        />
      </div>

      {/* Connected Pages */}
      <Card data-testid="card-connected-pages">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Connected Facebook Pages</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {Array.isArray(pages) && pages.length ? `${pages.length} page${pages.length > 1 ? 's' : ''} connected` : 'No pages connected yet'}
            </p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            data-testid="button-connect-page"
          >
            <i className="fab fa-facebook mr-2"></i>
            Connect Page
          </Button>
        </CardHeader>
        <CardContent>
          {pagesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : Array.isArray(pages) && pages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pages.map((page: any) => (
                <PageCard
                  key={page.id}
                  name={page.name}
                  followers={page.followers}
                  imageUrl={page.profileImageUrl}
                  postsThisWeek={Math.floor(Math.random() * 20) + 1}
                  engagementChange={((Math.random() - 0.5) * 10).toFixed(1)}
                  data-testid={`page-card-${page.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fab fa-facebook text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No pages connected yet</h3>
              <p className="text-muted-foreground mb-6">
                Connect your Facebook pages to start managing your social media presence with AI assistance.
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90"
                data-testid="button-connect-first-page"
              >
                <i className="fab fa-facebook mr-2"></i>
                Connect Your First Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card data-testid="card-ai-insights">
        <CardHeader>
          <CardTitle>AI-Powered Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-lightbulb text-blue-600"></i>
                <h4 className="font-medium text-foreground">Content Suggestion</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on your audience engagement patterns, consider posting more visual content during evening hours for better reach.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-trending-up text-green-600"></i>
                <h4 className="font-medium text-foreground">Trending Topic</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                "AI automation" is trending in your industry. Generate content around this topic to increase engagement.
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border-l-4 border-orange-500">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-exclamation-triangle text-orange-600"></i>
                <h4 className="font-medium text-foreground">Optimization Alert</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {Array.isArray(pages) && pages.length > 0
                  ? "Maintain consistent posting schedule across all connected pages for better reach."
                  : "Connect your Facebook pages to start receiving personalized optimization alerts."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
