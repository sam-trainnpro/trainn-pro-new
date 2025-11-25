import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useAuth } from "../../../hooks/use-auth-simple";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Helmet } from "react-helmet";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "../../../hooks/use-toast";
import {
  Check,
  Infinity,
  Dumbbell,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface SubscriptionPlan {
  id: number;
  name: string;
  classesPerMonth: number | null;
  isUnlimited: boolean;
  pricePerClass: number | null;
  monthlyPrice: number;
  displayOrder: number;
  isActive: boolean;
  stripePriceId: string | null;
  stripeProductId: string | null;
}

interface UserSubscription {
  id: number;
  userId: number;
  planId: number;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  classesUsedThisPeriod: number;
  classesAllottedThisPeriod: number;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
  totalClassesTaken: number;
  classesRemaining: number | 'unlimited';
}

export default function ChangePlanPage() {
  const [location, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscriptions/plans"],
  });

  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery<UserSubscription | null>({
    queryKey: ["/api/subscriptions/my"],
    enabled: !!user,
  });

  const changePlanMutation = useMutation({
    mutationFn: async (newPlanId: number) => {
      const response = await apiRequest("POST", "/api/subscriptions/change-plan", { 
        newPlanId 
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change plan");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/my"] });
      toast({
        title: "Plan Changed",
        description: "Your subscription plan has been updated successfully.",
      });
      navigate("/profile?tab=dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchClientSecret = useCallback(async () => {
    if (!selectedPlanId) {
      throw new Error("No plan selected");
    }
    
    const response = await apiRequest("POST", "/api/subscriptions/checkout", { 
      planId: selectedPlanId 
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create checkout session");
    }
    
    const data = await response.json();
    return data.clientSecret;
  }, [selectedPlanId]);

  const handleSelectPlan = async (planId: number) => {
    if (!user) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to change your plan.",
        variant: "destructive",
      });
      navigate("/auth?redirect=/change-plan");
      return;
    }

    if (userSubscription?.planId === planId) {
      toast({
        title: "Current Plan",
        description: "This is already your current plan.",
      });
      return;
    }

    if (userSubscription) {
      if (window.confirm(`Are you sure you want to change from ${userSubscription.plan.name} to ${plans?.find(p => p.id === planId)?.name}? The change will take effect at your next billing cycle.`)) {
        changePlanMutation.mutate(planId);
      }
    } else {
      setSelectedPlanId(planId);
      setShowCheckout(true);
    }
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setSelectedPlanId(null);
  };

  const formatPrice = (price: number) => `$${Math.floor(price)}`;

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const baseFeatures = [
      "Book classes under $40",
      "No commitment, cancel anytime",
      "Priority booking access",
    ];

    if (plan.isUnlimited) {
      return ["Unlimited classes per month", ...baseFeatures];
    }

    return [
      `${plan.classesPerMonth} classes per month`,
      ...baseFeatures,
    ];
  };

  const isLoading = authLoading || plansLoading || subscriptionLoading;

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to change your plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/auth?redirect=/change-plan">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Change Plan - Trainn</title>
        <meta 
          name="description" 
          content="Change your Trainn subscription plan. Choose from flexible monthly options." 
        />
      </Helmet>
      <Header />

      {showCheckout && selectedPlanId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold">Complete Your Subscription</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {plans?.find(p => p.id === selectedPlanId)?.name} - {formatPrice(plans?.find(p => p.id === selectedPlanId)?.monthlyPrice || 0)}/mo
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseCheckout}
                data-testid="button-close-checkout"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/profile?tab=dashboard")}
              className="mb-4"
              data-testid="button-back-to-profile"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Change Your Plan</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {userSubscription 
                ? `You're currently on the ${userSubscription.plan.name}. Select a different plan to switch.`
                : "Choose a subscription plan to get started."
              }
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl mx-auto">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="relative">
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl mx-auto">
              {plans?.map((plan) => {
                const isCurrentPlan = userSubscription?.planId === plan.id;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative overflow-hidden transition-all hover:shadow-lg ${
                      isCurrentPlan 
                        ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' 
                        : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                    data-testid={`card-plan-${plan.id}`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-semibold text-center">
                        Current Plan
                      </div>
                    )}
                    
                    <CardHeader className={`text-center pb-2 ${isCurrentPlan ? 'pt-10' : ''}`}>
                      <div className={`mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center ${
                        isCurrentPlan ? 'bg-blue-100 dark:bg-blue-900' : 'bg-primary/10'
                      }`}>
                        {plan.isUnlimited ? (
                          <Infinity className={`w-6 h-6 ${isCurrentPlan ? 'text-blue-600' : 'text-primary'}`} />
                        ) : (
                          <Dumbbell className={`w-6 h-6 ${isCurrentPlan ? 'text-blue-600' : 'text-primary'}`} />
                        )}
                      </div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${isCurrentPlan ? 'text-blue-600' : 'text-primary'}`}>
                          {formatPrice(plan.monthlyPrice)} <span className="text-lg font-normal text-gray-500">/ mo</span>
                        </div>
                        {plan.pricePerClass && (
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {formatPrice(plan.pricePerClass)} per class
                          </div>
                        )}
                      </div>

                      <ul className="space-y-2">
                        {getPlanFeatures(plan).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isCurrentPlan ? 'text-blue-500' : 'text-green-500'}`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full ${isCurrentPlan ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        variant={isCurrentPlan ? "default" : "outline"}
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isCurrentPlan || changePlanMutation.isPending}
                        data-testid={`button-select-plan-${plan.id}`}
                      >
                        {changePlanMutation.isPending && selectedPlanId === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Changing...
                          </>
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : userSubscription ? (
                          "Switch to This Plan"
                        ) : (
                          "Select Plan"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {userSubscription && (
            <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Plan changes take effect at your next billing cycle on {new Date(userSubscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
            </div>
          )}
        </div>
      </div>

      <MobileNavigation />
      <Footer />
    </>
  );
}
