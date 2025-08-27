import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";

export default function MessengerBot() {
  const [selectedPage, setSelectedPage] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [botSettings, setBotSettings] = useState({
    isActive: false,
    welcomeMessage: "",
    fallbackMessage: "",
    aiModel: "gpt-5",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const { data: botConfig = {}, isLoading: botLoading, refetch: refetchBot } = useQuery({
    queryKey: ["/api/messenger-bot", selectedPage],
    enabled: !!selectedPage && !!isAuthenticated,
  });

  const createBotMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/messenger-bot", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bot Created",
        description: "Messenger bot has been configured successfully.",
      });
      refetchBot();
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
        title: "Configuration Failed",
        description: error.message || "Failed to configure bot.",
        variant: "destructive",
      });
    },
  });

  const updateBotMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/messenger-bot/${selectedPage}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bot Updated",
        description: "Messenger bot settings have been updated successfully.",
      });
      refetchBot();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update bot settings.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (botConfig && Object.keys(botConfig).length > 0) {
      setBotSettings({
        isActive: (botConfig as any).isActive,
        welcomeMessage: (botConfig as any).welcomeMessage || "",
        fallbackMessage: (botConfig as any).fallbackMessage || "",
        aiModel: (botConfig as any).aiModel || "gpt-5",
      });
    } else if (selectedPage) {
      setBotSettings({
        isActive: false,
        welcomeMessage: "Hi! Welcome to our page. How can I help you today?",
        fallbackMessage: "I'm sorry, I didn't understand that. Could you please rephrase your question?",
        aiModel: "gpt-5",
      });
    }
  }, [botConfig, selectedPage]);

  const handleSaveBot = () => {
    if (!selectedPage) {
      toast({
        title: "Page Required",
        description: "Please select a Facebook page first.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      pageId: selectedPage,
      ...botSettings,
    };

    if (botConfig) {
      updateBotMutation.mutate(data);
    } else {
      createBotMutation.mutate(data);
    }
  };

  const handleTestBot = async () => {
    if (!testMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a test message.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPage) {
      toast({
        title: "Page Required",
        description: "Please select a Facebook page first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setTestResponse("🤖 Generating AI response...");
      
      // Call the real AI response generation endpoint
      const response = await apiRequest("POST", `/api/messenger-bot/${selectedPage}/generate-response`, {
        message: testMessage,
        conversationHistory: [] // Empty for test, but can include chat history
      });
      
      const data = await response.json();
      
      if (data.response) {
        setTestResponse(`✨ **${data.model.toUpperCase()} AI Response:**\n\n${data.response}`);
      } else {
        throw new Error("No response from AI");
      }
      
    } catch (error) {
      console.error("Test bot error:", error);
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
        title: "Test Failed",
        description: "Failed to generate AI response. Make sure the bot is configured and active.",
        variant: "destructive",
      });
      setTestResponse("❌ Failed to generate AI response. Please check your bot configuration.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-messenger-bot">Messenger AI Bot</h1>
        <p className="text-muted-foreground">
          Configure AI-powered chatbots for your Facebook pages
        </p>
      </div>

      {/* Page Selection */}
      <Card data-testid="card-page-selection">
        <CardHeader>
          <CardTitle>Select Facebook Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="page-select">Choose a page to configure</Label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger data-testid="select-facebook-page">
                  <SelectValue placeholder="Select a Facebook page" />
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
            {selectedPage && (
              <div className="flex items-center space-x-2">
                <Badge variant={(botConfig as any)?.isActive ? "default" : "secondary"} data-testid="badge-bot-status">
                  {(botConfig as any)?.isActive ? "Active" : "Inactive"}
                </Badge>
                {botConfig && Object.keys(botConfig).length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Last updated: {new Date((botConfig as any).updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bot Configuration */}
          <Card data-testid="card-bot-config">
            <CardHeader>
              <CardTitle>Bot Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="bot-active"
                  checked={botSettings.isActive}
                  onCheckedChange={(checked) => setBotSettings({ ...botSettings, isActive: checked })}
                  data-testid="switch-bot-active"
                />
                <Label htmlFor="bot-active">Enable Bot</Label>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="ai-model">AI Model</Label>
                <Select 
                  value={botSettings.aiModel} 
                  onValueChange={(value) => setBotSettings({ ...botSettings, aiModel: value })}
                >
                  <SelectTrigger data-testid="select-ai-model">
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-5">GPT-5 (Latest)</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                    <SelectItem value="perplexity">Perplexity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  placeholder="Enter welcome message for new conversations..."
                  value={botSettings.welcomeMessage}
                  onChange={(e) => setBotSettings({ ...botSettings, welcomeMessage: e.target.value })}
                  rows={3}
                  data-testid="textarea-welcome-message"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallback-message">Fallback Message</Label>
                <Textarea
                  id="fallback-message"
                  placeholder="Enter message when bot doesn't understand..."
                  value={botSettings.fallbackMessage}
                  onChange={(e) => setBotSettings({ ...botSettings, fallbackMessage: e.target.value })}
                  rows={3}
                  data-testid="textarea-fallback-message"
                />
              </div>

              <Button
                onClick={handleSaveBot}
                disabled={createBotMutation.isPending || updateBotMutation.isPending}
                className="w-full"
                data-testid="button-save-bot"
              >
                {createBotMutation.isPending || updateBotMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </CardContent>
          </Card>

          {/* Bot Testing */}
          <Card data-testid="card-bot-testing">
            <CardHeader>
              <CardTitle>Test Bot Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-message">Test Message</Label>
                <Textarea
                  id="test-message"
                  placeholder="Enter a message to test the bot response..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                  data-testid="textarea-test-message"
                />
              </div>

              <Button
                onClick={handleTestBot}
                disabled={!testMessage.trim()}
                className="w-full"
                data-testid="button-test-bot"
              >
                <i className="fas fa-play mr-2" />
                Test Bot Response
              </Button>

              {testResponse && (
                <div className="space-y-2">
                  <Label>Bot Response</Label>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800" data-testid="div-bot-response">
                    <div className="text-sm text-foreground whitespace-pre-wrap">{testResponse}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedPage && !pagesLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-comments text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Configure Your First Bot</h3>
            <p className="text-muted-foreground mb-6">
              Select a Facebook page to start configuring your AI-powered messenger bot.
            </p>
            {Array.isArray(pages) && pages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You need to connect Facebook pages first before configuring bots.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bot Features */}
      <Card data-testid="card-bot-features">
        <CardHeader>
          <CardTitle>Bot Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-robot text-blue-600"></i>
                <h4 className="font-medium text-foreground">AI-Powered Responses</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Intelligent responses powered by GPT-5, Claude, or Perplexity AI for natural conversations.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-clock text-green-600"></i>
                <h4 className="font-medium text-foreground">24/7 Availability</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Respond to customer inquiries instantly, any time of day or night.
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-4 border-l-4 border-purple-500">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-cogs text-purple-600"></i>
                <h4 className="font-medium text-foreground">Customizable</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Tailor responses, welcome messages, and fallback messages to match your brand voice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
