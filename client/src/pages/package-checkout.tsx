import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../../../hooks/use-auth-simple";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import { Package, User, Calendar, CheckCircle, Gift, CreditCard, Loader2, DollarSign } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface ClassPackage {
  id: number;
  coachId: number;
  coachName: string;
  coachBusinessName?: string;
  displayBusinessName?: boolean;
  title: string;
  packageType: 'set_pack' | 'time_bound';
  classCount1: number | null;
  classCount2: number | null;
  classCount3: number | null;
  price1: number | null;
  price2: number | null;
  price3: number | null;
  eligibleClasses: string | null;
  description: string | null;
  categoryId: number | null;
  categoryName?: string;
  ageGroup: string;
  isActive: boolean;
  status: string;
  creationDate: string;
  futureClassCount: number | null;
  createdAt: string;
}

// Package Checkout Form component
const PackageCheckoutForm = ({ 
  packageData, 
  classCount, 
  price, 
  appliedPromoCode, 
  discountAmount, 
  finalAmount, 
  appliedCredits = 0, 
  useCredits = false, 
  onPaymentSuccess, 
  setIsBookingSuccess 
}: { 
  packageData: ClassPackage; 
  classCount: number; 
  price: number; 
  appliedPromoCode?: any;
  discountAmount: number;
  finalAmount: number;
  appliedCredits?: number;
  useCredits?: boolean;
  onPaymentSuccess?: () => void;
  setIsBookingSuccess?: (value: boolean) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/package/" + packageData.id + "/checkout?payment_status=success",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setPaymentStatus("error");
    } else {
      // Payment succeeded, now confirm the package purchase
      console.log("=== PACKAGE PAYMENT SUCCEEDED ===");
      console.log("Payment Intent:", paymentIntent);
      console.log("Payment Intent ID:", paymentIntent?.id);
      console.log("Package ID:", packageData.id);
      console.log("Class Count:", classCount);
      
      try {
        const confirmResponse = await apiRequest("POST", "/api/package-payment/confirm", {
          paymentIntentId: paymentIntent?.id,
          packageId: packageData.id,
          classCount: classCount,
          price: price,
          promoCode: appliedPromoCode?.code || null,
          appliedCredits: appliedCredits
        });
        
        console.log("Package payment confirmation response:", confirmResponse.status);
        
        if (confirmResponse.ok) {
          // Invalidate relevant cache to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
          queryClient.invalidateQueries({ queryKey: ['/api/package-purchases'] });
          
          setPaymentStatus("success");
          setIsBookingSuccess?.(true);
          
          toast({
            title: "Package purchased!",
            description: `You've successfully purchased ${classCount} classes for ${packageData.title}`,
          });
          
          // Navigate to packages or bookings page
          setTimeout(() => {
            navigate("/bookings?tab=packages");
          }, 2000);
          
        } else {
          throw new Error("Failed to confirm package purchase");
        }
      } catch (error) {
        console.error("Package purchase confirmation error:", error);
        toast({
          title: "Purchase Error",
          description: "Package payment succeeded but confirmation failed. Please contact support.",
          variant: "destructive",
        });
        setPaymentStatus("error");
      }
    }

    setIsProcessing(false);
  };

  if (paymentStatus === "success") {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Package Purchased Successfully!</h2>
          <p className="text-muted-foreground mb-4">
            You've purchased {classCount} classes for {packageData.title}
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to your bookings...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentElement />
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            Complete Purchase • ${(finalAmount + (finalAmount * 0.05)).toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
};

export default function PackageCheckoutPage() {
  const [, navigate] = useLocation();
  const [_, params] = useRoute<{ packageId: string }>("/package/:packageId/checkout");
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [appliedCredits, setAppliedCredits] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);

  // Fetch user credit balance
  const { data: creditData, refetch: refetchCredits } = useQuery({
    queryKey: ['/api/credits/balance'],
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
  });
  
  const creditBalance = (creditData as { balance?: number })?.balance || 0;
  const creditBalanceInDollars = creditBalance / 100; // Convert from cents to dollars

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const packageId = params?.packageId ? parseInt(params.packageId) : null;
  
  // Get URL parameters for selected package option
  const urlParams = new URLSearchParams(window.location.search);
  const classCount = parseInt(urlParams.get('classCount') || '0');
  const price = parseFloat(urlParams.get('price') || '0');

  // Fetch package details
  const { 
    data: packageData, 
    isLoading: isLoadingPackage, 
    error: packageError 
  } = useQuery<ClassPackage>({
    queryKey: [`/api/packages/${packageId}`],
    enabled: !!packageId,
  });

  // Handle credit toggle
  const handleCreditToggle = (checked: boolean) => {
    setUseCredits(checked);
    if (checked && creditBalance > 0) {
      // Apply credits up to the package price amount
      const packagePriceInCents = price * 100;
      const creditsToApply = Math.min(creditBalance, packagePriceInCents);
      setAppliedCredits(creditsToApply / 100); // Convert back to dollars for display
    } else {
      setAppliedCredits(0);
    }
  };

  // Update final amount when credits or promo codes change
  useEffect(() => {
    if (price) {
      let amount = price;
      
      // Apply promo discount
      if (appliedPromoCode && discountAmount > 0) {
        amount -= discountAmount;
      }
      
      // Apply credits
      if (useCredits && appliedCredits > 0) {
        amount -= appliedCredits;
      }
      
      // Ensure amount isn't negative
      amount = Math.max(0, amount);
      
      setFinalAmount(amount);
    }
  }, [price, appliedPromoCode, discountAmount, useCredits, appliedCredits]);

  // Initialize payment intent when package data is loaded
  useEffect(() => {
    if (packageData && classCount && price && user && !clientSecret && finalAmount !== undefined) {
      initializePayment();
    }
  }, [packageData, classCount, price, user, clientSecret, finalAmount]);

  const initializePayment = async () => {
    try {
      setIsLoading(true);
      
      // Check if this is a free purchase (fully covered by credits)
      if (finalAmount === 0) {
        console.log("💰 Free package purchase detected, skipping payment intent");
        setIsLoading(false);
        return;
      }
      
      const response = await apiRequest("POST", "/api/package-payment/create-intent", {
        packageId: packageData!.id,
        classCount: classCount,
        price: price,
        appliedCredits: appliedCredits * 100, // Convert to cents for API
        promoCode: appliedPromoCode?.code || null
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initialize payment");
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      
    } catch (err: any) {
      console.error("Payment initialization error:", err);
      setError(err.message || "Failed to initialize payment");
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${Math.floor(price)}`;
  };

  if (isLoadingPackage || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  if (packageError || !packageData || !classCount || !price) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Package Selection</h1>
            <p className="text-gray-600 mb-6">
              Please go back and select a valid package option.
            </p>
            <Button onClick={() => navigate(`/package/${packageId}/purchase`)}>
              Back to Package Selection
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Payment Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#dc2626',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Checkout - {packageData.title} - Trainn</title>
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/package/${packageId}/purchase`)}
            className="mb-4"
          >
            ← Back to Package Selection
          </Button>

          {/* Package Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{packageData.title}</h3>
                  <p className="text-sm text-gray-600">by {packageData.coachName}</p>
                  <p className="text-sm text-gray-600">{classCount} classes</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(price)}</p>
                  <p className="text-sm text-gray-600">
                    {formatPrice(price / classCount)} per class
                  </p>
                </div>
              </div>
              
              {packageData.categoryName && (
                <Badge variant="outline">{packageData.categoryName}</Badge>
              )}
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Package price</span>
                  <span>${(finalAmount || price).toFixed(2)}</span>
                </div>
                {appliedPromoCode && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedPromoCode.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {useCredits && appliedCredits > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Credits Applied</span>
                    <span>-${appliedCredits.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Processing fee</span>
                  <span>${((finalAmount || price) * 0.05).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">${((finalAmount || price) + ((finalAmount || price) * 0.05)).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits Section */}
          {creditBalance > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Account Credits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Available Credits</p>
                    <p className="text-sm text-gray-600">
                      You have ${creditBalanceInDollars.toFixed(2)} in account credits
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="use-credits">Use Credits</Label>
                    <Switch
                      id="use-credits"
                      checked={useCredits}
                      onCheckedChange={handleCreditToggle}
                    />
                  </div>
                </div>
                
                {useCredits && appliedCredits > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      💰 Applying ${appliedCredits.toFixed(2)} from your account credits
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Free Package Purchase Button */}
          {finalAmount === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <Gift className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Free Package with Credits!</h3>
                <p className="text-gray-600 mb-6">
                  Your account credits cover the full cost of this package.
                </p>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await apiRequest("POST", "/api/package-payment/free-credit", {
                        packageId: packageData!.id,
                        classCount: classCount,
                        price: price,
                        appliedCredits: appliedCredits * 100 // Convert to cents
                      });
                      
                      if (response.ok) {
                        toast({
                          title: "Package purchased!",
                          description: `You've successfully purchased ${classCount} classes using account credits.`,
                        });
                        navigate("/bookings?tab=packages");
                      } else {
                        throw new Error("Failed to purchase package with credits");
                      }
                    } catch (err: any) {
                      toast({
                        title: "Purchase Failed",
                        description: err.message || "Failed to purchase package with credits",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Gift className="mr-2 h-4 w-4" />
                  Confirm Free Package Purchase
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment Form */}
          {clientSecret && finalAmount > 0 && (
            <Elements options={options} stripe={stripePromise}>
              <PackageCheckoutForm
                packageData={packageData}
                classCount={classCount}
                price={price}
                appliedPromoCode={appliedPromoCode}
                discountAmount={discountAmount}
                finalAmount={finalAmount || price}
                appliedCredits={appliedCredits}
                useCredits={useCredits}
                onPaymentSuccess={() => {}}
                setIsBookingSuccess={setIsBookingSuccess}
              />
            </Elements>
          )}
        </div>
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}