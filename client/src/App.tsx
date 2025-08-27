import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ContentGenerator from "@/pages/content-generator";
import Scheduler from "@/pages/scheduler";
import FacebookPages from "@/pages/facebook-pages";
import MessengerBot from "@/pages/messenger-bot";
import Analytics from "@/pages/analytics";
import AdIntelligence from "@/pages/ad-intelligence";
import Billing from "@/pages/billing";
import Settings from "@/pages/settings";
import Layout from "@/components/layout";
import { DemoContentTest } from "@/components/demo-content-test";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Demo route - accessible without authentication */}
      <Route path="/demo" component={DemoContentTest} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/content" component={ContentGenerator} />
          <Route path="/scheduler" component={Scheduler} />
          <Route path="/facebook-pages" component={FacebookPages} />
          <Route path="/messenger-bot" component={MessengerBot} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/ad-intelligence" component={AdIntelligence} />
          <Route path="/billing" component={Billing} />
          <Route path="/settings" component={Settings} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
