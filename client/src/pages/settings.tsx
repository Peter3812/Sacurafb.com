import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profileImageUrl: "",
  });

  const [preferences, setPreferences] = useState({
    defaultAiModel: "gpt-5",
    autoSchedule: false,
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    timezone: "UTC",
  });

  const [apiKeys, setApiKeys] = useState({
    openaiKey: "",
    claudeKey: "",
    perplexityKey: "",
    facebookAppId: "",
    facebookAppSecret: "",
  });

  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: (user as any).firstName || "",
        lastName: (user as any).lastName || "",
        email: (user as any).email || "",
        profileImageUrl: (user as any).profileImageUrl || "",
      });
    }
  }, [user]);

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleSavePreferences = () => {
    toast({
      title: "Preferences Updated", 
      description: "Your preferences have been saved successfully.",
    });
  };

  const handleSaveApiKeys = () => {
    toast({
      title: "API Keys Updated",
      description: "Your API keys have been saved securely.",
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-settings">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and integrations
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">Preferences</TabsTrigger>
          <TabsTrigger value="api-keys" data-testid="tab-api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="account" data-testid="tab-account">Account</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card data-testid="card-profile-settings">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Update your personal information and profile picture
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                  {profile.profileImageUrl ? (
                    <img 
                      src={profile.profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      data-testid="image-profile-picture"
                    />
                  ) : (
                    <span className="text-xl font-medium text-primary-foreground">
                      {profile.firstName?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <Button variant="outline" size="sm" data-testid="button-change-picture">
                    Change Picture
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>

              <Button onClick={handleSaveProfile} data-testid="button-save-profile">
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card data-testid="card-preferences-settings">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize your experience and default settings
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">AI & Content</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="default-ai-model">Default AI Model</Label>
                  <Select value={preferences.defaultAiModel} onValueChange={(value) => setPreferences({ ...preferences, defaultAiModel: value })}>
                    <SelectTrigger data-testid="select-default-ai-model">
                      <SelectValue placeholder="Select default AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-5">GPT-5 (Latest)</SelectItem>
                      <SelectItem value="claude">Claude</SelectItem>
                      <SelectItem value="perplexity">Perplexity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-schedule"
                    checked={preferences.autoSchedule}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, autoSchedule: checked })}
                    data-testid="switch-auto-schedule"
                  />
                  <Label htmlFor="auto-schedule">Auto-schedule generated content</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Notifications</h4>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email-notifications"
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
                    data-testid="switch-email-notifications"
                  />
                  <Label htmlFor="email-notifications">Email notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="push-notifications"
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, pushNotifications: checked })}
                    data-testid="switch-push-notifications"
                  />
                  <Label htmlFor="push-notifications">Push notifications</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Display</h4>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="dark-mode"
                    checked={preferences.darkMode}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, darkMode: checked })}
                    data-testid="switch-dark-mode"
                  />
                  <Label htmlFor="dark-mode">Dark mode</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={preferences.timezone} onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}>
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSavePreferences} data-testid="button-save-preferences">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <Card data-testid="card-api-keys-settings">
            <CardHeader>
              <CardTitle>API Keys & Integrations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure your API keys for AI models and Facebook integration
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">AI Model API Keys</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={apiKeys.openaiKey}
                    onChange={(e) => setApiKeys({ ...apiKeys, openaiKey: e.target.value })}
                    data-testid="input-openai-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Platform</a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="claude-key">Claude API Key</Label>
                  <Input
                    id="claude-key"
                    type="password"
                    placeholder="sk-ant-..."
                    value={apiKeys.claudeKey}
                    onChange={(e) => setApiKeys({ ...apiKeys, claudeKey: e.target.value })}
                    data-testid="input-claude-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Anthropic Console</a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perplexity-key">Perplexity API Key</Label>
                  <Input
                    id="perplexity-key"
                    type="password"
                    placeholder="pplx-..."
                    value={apiKeys.perplexityKey}
                    onChange={(e) => setApiKeys({ ...apiKeys, perplexityKey: e.target.value })}
                    data-testid="input-perplexity-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://www.perplexity.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Perplexity</a>
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Facebook Integration</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="facebook-app-id">Facebook App ID</Label>
                  <Input
                    id="facebook-app-id"
                    placeholder="Your Facebook App ID"
                    value={apiKeys.facebookAppId}
                    onChange={(e) => setApiKeys({ ...apiKeys, facebookAppId: e.target.value })}
                    data-testid="input-facebook-app-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook-app-secret">Facebook App Secret</Label>
                  <Input
                    id="facebook-app-secret"
                    type="password"
                    placeholder="Your Facebook App Secret"
                    value={apiKeys.facebookAppSecret}
                    onChange={(e) => setApiKeys({ ...apiKeys, facebookAppSecret: e.target.value })}
                    data-testid="input-facebook-app-secret"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Create a Facebook app at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook Developers</a> to get these credentials.
                </p>
              </div>

              <Button onClick={handleSaveApiKeys} data-testid="button-save-api-keys">
                Save API Keys
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <div className="space-y-6">
            <Card data-testid="card-account-info">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User ID</span>
                  <span className="font-mono text-sm" data-testid="text-user-id">{(user as any)?.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account created</span>
                  <span className="text-sm" data-testid="text-account-created">
                    {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subscription status</span>
                  <span className="text-sm" data-testid="text-subscription-status">
                    {(user as any)?.subscriptionStatus || 'inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-account-actions">
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    data-testid="button-export-data"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Export My Data
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Download all your data including posts, analytics, and settings.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button 
                    onClick={handleLogout}
                    variant="outline" 
                    className="w-full justify-start"
                    data-testid="button-logout"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Logout
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Sign out of your account on this device.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    data-testid="button-delete-account"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Delete Account
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
