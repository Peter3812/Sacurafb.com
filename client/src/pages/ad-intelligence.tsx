import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function AdIntelligence() {
  const [searchQuery, setSearchQuery] = useState("");
  const [adCategory, setAdCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
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

  const { data: adIntelligence = [], isLoading: adsLoading, error: adsError } = useQuery({
    queryKey: ["/api/ad-intelligence"],
    enabled: !!isAuthenticated,
  });

  useEffect(() => {
    if (adsError && isUnauthorizedError(adsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [adsError, toast]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search term to discover ads.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Feature Coming Soon",
      description: "Ad discovery from Facebook Ads Library will be available in the next update.",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 h-64 bg-muted rounded-lg"></div>
            <div className="lg:col-span-2 h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-ad-intelligence">Ad Intelligence</h1>
        <p className="text-muted-foreground">
          Discover competitor ads and trending strategies using Facebook Ads Library
        </p>
      </div>

      {/* Search and Filters */}
      <Card data-testid="card-search-filters">
        <CardHeader>
          <CardTitle>Discover Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="search-query">Search Keywords</Label>
              <Input
                id="search-query"
                placeholder="Enter brand names, keywords, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-query"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-category">Category</Label>
              <Select value={adCategory} onValueChange={setAdCategory}>
                <SelectTrigger data-testid="select-ad-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-by">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="select-sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="spend">Highest Spend</SelectItem>
                  <SelectItem value="reach">Highest Reach</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex space-x-2">
            <Button
              onClick={handleSearch}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-search-ads"
            >
              <i className="fas fa-search mr-2" />
              Search Ads
            </Button>
            <Button variant="outline" data-testid="button-save-search">
              <i className="fas fa-bookmark mr-2" />
              Save Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="discovered" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discovered" data-testid="tab-discovered">Discovered Ads</TabsTrigger>
          <TabsTrigger value="saved" data-testid="tab-saved">Saved Ads</TabsTrigger>
          <TabsTrigger value="insights" data-testid="tab-insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="discovered">
          <Card data-testid="card-discovered-ads">
            <CardHeader>
              <CardTitle>Discovered Ads</CardTitle>
              <p className="text-sm text-muted-foreground">
                {adsLoading ? "Loading..." : `${Array.isArray(adIntelligence) ? adIntelligence.length : 0} ads found`}
              </p>
            </CardHeader>
            <CardContent>
              {adsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse border border-border rounded-lg p-4">
                      <div className="flex space-x-4">
                        <div className="w-24 h-24 bg-muted rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : Array.isArray(adIntelligence) && adIntelligence.length > 0 ? (
                <div className="space-y-4">
                  {adIntelligence.map((ad: any, index: number) => (
                    <div key={ad.id} className="border border-border rounded-lg p-4" data-testid={`ad-item-${index}`}>
                      <div className="flex items-start space-x-4">
                        {ad.adImageUrl && (
                          <img 
                            src={ad.adImageUrl} 
                            alt="Ad creative" 
                            className="w-24 h-24 object-cover rounded"
                            data-testid={`ad-image-${index}`}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-foreground" data-testid={`ad-page-name-${index}`}>
                                {ad.pageName || 'Unknown Page'}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" data-testid={`ad-date-${index}`}>
                                  {new Date(ad.startDate || ad.createdAt).toLocaleDateString()}
                                </Badge>
                                {ad.spend && (
                                  <Badge variant="secondary" data-testid={`ad-spend-${index}`}>
                                    ${parseFloat(ad.spend).toFixed(0)} spent
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" data-testid={`button-save-ad-${index}`}>
                              <i className="fas fa-bookmark"></i>
                            </Button>
                          </div>
                          
                          {ad.adContent && (
                            <p className="text-sm text-foreground mb-3 line-clamp-3" data-testid={`ad-content-${index}`}>
                              {ad.adContent}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            {ad.impressions && (
                              <span data-testid={`ad-impressions-${index}`}>
                                <i className="fas fa-eye mr-1"></i>
                                {parseInt(ad.impressions).toLocaleString()} impressions
                              </span>
                            )}
                            <Button size="sm" variant="outline" data-testid={`button-view-ad-${index}`}>
                              <i className="fas fa-external-link-alt mr-1"></i>
                              View Original
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-bullseye text-2xl text-muted-foreground"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Ads Discovered Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Use the search above to discover competitor ads and trending strategies from Facebook Ads Library.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved">
          <Card data-testid="card-saved-ads">
            <CardHeader>
              <CardTitle>Saved Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-bookmark text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Saved Ads</h3>
                <p className="text-muted-foreground">
                  Save interesting ads from the Discovered tab to build your inspiration library.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-trending-topics">
              <CardHeader>
                <CardTitle>Trending Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">AI & Automation</p>
                      <p className="text-xs text-muted-foreground">+127% increase in ads</p>
                    </div>
                    <Badge variant="default">Hot</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Sustainable Products</p>
                      <p className="text-xs text-muted-foreground">+89% increase in ads</p>
                    </div>
                    <Badge variant="secondary">Rising</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Remote Work Tools</p>
                      <p className="text-xs text-muted-foreground">+45% increase in ads</p>
                    </div>
                    <Badge variant="outline">Stable</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-ad-insights">
              <CardHeader>
                <CardTitle>Industry Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className="fas fa-lightbulb text-blue-600"></i>
                      <span className="text-sm font-medium">Best Performing Format</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Video ads with captions get 85% more engagement than static images
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className="fas fa-clock text-green-600"></i>
                      <span className="text-sm font-medium">Optimal Ad Length</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      15-30 second videos perform best for conversion campaigns
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border-l-4 border-purple-500">
                    <div className="flex items-center space-x-2 mb-1">
                      <i className="fas fa-target text-purple-600"></i>
                      <span className="text-sm font-medium">Audience Targeting</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Interest-based targeting shows 40% better ROI than demographic targeting
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2" data-testid="button-competitor-analysis">
              <i className="fas fa-users text-2xl text-primary"></i>
              <div className="text-center">
                <p className="font-medium">Competitor Analysis</p>
                <p className="text-xs text-muted-foreground">Analyze specific competitor strategies</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2" data-testid="button-trend-alerts">
              <i className="fas fa-bell text-2xl text-primary"></i>
              <div className="text-center">
                <p className="font-medium">Trend Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified about emerging trends</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2" data-testid="button-export-data">
              <i className="fas fa-download text-2xl text-primary"></i>
              <div className="text-center">
                <p className="font-medium">Export Data</p>
                <p className="text-xs text-muted-foreground">Download ad intelligence reports</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
