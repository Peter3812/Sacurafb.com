import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

export default function Analytics() {
  const [selectedPage, setSelectedPage] = useState("");
  const [dateRange, setDateRange] = useState("30");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
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

  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["/api/facebook-pages"],
    enabled: !!isAuthenticated,
  });

  const { data: analytics = [], isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ["/api/analytics", selectedPage, startDate?.toISOString(), endDate?.toISOString()],
    enabled: !!selectedPage && !!isAuthenticated,
  });

  const { data: dashboardStats = {} } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!isAuthenticated,
  });

  useEffect(() => {
    if (analyticsError && isUnauthorizedError(analyticsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [analyticsError, toast]);

  useEffect(() => {
    const days = parseInt(dateRange);
    if (days > 0) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      setStartDate(start);
      setEndDate(end);
    }
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getMetricValue = (metric: string, fallback = "0") => {
    if (!Array.isArray(analytics) || analytics.length === 0) return fallback;
    
    const total = analytics.reduce((sum: number, item: any) => {
      return sum + (parseInt(item[metric]) || 0);
    }, 0);
    
    return total.toLocaleString();
  };

  const getEngagementRate = () => {
    if (!Array.isArray(analytics) || analytics.length === 0) return "0.0";
    
    const totalReach = analytics.reduce((sum: number, item: any) => sum + (parseInt(item.reach) || 0), 0);
    const totalEngagements = analytics.reduce((sum: number, item: any) => sum + (parseInt(item.engagements) || 0), 0);
    
    if (totalReach === 0) return "0.0";
    return ((totalEngagements / totalReach) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-analytics">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track performance metrics and insights for your Facebook pages
        </p>
      </div>

      {/* Filters */}
      <Card data-testid="card-analytics-filters">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Facebook Page</label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger data-testid="select-analytics-page">
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(pages) && pages.map((page: any) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Date Range</label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1" data-testid="button-start-date">
                        {startDate ? format(startDate, "MMM dd") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        data-testid="calendar-start-date"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1" data-testid="button-end-date">
                        {endDate ? format(endDate, "MMM dd") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        data-testid="calendar-end-date"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPage ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="metric-reach">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Reach</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="value-reach">
                      {getMetricValue('reach')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <i className="fas fa-eye text-blue-600 text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="metric-impressions">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Impressions</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="value-impressions">
                      {getMetricValue('impressions')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <i className="fas fa-chart-bar text-green-600 text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="metric-engagement">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Engagements</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="value-engagements">
                      {getMetricValue('engagements')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <i className="fas fa-heart text-purple-600 text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="metric-engagement-rate">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="value-engagement-rate">
                      {getEngagementRate()}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <i className="fas fa-percentage text-orange-600 text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card data-testid="card-performance-chart">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="h-64 bg-muted rounded-lg animate-pulse flex items-center justify-center">
                  <span className="text-muted-foreground">Loading chart data...</span>
                </div>
              ) : analytics && analytics.length > 0 ? (
                <div className="h-64 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <i className="fas fa-chart-line text-4xl text-primary mb-4"></i>
                    <p className="text-foreground font-medium">Performance Chart</p>
                    <p className="text-sm text-muted-foreground">
                      {analytics.length} data points available
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <i className="fas fa-chart-line text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-foreground font-medium">No Data Available</p>
                    <p className="text-sm text-muted-foreground">
                      Analytics data will appear here once available
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-engagement-breakdown">
              <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-thumbs-up text-blue-600"></i>
                      <span className="text-sm">Likes</span>
                    </div>
                    <span className="font-medium" data-testid="value-likes">
                      {getMetricValue('likes')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-comment text-green-600"></i>
                      <span className="text-sm">Comments</span>
                    </div>
                    <span className="font-medium" data-testid="value-comments">
                      {getMetricValue('comments')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-share text-purple-600"></i>
                      <span className="text-sm">Shares</span>
                    </div>
                    <span className="font-medium" data-testid="value-shares">
                      {getMetricValue('shares')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-mouse-pointer text-orange-600"></i>
                      <span className="text-sm">Clicks</span>
                    </div>
                    <span className="font-medium" data-testid="value-clicks">
                      {getMetricValue('clicks')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-top-content">
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className="fas fa-clock text-blue-600"></i>
                      <span className="text-sm font-medium">Best Posting Time</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your audience is most active between 2-4 PM on weekdays
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className="fas fa-trending-up text-green-600"></i>
                      <span className="text-sm font-medium">Top Content Type</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Visual content gets 2.3x more engagement than text-only posts
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border-l-4 border-purple-500">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className="fas fa-users text-purple-600"></i>
                      <span className="text-sm font-medium">Audience Growth</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your follower growth rate is above industry average
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-chart-bar text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Select a Page to View Analytics</h3>
            <p className="text-muted-foreground mb-6">
              Choose a Facebook page from the filter above to view detailed analytics and performance metrics.
            </p>
            {pagesLoading ? (
              <Badge variant="secondary">Loading pages...</Badge>
            ) : pages && pages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You need to connect Facebook pages first to view analytics.
              </p>
            ) : (
              <Badge variant="outline" data-testid="badge-pages-available">
                {pages?.length || 0} page{pages?.length !== 1 ? 's' : ''} available
              </Badge>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
