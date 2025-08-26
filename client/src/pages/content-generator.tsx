import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export default function ContentGenerator() {
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState("post");
  const [aiModel, setAiModel] = useState("gpt-5");
  const [selectedPage, setSelectedPage] = useState("");
  const [includeImage, setIncludeImage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["/api/facebook-pages"],
  });

  const { data: generatedContent = [], isLoading: contentLoading } = useQuery({
    queryKey: ["/api/content"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/content/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content Generated",
        description: "Your AI-generated content is ready for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      // Clear the form
      setPrompt("");
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
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PUT", `/api/content/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Updated",
        description: "Content has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update content.",
        variant: "destructive",
      });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/content/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Content Deleted",
        description: "Content has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete content.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt to generate content.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      prompt,
      contentType,
      aiModel,
      pageId: selectedPage || null,
      includeImage,
    });
  };

  const handleSchedule = (contentId: string, scheduledTime: string) => {
    updateContentMutation.mutate({
      id: contentId,
      updates: {
        status: "scheduled",
        scheduledAt: new Date(scheduledTime).toISOString(),
      },
    });
  };

  const handlePublish = (contentId: string) => {
    updateContentMutation.mutate({
      id: contentId,
      updates: {
        status: "published",
        publishedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-content-generator">AI Content Generator</h1>
        <p className="text-muted-foreground">
          Create engaging social media content using advanced AI models
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Generation Form */}
        <Card className="lg:col-span-1" data-testid="card-content-form">
          <CardHeader>
            <CardTitle>Generate New Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Content Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the content you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                data-testid="textarea-prompt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger data-testid="select-content-type">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="ad">Advertisement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-model">AI Model</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
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
              <Label htmlFor="page-select">Target Page (Optional)</Label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger data-testid="select-target-page">
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Pages</SelectItem>
                  {Array.isArray(pages) && pages.map((page: any) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="include-image" 
                checked={includeImage}
                onCheckedChange={setIncludeImage}
                data-testid="switch-include-image"
              />
              <Label htmlFor="include-image">Generate with image</Label>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !prompt.trim()}
              className="w-full"
              data-testid="button-generate-content"
            >
              {generateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Content List */}
        <Card className="lg:col-span-2" data-testid="card-content-list">
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <p className="text-sm text-muted-foreground">
              {contentLoading ? "Loading..." : `${Array.isArray(generatedContent) ? generatedContent.length : 0} content pieces generated`}
            </p>
          </CardHeader>
          <CardContent>
            {contentLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-20 bg-muted rounded"></div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-muted rounded w-20"></div>
                      <div className="h-8 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : Array.isArray(generatedContent) && generatedContent.length > 0 ? (
              <div className="space-y-6">
                {generatedContent.map((content: any, index: number) => (
                  <div key={content.id} className="border border-border rounded-lg p-4" data-testid={`content-item-${index}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" data-testid={`badge-model-${index}`}>
                          {content.aiModel}
                        </Badge>
                        <Badge 
                          variant={content.status === 'published' ? 'default' : 'outline'}
                          data-testid={`badge-status-${index}`}
                        >
                          {content.status}
                        </Badge>
                        {content.contentType !== 'post' && (
                          <Badge variant="outline" data-testid={`badge-type-${index}`}>
                            {content.contentType}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(content.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {content.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={content.imageUrl} 
                          alt="Generated content" 
                          className="w-full max-w-sm rounded-lg"
                          data-testid={`image-content-${index}`}
                        />
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="text-foreground whitespace-pre-wrap" data-testid={`text-content-${index}`}>
                        {content.content}
                      </p>
                    </div>

                    {content.prompt && (
                      <div className="mb-3 p-2 bg-muted rounded text-xs">
                        <strong>Prompt:</strong> {content.prompt}
                      </div>
                    )}

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {content.status === 'draft' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const scheduledTime = prompt('Schedule for when? (YYYY-MM-DD HH:MM format)');
                                if (scheduledTime) {
                                  handleSchedule(content.id, scheduledTime);
                                }
                              }}
                              data-testid={`button-schedule-${index}`}
                            >
                              <i className="fas fa-calendar mr-1" />
                              Schedule
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handlePublish(content.id)}
                              disabled={updateContentMutation.isPending}
                              data-testid={`button-publish-${index}`}
                            >
                              <i className="fas fa-paper-plane mr-1" />
                              Publish Now
                            </Button>
                          </>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteContentMutation.mutate(content.id)}
                        disabled={deleteContentMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-${index}`}
                      >
                        <i className="fas fa-trash" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-magic text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No content generated yet</h3>
                <p className="text-muted-foreground mb-6">
                  Use the AI content generator to create your first piece of engaging social media content.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
