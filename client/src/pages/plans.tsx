import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
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
  Star,
  CreditCard,
  Loader2,
  Calendar,
  Dumbbell,
  Sparkles,
  ArrowRight,
  Clock,
  DollarSign,
} from "lucide-react";

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

export default function PlansPage() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscriptions/plans"],
  });

  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery<UserSubscription | null>({
    queryKey: ["/api/subscriptions/my"],
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest("POST", "/api/subscriptions/checkout", { planId });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create checkout session");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Error",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleSubscribe = async (planId: number) => {
    if (!user) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      navigate("/auth?redirect=/plans");
      return;
    }

    if (userSubscription) {
      toast({
        title: "Already Subscribed",
        description: "You already have an active subscription. Manage it from your profile.",
        variant: "destructive",
      });
      return;
    }

    setSelectedPlanId(planId);
    setIsProcessing(true);
    checkoutMutation.mutate(planId);
  };

  const formatPrice = (price: number) => `$${Math.floor(price)}`;

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const baseFeatures = [
      "Book classes under $40",
      "No commitment, cancel anytime",
      "Priority booking access",
      "Automatic monthly renewal",
    ];

    if (plan.isUnlimited) {
      return ["Unlimited classes per month", ...baseFeatures, "Best value for active members"];
    }

    return [
      `${plan.classesPerMonth} classes per month`,
      ...baseFeatures,
      plan.pricePerClass ? `Just ${formatPrice(plan.pricePerClass)} per class` : null,
    ].filter(Boolean) as string[];
  };

  const getBestValuePlan = (plans: SubscriptionPlan[]) => {
    const unlimitedPlan = plans.find(p => p.isUnlimited);
    if (unlimitedPlan) return unlimitedPlan.id;
    
    const sortedByValue = [...plans].sort((a, b) => {
      const aValue = a.pricePerClass ?? Number.MAX_VALUE;
      const bValue = b.pricePerClass ?? Number.MAX_VALUE;
      return aValue - bValue;
    });
    return sortedByValue[0]?.id;
  };

  const isLoading = authLoading || plansLoading;

  return (
    <>
      <Helmet>
        <title>Subscription Plans - Trainn</title>
        <meta 
          name="description" 
          content="Subscribe to Trainn for unlimited access to fitness, sports, and creative classes. Choose from flexible monthly plans and save on every class." 
        />
      </Helmet>

      <Header />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Save more with a subscription</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Monthly Class Subscriptions
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Book classes under $40 using your monthly subscription credits. 
              Perfect for regular attendees who want to save on every class.
            </p>
          </div>

          {userSubscription && (
            <Card className="max-w-2xl mx-auto mb-12 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <Check className="w-5 h-5" />
                      Active Subscription
                    </CardTitle>
                    <CardDescription className="text-green-700 dark:text-green-300">
                      You're subscribed to {userSubscription.plan.name}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {userSubscription.classesRemaining === 'unlimited' ? (
                        <Infinity className="w-6 h-6 mx-auto" />
                      ) : (
                        userSubscription.classesRemaining
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold">{userSubscription.classesUsedThisPeriod}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Used This Month</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold">{userSubscription.totalClassesTaken}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Classes</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold">{formatPrice(userSubscription.plan.monthlyPrice)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Monthly</div>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <Link href="/profile?tab=dashboard">
                      Manage Subscription
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/classes">
                      Browse Classes <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                const isBestValue = getBestValuePlan(plans) === plan.id;
                const isCurrentPlan = userSubscription?.planId === plan.id;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative overflow-hidden transition-all hover:shadow-lg ${
                      isBestValue ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''
                    } ${isCurrentPlan ? 'border-green-500 bg-green-50/50 dark:bg-green-950/10' : ''}`}
                    data-testid={`card-plan-${plan.id}`}
                  >
                    {isBestValue && (
                      <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                        Best Value
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-br-lg">
                        Current Plan
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {plan.isUnlimited ? (
                          <Infinity className="w-6 h-6 text-primary" />
                        ) : (
                          <Dumbbell className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {formatPrice(plan.monthlyPrice)} <span className="text-lg font-normal text-gray-500">/ mo</span>
                        </div>
                        {plan.pricePerClass && (
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {formatPrice(plan.pricePerClass)}/class
                          </div>
                        )}
                      </div>

                      <Button
                        className="w-full"
                        variant={isBestValue ? "default" : "outline"}
                        disabled={isProcessing || !!userSubscription}
                        onClick={() => handleSubscribe(plan.id)}
                        data-testid={`button-subscribe-${plan.id}`}
                      >
                        {isProcessing && selectedPlanId === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          'Current Plan'
                        ) : userSubscription ? (
                          'Already Subscribed'
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Subscribe
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-12 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Book classes under $40</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">No commitment, cancel anytime</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Automatic monthly renewal</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Invite friends to join you on Trainn and earn rewards</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNavigation />
    </>
  );
}
