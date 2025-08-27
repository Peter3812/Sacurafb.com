import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface FacebookPage {
  id: string;
  name: string;
  profileImageUrl?: string;
  followers?: number;
}

export default function FacebookConnect() {
  const [accessToken, setAccessToken] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [showLegacyConnect, setShowLegacyConnect] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  // Get existing Facebook pages
  const { data: existingPages = [], isLoading: loadingPages } = useQuery<FacebookPage[]>({
    queryKey: ['/api/facebook-pages'],
  });

  // New OAuth Connect mutation
  const oauthConnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/facebook/connect");
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Redirect to Facebook OAuth
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initiate Facebook connection",
        variant: "destructive",
      });
    },
  });

  // Legacy Connect Facebook pages mutation
  const connectPagesMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/facebook-pages/connect", { accessToken: token });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message,
      });
      setAccessToken("");
      setShowLegacyConnect(false);
      queryClient.invalidateQueries({ queryKey: ['/api/facebook-pages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Facebook pages",
        variant: "destructive",
      });
    },
  });

  // Sync page data mutation
  const syncPageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await apiRequest("POST", `/api/facebook-pages/${pageId}/sync`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/facebook-pages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync page data",
        variant: "destructive",
      });
    },
  });

  // Handle OAuth callback success/error
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const facebookConnect = urlParams.get('facebook_connect');
    const pages = urlParams.get('pages');
    const error = urlParams.get('error');
    const description = urlParams.get('description');

    if (facebookConnect === 'success' && pages) {
      toast({
        title: "Facebook Connected!",
        description: `Successfully connected ${pages} Facebook page(s). You can now manage all your Facebook content with AI assistance.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/facebook-pages'] });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      toast({
        title: "Connection Failed",
        description: description || "Failed to connect Facebook pages",
        variant: "destructive",
      });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, queryClient]);

  const handleConnect = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Missing Token",
        description: "Please enter your Facebook access token",
        variant: "destructive",
      });
      return;
    }
    connectPagesMutation.mutate(accessToken.trim());
  };

  const handleSync = (pageId: string) => {
    syncPageMutation.mutate(pageId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Connect Facebook Pages</h1>
        <p className="text-muted-foreground mt-2">
          Connect your Facebook pages to start publishing and managing content with AI.
        </p>
      </div>

      {/* Main Connect Button - NEW SEAMLESS FLOW */}
      <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center space-x-3">
            <i className="fab fa-facebook text-blue-600 text-3xl" />
            <span>Connect with Facebook</span>
          </CardTitle>
          <CardDescription className="text-lg">
            One-click connection to all your Facebook pages with full permissions for AI management
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">✨ What you'll get automatically:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Content posting & scheduling</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Messenger bot automation</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Analytics & insights</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Ad intelligence data</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => oauthConnectMutation.mutate()}
            disabled={oauthConnectMutation.isPending}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
            data-testid="button-facebook-oauth-connect"
          >
            {oauthConnectMutation.isPending ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Connecting to Facebook...
              </>
            ) : (
              <>
                <i className="fab fa-facebook mr-3 text-xl" />
                Connect with Facebook
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Secure OAuth connection • No manual tokens required • All permissions handled automatically
          </p>
        </CardContent>
      </Card>

      {/* Advanced/Manual Connection Option */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>🔧 Advanced: Manual Token Connection</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowLegacyConnect(!showLegacyConnect)}
              data-testid="button-toggle-manual"
            >
              {showLegacyConnect ? "Hide Manual Setup" : "Show Manual Setup"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showLegacyConnect && (
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>For developers:</strong> If you prefer to use your own Facebook access tokens or need custom permissions setup.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <label htmlFor="access-token" className="text-sm font-medium">
                Facebook Access Token
              </label>
              <Input
                id="access-token"
                type="password"
                placeholder="Enter your Facebook access token..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={connectPagesMutation.isPending}
                data-testid="input-facebook-token"
              />
            </div>
            
            <Button 
              onClick={handleConnect}
              disabled={connectPagesMutation.isPending || !accessToken.trim()}
              variant="outline"
              className="w-full"
              data-testid="button-connect-facebook-manual"
            >
              {connectPagesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <i className="fas fa-code mr-2" />
                  Connect via Manual Token
                </>
              )}
            </Button>

            {showInstructions && (
              <div className="bg-muted p-4 rounded-lg text-sm">
                <h3 className="font-semibold mb-2">Manual Token Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to Facebook Graph API Explorer</li>
                  <li>Generate token with required permissions</li>
                  <li>Copy and paste token above</li>
                </ol>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Separator />

      {/* Connected Pages */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Pages</h2>
        
        {loadingPages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading pages...</span>
          </div>
        ) : existingPages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-muted-foreground">
                <i className="fab fa-facebook text-4xl mb-4" />
                <p>No Facebook pages connected yet.</p>
                <p className="text-sm">Use the form above to connect your first page.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {existingPages.map((page: FacebookPage) => (
              <Card key={page.id} data-testid={`page-card-${page.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    {page.profileImageUrl ? (
                      <img 
                        src={page.profileImageUrl} 
                        alt={page.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <i className="fab fa-facebook text-primary-foreground text-lg" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate" data-testid={`page-name-${page.id}`}>
                        {page.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {page.followers?.toLocaleString() || 0} followers
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleSync(page.id)}
                      disabled={syncPageMutation.isPending}
                      data-testid={`button-sync-${page.id}`}
                    >
                      {syncPageMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <i className="fas fa-sync-alt mr-1 text-xs" />
                          Sync
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      data-testid={`button-insights-${page.id}`}
                    >
                      <i className="fas fa-chart-line mr-1 text-xs" />
                      Insights
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}