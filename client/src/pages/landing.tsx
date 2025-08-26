import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fab fa-facebook-f text-primary-foreground text-sm"></i>
              </div>
              <h1 className="text-xl font-bold text-foreground">FBPro.MCP</h1>
            </div>
            <Button 
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
              className="bg-primary hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            AI-Powered Facebook Management
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Supercharge Your
            <span className="text-primary"> Facebook </span>
            Presence
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Automate content creation, scheduling, and engagement with AI-driven insights. 
            Manage multiple Facebook pages effortlessly with OpenAI, Claude, and Perplexity integration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-start-free"
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              data-testid="button-learn-more"
              className="text-lg px-8 py-3"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive Facebook management tools powered by cutting-edge AI technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-magic text-primary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">AI Content Generation</h3>
                <p className="text-muted-foreground">
                  Generate engaging posts with GPT-5, Claude, and Perplexity AI. Create compelling content that resonates with your audience.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-calendar-alt text-green-600 text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Smart Scheduler</h3>
                <p className="text-muted-foreground">
                  Optimize posting times with AI-driven scheduling. Reach your audience when they're most active.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-comments text-blue-600 text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Messenger AI Bot</h3>
                <p className="text-muted-foreground">
                  Automate customer conversations with intelligent response system. Never miss a message again.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-chart-bar text-orange-600 text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground">
                  Track performance with detailed insights. Make data-driven decisions to grow your presence.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-bullseye text-purple-600 text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Ad Intelligence</h3>
                <p className="text-muted-foreground">
                  Discover competitor strategies with Facebook Ads Library integration. Stay ahead of the competition.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <i className="fab fa-facebook text-red-600 text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Multi-Page Management</h3>
                <p className="text-muted-foreground">
                  Manage multiple Facebook pages from one dashboard. Streamline your workflow and save time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <Card className="border border-border bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Transform Your Facebook Management?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of businesses already using FBPro.MCP to grow their social presence
              </p>
              <Button 
                size="lg"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-get-started"
                className="bg-primary hover:bg-primary/90 text-lg px-12 py-4"
              >
                Get Started Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fab fa-facebook-f text-primary-foreground text-sm"></i>
            </div>
            <h3 className="text-xl font-bold text-foreground">FBPro.MCP</h3>
          </div>
          <p className="text-muted-foreground">
            AI-Driven Facebook Management SaaS Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
