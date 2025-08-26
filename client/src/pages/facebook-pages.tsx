import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function FacebookPages() {
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const [newPage, setNewPage] = useState({
    name: "",
    facebookPageId: "",
    accessToken: "",
    profileImageUrl: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["/api/facebook-pages"],
  });

  const addPageMutation = useMutation({
    mutationFn: async (pageData: any) => {
      const response = await apiRequest("POST", "/api/facebook-pages", pageData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Page Connected",
        description: "Facebook page has been connected successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-pages"] });
      setIsAddPageOpen(false);
      setNewPage({ name: "", facebookPageId: "", accessToken: "", profileImageUrl: "" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Facebook page.",
        variant: "destructive",
      });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PUT", `/api/facebook-pages/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Page Updated",
        description: "Page settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-pages"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update page settings.",
        variant: "destructive",
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/facebook-pages/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Page Disconnected",
        description: "Facebook page has been disconnected successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-pages"] });
    },
    onError: (error) => {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect Facebook page.",
        variant: "destructive",
      });
    },
  });

  const handleAddPage = () => {
    if (!newPage.name || !newPage.facebookPageId || !newPage.accessToken) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    addPageMutation.mutate(newPage);
  };

  const handleToggleActive = (pageId: string, isActive: boolean) => {
    updatePageMutation.mutate({
      id: pageId,
      updates: { isActive },
    });
  };

  const handleDeletePage = (pageId: string, pageName: string) => {
    if (confirm(`Are you sure you want to disconnect "${pageName}"? This action cannot be undone.`)) {
      deletePageMutation.mutate(pageId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-facebook-pages">Facebook Pages</h1>
          <p className="text-muted-foreground">
            Manage your connected Facebook pages and their settings
          </p>
        </div>
        
        <Dialog open={isAddPageOpen} onOpenChange={setIsAddPageOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-connect-page">
              <i className="fab fa-facebook mr-2" />
              Connect Page
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-connect-page">
            <DialogHeader>
              <DialogTitle>Connect Facebook Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page-name">Page Name *</Label>
                <Input
                  id="page-name"
                  placeholder="Enter page name"
                  value={newPage.name}
                  onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                  data-testid="input-page-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="page-id">Facebook Page ID *</Label>
                <Input
                  id="page-id"
                  placeholder="Enter Facebook Page ID"
                  value={newPage.facebookPageId}
                  onChange={(e) => setNewPage({ ...newPage, facebookPageId: e.target.value })}
                  data-testid="input-page-id"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="access-token">Page Access Token *</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="Enter page access token"
                  value={newPage.accessToken}
                  onChange={(e) => setNewPage({ ...newPage, accessToken: e.target.value })}
                  data-testid="input-access-token"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profile-image">Profile Image URL (Optional)</Label>
                <Input
                  id="profile-image"
                  placeholder="Enter profile image URL"
                  value={newPage.profileImageUrl}
                  onChange={(e) => setNewPage({ ...newPage, profileImageUrl: e.target.value })}
                  data-testid="input-profile-image"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleAddPage}
                  disabled={addPageMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-page"
                >
                  {addPageMutation.isPending ? "Connecting..." : "Connect Page"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddPageOpen(false)}
                  data-testid="button-cancel-page"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pages List */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 bg-muted rounded w-20"></div>
                      <div className="h-8 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : Array.isArray(pages) && pages.length > 0 ? (
          pages.map((page: any, index: number) => (
            <Card key={page.id} data-testid={`page-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      {page.profileImageUrl ? (
                        <img 
                          src={page.profileImageUrl} 
                          alt={`${page.name} profile`} 
                          className="w-full h-full object-cover"
                          data-testid={`image-page-profile-${index}`}
                        />
                      ) : (
                        <i className="fab fa-facebook text-primary text-2xl"></i>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-foreground" data-testid={`text-page-name-${index}`}>
                          {page.name}
                        </h3>
                        <Badge 
                          variant={page.isActive ? "default" : "secondary"}
                          data-testid={`badge-page-status-${index}`}
                        >
                          {page.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-page-followers-${index}`}>
                        {page.followers?.toLocaleString() || '0'} followers
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(page.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Active Toggle */}
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`active-${page.id}`} className="text-sm">Active</Label>
                      <Switch
                        id={`active-${page.id}`}
                        checked={page.isActive}
                        onCheckedChange={(checked) => handleToggleActive(page.id, checked)}
                        disabled={updatePageMutation.isPending}
                        data-testid={`switch-page-active-${index}`}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-view-insights-${index}`}
                      >
                        <i className="fas fa-chart-bar mr-1" />
                        Insights
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePage(page.id, page.name)}
                        disabled={deletePageMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-disconnect-${index}`}
                      >
                        <i className="fas fa-unlink mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Page Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {Math.floor(Math.random() * 50) + 10}
                    </p>
                    <p className="text-xs text-muted-foreground">Posts This Month</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {(Math.random() * 10).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Engagement Rate</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {Math.floor(Math.random() * 1000) + 500}
                    </p>
                    <p className="text-xs text-muted-foreground">Reach</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {Math.floor(Math.random() * 100) + 50}
                    </p>
                    <p className="text-xs text-muted-foreground">Interactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fab fa-facebook text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Facebook Pages Connected</h3>
              <p className="text-muted-foreground mb-6">
                Connect your Facebook pages to start managing your social media presence with AI assistance.
              </p>
              <Button 
                onClick={() => setIsAddPageOpen(true)}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-connect-first-page"
              >
                <i className="fab fa-facebook mr-2" />
                Connect Your First Page
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help Connecting Pages?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>To connect your Facebook page:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to your Facebook page and navigate to Settings</li>
              <li>Select "Advanced Messaging" or "Messenger Platform"</li>
              <li>Generate a page access token</li>
              <li>Copy your page ID from the About section</li>
              <li>Use the information above to connect your page</li>
            </ol>
            <p className="mt-4">
              <strong>Note:</strong> Make sure you have admin access to the Facebook page you want to connect.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
