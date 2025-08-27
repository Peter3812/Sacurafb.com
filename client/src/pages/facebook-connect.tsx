import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function FacebookConnect() {
  const [accessToken, setAccessToken] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get existing Facebook pages
  const { data: existingPages = [], isLoading: loadingPages } = useQuery({
    queryKey: ['/api/facebook-pages'],
  });

  // Connect Facebook pages mutation
  const connectPagesMutation = useMutation({
    mutationFn: async (token: string) => {
      return await apiRequest("POST", "/api/facebook-pages/connect", { accessToken: token });
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message,
      });
      setAccessToken("");
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
      return await apiRequest("POST", `/api/facebook-pages/${pageId}/sync`);
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

      {/* Connection Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📘 Setup Instructions</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? "Hide" : "Show"} Instructions
            </Button>
          </CardTitle>
        </CardHeader>
        {showInstructions && (
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">How to get your Facebook Access Token:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Go to{" "}
                  <a 
                    href="https://developers.facebook.com/tools/explorer/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Facebook Graph API Explorer
                  </a>
                </li>
                <li>Select your Facebook App (or create one)</li>
                <li>Set permissions: <code className="bg-gray-100 px-1 rounded">pages_manage_posts</code>, <code className="bg-gray-100 px-1 rounded">pages_read_engagement</code></li>
                <li>Generate an access token</li>
                <li>Copy the token and paste it below</li>
              </ol>
            </div>
            
            <Alert>
              <AlertDescription>
                <strong>Note:</strong> You need admin access to the Facebook pages you want to connect.
                The access token should have <code>pages_manage_posts</code> and <code>pages_read_engagement</code> permissions.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Connection Form */}
      <Card>
        <CardHeader>
          <CardTitle>Connect Your Pages</CardTitle>
          <CardDescription>
            Enter your Facebook access token to connect your pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            className="w-full"
            data-testid="button-connect-facebook"
          >
            {connectPagesMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <i className="fab fa-facebook mr-2" />
                Connect Facebook Pages
              </>
            )}
          </Button>
        </CardContent>
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
            {existingPages.map((page: any) => (
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