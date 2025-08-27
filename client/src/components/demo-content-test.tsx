import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function DemoContentTest() {
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState("post");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/demo/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          contentType,
          includeImage: false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error("Error generating content:", error);
      setError(error.message || "Failed to generate content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestHealth = async () => {
    try {
      const response = await fetch("/api/demo/health");
      const data = await response.json();
      console.log("Health check:", data);
      alert(`Health Check:\nStatus: ${data.status}\nDatabase: ${data.database}\nOpenAI: ${data.openai}\nStripe: ${data.stripe}`);
    } catch (error) {
      console.error("Health check failed:", error);
      alert("Health check failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-vial text-blue-600"></i>
            FBPro.MCP Initial Version Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the AI-powered content generation without authentication required
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleTestHealth} variant="outline">
              <i className="fas fa-heartbeat mr-2"></i>
              System Health Check
            </Button>
            <Badge variant="secondary" className="justify-center p-3">
              <i className="fas fa-robot mr-2"></i>
              GPT-5 Ready
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Content Generator Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content-type">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post">Social Media Post</SelectItem>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="ad">Advertisement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe what you want to create... (e.g., 'Create a post about the benefits of AI for small businesses')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Generating Content...
              </>
            ) : (
              <>
                <i className="fas fa-magic mr-2"></i>
                Generate Content with AI
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <i className="fas fa-exclamation-triangle"></i>
                <span className="font-medium">Error:</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-3">
                  <i className="fas fa-check-circle"></i>
                  <span className="font-medium">Generated Successfully!</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Generated Content:</Label>
                    <div className="mt-1 p-3 bg-white border rounded-md">
                      <p className="text-foreground whitespace-pre-wrap">{result.content}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="font-medium">Type:</span> {result.contentType}
                    </div>
                    <div>
                      <span className="font-medium">AI Model:</span> {result.aiModel}
                    </div>
                    <div>
                      <span className="font-medium">Generated:</span> {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                    <div>
                      <span className="font-medium">Length:</span> {result.content?.length || 0} chars
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Initial Version Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Implemented</h4>
              <ul className="text-sm space-y-1">
                <li>• Complete UI framework</li>
                <li>• Database schema & operations</li>
                <li>• AI content generation (GPT-5)</li>
                <li>• Authentication system</li>
                <li>• Facebook pages management</li>
                <li>• Content scheduling system</li>
                <li>• Analytics tracking</li>
                <li>• Messenger bot framework</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-orange-600">⚠️ Requires Setup</h4>
              <ul className="text-sm space-y-1">
                <li>• Facebook Graph API integration</li>
                <li>• User authentication login</li>
                <li>• Real-time posting</li>
                <li>• Live analytics data</li>
                <li>• Stripe subscription flow</li>
                <li>• Production deployment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}