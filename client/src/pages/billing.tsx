import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Billing() {
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
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

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-subscription");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        // In a real implementation, this would redirect to Stripe checkout
        toast({
          title: "Subscription Created",
          description: "Your subscription has been set up successfully.",
        });
        setIsUpgradeOpen(false);
      }
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
        title: "Subscription Failed",
        description: error.message || "Failed to create subscription.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = () => {
    createSubscriptionMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = (user as any)?.subscriptionStatus === 'active' ? 'Pro' : 'Free';
  const isActive = (user as any)?.subscriptionStatus === 'active';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-billing">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <Card data-testid="card-current-plan">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge 
              variant={isActive ? "default" : "secondary"}
              data-testid="badge-plan-status"
            >
              {currentPlan}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-medium" data-testid="text-current-plan">{currentPlan} Plan</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-medium" data-testid="text-plan-price">
                {isActive ? "$29/month" : "Free"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={isActive ? "default" : "outline"} data-testid="badge-subscription-status">
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-600 mr-2"></i>
                  AI Content Generation
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-600 mr-2"></i>
                  {isActive ? "Unlimited" : "5"} Facebook Pages
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-600 mr-2"></i>
                  {isActive ? "Unlimited" : "10"} Posts per month
                </li>
                {isActive && (
                  <>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-600 mr-2"></i>
                      Advanced Analytics
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-600 mr-2"></i>
                      Ad Intelligence
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-600 mr-2"></i>
                      Priority Support
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`${!isActive ? 'ring-2 ring-primary' : ''}`} data-testid="card-free-plan">
          <CardHeader>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Free</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                5 Facebook Pages
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                10 AI-generated posts/month
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Basic scheduling
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Community support
              </li>
            </ul>
            {!isActive && (
              <Badge variant="outline" className="w-full justify-center mt-4">
                Current Plan
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className={`${isActive ? 'ring-2 ring-primary' : ''}`} data-testid="card-pro-plan">
          <CardHeader>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Pro</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Badge className="mt-2">Most Popular</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Unlimited Facebook Pages
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Unlimited AI-generated posts
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Advanced scheduling
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Messenger AI Bot
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Advanced Analytics
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Ad Intelligence
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Priority support
              </li>
            </ul>
            {isActive ? (
              <Badge variant="outline" className="w-full justify-center mt-4">
                Current Plan
              </Badge>
            ) : (
              <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mt-4 bg-primary hover:bg-primary/90" data-testid="button-upgrade-pro">
                    Upgrade to Pro
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-upgrade">
                  <DialogHeader>
                    <DialogTitle>Upgrade to Pro Plan</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Unlock unlimited AI content generation, advanced analytics, and premium features.
                    </p>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span>Pro Plan</span>
                        <span className="font-bold">$29/month</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleUpgrade}
                        disabled={createSubscriptionMutation.isPending}
                        className="flex-1"
                        data-testid="button-confirm-upgrade"
                      >
                        {createSubscriptionMutation.isPending ? "Processing..." : "Confirm Upgrade"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsUpgradeOpen(false)}
                        data-testid="button-cancel-upgrade"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-enterprise-plan">
          <CardHeader>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Enterprise</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">Custom</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Everything in Pro
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Custom AI models
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                White-label solution
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Dedicated support
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-600 mr-2"></i>
                Custom integrations
              </li>
            </ul>
            <Button variant="outline" className="w-full mt-4" data-testid="button-contact-sales">
              Contact Sales
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card data-testid="card-billing-history">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {isActive ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Pro Plan</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString()} - {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">$29.00</p>
                  <Badge variant="default" className="text-xs">Paid</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-receipt text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Billing History</h3>
              <p className="text-muted-foreground">
                Your billing history will appear here once you upgrade to a paid plan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      {isActive && (
        <Card data-testid="card-payment-method">
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
              <Button variant="outline" size="sm" data-testid="button-update-payment">
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
