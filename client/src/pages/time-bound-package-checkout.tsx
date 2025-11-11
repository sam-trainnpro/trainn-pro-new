import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet";
import { Package, User, Calendar, CheckCircle, CreditCard, Loader2, Clock, MapPin, CalendarDays, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface TimeBoundPackageSession {
  id: number;
  packageId: number;
  sessionNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  sessionType: string | null;
  status: string;
}

interface TimeBoundPackage {
  id: number;
  coachId: number;
  coachName: string;
  coachBusinessName?: string;
  displayBusinessName?: boolean;
  coachProfileImage?: string;
  title: string;
  packageType: 'time_bound';
  description: string | null;
  categoryId: number | null;
  categoryName?: string;
  ageGroup: string;
  totalSessions: number | null;
  price: number | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  allowLateJoin: boolean | null;
  location: string | null;
  isActive: boolean;
  status: string;
  createdAt: string;
}

interface TimeBoundPackageDetails {
  package: TimeBoundPackage;
  sessions: TimeBoundPackageSession[];
  bookedCount?: number;
}

// Time-Bound Package Checkout Form component
const TimeBoundPackageCheckoutForm = ({ 
  packageData, 
  quantity,
  appliedPromoCode,
  discountAmount,
  finalAmount,
  unitPriceCents,
  stripeFee,
  appliedCredits = 0,
  useCredits = false,
  onPaymentSuccess, 
  setIsBookingSuccess 
}: { 
  packageData: TimeBoundPackage; 
  quantity: number;
  appliedPromoCode?: any;
  discountAmount: number;
  finalAmount: number;
  unitPriceCents: number | null;
  stripeFee: number;
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
      toast({
        title: "Payment Error",
        description: "Payment system not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    // Validate the form before processing
    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast({
        title: "Payment Failed", 
        description: submitError.message || "Please check your payment information.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/time-bound-package-checkout?packageId=" + packageData.id + "&quantity=" + quantity + "&payment_status=success",
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
      // Payment succeeded, now book the package
      try {
        const bookResponse = await apiRequest("POST", `/api/time-bound-packages/${packageData.id}/book`, {
          paymentIntentId: paymentIntent?.id,
          quantity: quantity,
          stripeFee: stripeFee,
          promoCode: appliedPromoCode?.code || null,
          appliedCredits: appliedCredits
        });
        
        if (bookResponse.ok) {
          // Invalidate relevant cache to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
          queryClient.invalidateQueries({ queryKey: ['/api/time-bound-packages'] });
          
          setPaymentStatus("success");
          setIsBookingSuccess?.(true);
          
          toast({
            title: "Package booked!",
            description: `You've successfully booked ${packageData.title}`,
          });
          
          // Navigate to bookings page
          setTimeout(() => {
            navigate("/bookings?tab=packages");
          }, 2000);
          
        } else {
          throw new Error("Failed to book package");
        }
      } catch (error) {
        toast({
          title: "Booking Error",
          description: "Payment succeeded but booking failed. Please contact support.",
          variant: "destructive",
        });
        setPaymentStatus("error");
      }
    }

    setIsProcessing(false);
  };

  if (paymentStatus === "success") {
    return (
      <Card data-testid="card-payment-success">
        <CardContent className="py-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" data-testid="icon-success" />
          <h2 className="text-xl font-bold mb-2" data-testid="text-success-title">Package Booked Successfully!</h2>
          <p className="text-muted-foreground mb-4" data-testid="text-success-description">
            You've successfully booked {packageData.title}
          </p>
          <p className="text-sm text-muted-foreground" data-testid="text-redirect-notice">
            Redirecting to your bookings...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-payment">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentElement 
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
                radios: false,
                spacedAccordionItems: false
              },
              fields: {
                billingDetails: {
                  name: 'auto',
                  email: 'auto'
                }
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Pricing Summary - Uses backend-calculated values (all in cents) */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Package price {quantity > 1 ? `(${quantity} × $${((unitPriceCents || 0) / 100).toFixed(2)})` : ''}</span>
          <span>${(((unitPriceCents || 0) * quantity) / 100).toFixed(2)}</span>
        </div>
        {appliedPromoCode && discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({appliedPromoCode.code})</span>
            <span>-${(discountAmount / 100).toFixed(2)}</span>
          </div>
        )}
        {useCredits && appliedCredits > 0 && (
          <div className="flex justify-between text-blue-600">
            <span>Credits Applied</span>
            <span>-${(appliedCredits / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Service fee</span>
          <span>${(stripeFee / 100).toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>${((finalAmount + stripeFee) / 100).toFixed(2)}</span>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || !elements || isProcessing}
        data-testid="button-complete-purchase"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            Complete Purchase • ${((finalAmount + stripeFee) / 100).toFixed(2)}
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        By completing this purchase, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
};

export default function TimeBoundPackageCheckoutPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [unitPriceCents, setUnitPriceCents] = useState<number | null>(null);
  const [finalAmount, setFinalAmount] = useState(0);
  const [stripeFee, setStripeFee] = useState(0);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  // Account credits state
  const [appliedCredits, setAppliedCredits] = useState(0);
  const [useCredits, setUseCredits] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get URL parameters for package ID and quantity
  const urlParams = new URLSearchParams(window.location.search);
  const packageId = urlParams.get('packageId') ? parseInt(urlParams.get('packageId')!) : null;
  const quantity = parseInt(urlParams.get('quantity') || '1');
  const paymentStatus = urlParams.get('payment_status');

  // Redirect if not logged in
  if (!user) {
    navigate("/auth");
    return null;
  }

  // Fetch package details with sessions
  const { 
    data: packageDetails, 
    isLoading: isLoadingPackage, 
    error: packageError 
  } = useQuery<TimeBoundPackageDetails>({
    queryKey: ['/api/time-bound-packages', packageId],
    enabled: !!packageId,
  });

  const packageData = packageDetails?.package;
  const sessions = packageDetails?.sessions || [];

  // Fetch user credit balance
  const { data: creditData, refetch: refetchCredits } = useQuery({
    queryKey: ['/api/credits/balance'],
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  
  const creditBalance = (creditData as { balance?: number })?.balance || 0;

  // Free booking mutation for 100% discount promo codes or credits
  const freeBookingMutation = useMutation({
    mutationFn: async (data: { packageId: number; quantity: number; promoCode?: string; appliedCredits?: number }) => {
      const response = await apiRequest("POST", "/api/time-bound-packages/free-booking", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to book package");
      }
      return response.json();
    },
    onSuccess: async (result) => {
      const isCreditsBooking = !result.message?.includes('promo code');
      
      // Set success state and navigate
      setIsBookingSuccess(true);
      navigate("/bookings?tab=packages");
      
      // Background toast and cleanup
      setTimeout(() => {
        toast({
          title: "Package booked!",
          description: isCreditsBooking 
            ? "Your package booking has been confirmed with account credits."
            : "Your package booking has been confirmed with promo code.",
        });
        
        queryClient.removeQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: ['/api/time-bound-packages'] });
        
        if (isCreditsBooking) {
          queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
          refetchCredits();
        }
      }, 0);
    },
    onError: (error: Error) => {
      const isCreditsError = error.message?.includes('credits') || error.message?.includes('Insufficient');
      toast({
        title: "Booking failed",
        description: error.message || (isCreditsError 
          ? "Failed to book package with account credits" 
          : "Failed to book package with promo code"),
        variant: "destructive",
      });
    },
  });

  // Validate promo code function
  const validatePromoCode = async (code: string) => {
    if (!code.trim()) return;
    
    setIsValidatingPromo(true);
    try {
      const response = await apiRequest('POST', '/api/promo-codes/validate-package', {
        code: code.toUpperCase(),
        packageId: packageId,
        quantity: quantity
      });
      
      if (response.ok) {
        const result = await response.json();
        setAppliedPromoCode(result.promoCode);
        setDiscountAmount(result.discountAmount);
        setFinalAmount(result.finalAmount);
        
        toast({
          title: "Promo Code Applied!",
          description: `You saved $${(result.discountAmount / 100).toFixed(2)}`,
        });
      } else {
        toast({
          title: "Invalid Promo Code",
          description: "This promo code is not valid for this package.",
          variant: "destructive",
        });
        setAppliedPromoCode(null);
        setDiscountAmount(0);
        setFinalAmount(packageData ? (packageData.price || 0) * quantity * 100 : 0);
      }
    } catch (error) {
      toast({
        title: "Promo Code Not Accepted",
        description: "This promo code is not valid for this package.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Remove promo code
  const removePromoCode = () => {
    setPromoCode("");
    setAppliedPromoCode(null);
    setDiscountAmount(0);
    setFinalAmount(packageData ? (packageData.price || 0) * quantity * 100 : 0);
  };

  // Calculate final amount when package loads or payment options change
  useEffect(() => {
    if (!packageData || creditBalance === undefined) return;
    
    const baseAmount = (packageData.price || 0) * quantity * 100; // Amount in cents
    const discountToApply = appliedPromoCode ? discountAmount : 0;
    const amountAfterPromo = Math.max(0, baseAmount - discountToApply);
    
    // Calculate credits to apply if credits are enabled
    if (useCredits && creditBalance > 0) {
      const creditsToApply = Math.min(creditBalance, amountAfterPromo);
      setAppliedCredits(creditsToApply);
    } else {
      setAppliedCredits(0);
    }
    
    // Calculate final amount with credits
    const creditToApply = useCredits ? appliedCredits : 0;
    const calculatedAmount = Math.max(0, amountAfterPromo - creditToApply);
    
    setFinalAmount(calculatedAmount);
  }, [
    packageData?.id, 
    packageData?.price,
    quantity, 
    creditBalance, 
    appliedPromoCode?.code, 
    discountAmount, 
    useCredits, 
    appliedCredits
  ]);

  // Reset client secret when key parameters change
  useEffect(() => {
    if (clientSecret) {
      setClientSecret("");
    }
  }, [appliedCredits, useCredits, appliedPromoCode, discountAmount]);

  // Initialize payment intent when package data is loaded
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const initializePayment = async () => {
      try {
        // Strict validation - all data must be loaded
        if (!packageData || creditBalance === null) {
          return;
        }
        
        // Skip payment intent if already successful
        if (paymentStatus === 'success') {
          return;
        }
        
        // Don't create if we already have a client secret
        if (clientSecret) {
          return;
        }
        
        // For free bookings, skip payment intent
        if (finalAmount === 0) {
          return;
        }
        
        setIsLoading(true);
        
        const response = await apiRequest("POST", "/api/time-bound-package-payment/create-intent", {
          packageId: packageData.id,
          quantity: quantity,
          promoCode: appliedPromoCode?.code || null,
          useCredits: useCredits,
          appliedCredits: appliedCredits
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to initialize payment");
        }

        const data = await response.json();
        
        // Use backend-provided values (all in cents)
        setClientSecret(data.clientSecret);
        setFinalAmount(data.subtotal); // Subtotal after discounts/credits, before fee
        setStripeFee(data.stripeFee); // Processing fee
        setUnitPriceCents(data.unitPriceCents); // Price per unit (may be prorated)
        
      } catch (err: any) {
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
    
    // Run with slight delay to allow state to stabilize
    timeoutId = setTimeout(initializePayment, 150);
    
    return () => clearTimeout(timeoutId);
  }, [packageData, user, clientSecret, finalAmount, creditBalance, useCredits, appliedCredits, appliedPromoCode, paymentStatus]);

  const formatPrice = (price: number) => {
    return `$${Math.floor(price)}`;
  };

  const formatDateTime = (dateStr: string, startTimeStr: string, endTimeStr: string) => {
    try {
      const date = parseISO(dateStr);
      const startTime = parseISO(startTimeStr);
      const endTime = parseISO(endTimeStr);
      
      return {
        date: format(date, 'EEEE, MMMM d, yyyy'),
        time: `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`
      };
    } catch (error) {
      return {
        date: dateStr,
        time: `${startTimeStr} - ${endTimeStr}`
      };
    }
  };

  const getCoachDisplayName = (pkg: TimeBoundPackage) => {
    return pkg.displayBusinessName && pkg.coachBusinessName 
      ? pkg.coachBusinessName 
      : pkg.coachName;
  };

  const getCoachInitials = (pkg: TimeBoundPackage) => {
    const name = getCoachDisplayName(pkg);
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Calculate remaining sessions
  const now = new Date();
  const futureSessions = sessions.filter(s => new Date(s.startTime) > now);
  const remainingSessions = futureSessions.length;
  const isProrated = packageData?.allowLateJoin && remainingSessions < (packageData?.totalSessions || 0);

  if (isLoadingPackage || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-8 w-1/3" data-testid="skeleton-title" />
            <Skeleton className="h-48 w-full" data-testid="skeleton-card" />
            <Skeleton className="h-32 w-full" data-testid="skeleton-sessions" />
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  if (packageError || !packageData || !packageId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4" data-testid="text-error-title">Invalid Package Selection</h1>
            <p className="text-gray-600 mb-6" data-testid="text-error-description">
              Please go back and select a valid package.
            </p>
            <Button onClick={() => navigate('/packages')} data-testid="button-back-packages">
              Back to Packages
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
            <h1 className="text-2xl font-bold mb-4" data-testid="text-payment-error-title">Payment Error</h1>
            <p className="text-gray-600 mb-6" data-testid="text-payment-error-description">{error}</p>
            <Button onClick={() => window.location.reload()} data-testid="button-try-again">
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
      colorBackground: '#ffffff',
      colorText: '#30313d',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
    rules: {
      '.Input': {
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '12px',
        fontSize: '14px',
      },
      '.Input:focus': {
        outline: '2px solid #dc2626',
        outlineOffset: '2px',
      },
      '.Error': {
        color: '#ef4444',
      }
    },
  };

  const options = {
    clientSecret,
    appearance,
    layout: {
      type: 'tabs' as const,
      defaultCollapsed: false,
      radios: false,
      spacedAccordionItems: false
    },
    paymentMethodOrder: ['card', 'link', 'amazon_pay', 'apple_pay', 'google_pay']
  };

  // Pricing calculations in cents for consistency with backend
  const basePriceCents = unitPriceCents || Math.round((packageData.price || 0) * 100);
  const basePriceTotalCents = basePriceCents * quantity;
  const discountCents = appliedPromoCode ? discountAmount : 0;
  const creditsCents = useCredits ? appliedCredits : 0;
  const subtotalCents = basePriceTotalCents - discountCents - creditsCents;
  
  // Prefer backend-provided stripeFee when available (after payment intent created)
  // Otherwise estimate at 5% for initial display
  const hasBackendFee = stripeFee > 0 && clientSecret;
  const displayStripeFeeCents = hasBackendFee ? stripeFee : Math.round(subtotalCents * 0.05);
  const displayTotalCents = subtotalCents + displayStripeFeeCents;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Checkout - {packageData.title} - Trainn</title>
        <meta name="description" content={`Complete your booking for ${packageData.title}`} />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/package/${packageId}`)}
            className="mb-4"
            data-testid="button-back"
          >
            ← Back to Package
          </Button>

          {/* Package Summary */}
          <Card data-testid="card-package-summary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Provider Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12" data-testid="avatar-provider">
                  {packageData.coachProfileImage ? (
                    <AvatarImage src={packageData.coachProfileImage} alt={getCoachDisplayName(packageData)} />
                  ) : null}
                  <AvatarFallback>{getCoachInitials(packageData)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium" data-testid="text-provider-name">{getCoachDisplayName(packageData)}</p>
                  <p className="text-sm text-gray-600">Provider</p>
                </div>
              </div>

              <Separator />

              {/* Package Details */}
              <div>
                <h3 className="font-semibold text-lg mb-1" data-testid="text-package-title">{packageData.title}</h3>
                {packageData.description && (
                  <p className="text-sm text-gray-600 mb-2" data-testid="text-package-description">
                    {packageData.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {packageData.categoryName && (
                    <Badge variant="outline" data-testid="badge-category">{packageData.categoryName}</Badge>
                  )}
                  <Badge variant="outline" data-testid="badge-age-group">{packageData.ageGroup}</Badge>
                  <Badge variant="outline" data-testid="badge-total-sessions">
                    {packageData.totalSessions} sessions
                  </Badge>
                  {quantity > 1 && (
                    <Badge variant="outline" className="bg-blue-50" data-testid="badge-quantity">
                      {quantity} spots
                    </Badge>
                  )}
                </div>
              </div>

              {isProrated && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" data-testid="alert-prorated">
                  <p className="text-sm text-blue-800 font-medium">
                    💡 Prorated Pricing Applied
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Joining with {remainingSessions} of {packageData.totalSessions} sessions remaining. 
                    Price adjusted from ${packageData.price} to ${((unitPriceCents || 0) / 100).toFixed(2)}.
                  </p>
                </div>
              )}

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span data-testid="text-label-package-price">
                    Package price {quantity > 1 ? `(${quantity} × $${(basePriceCents / 100).toFixed(2)})` : ''}
                  </span>
                  <span data-testid="text-value-package-price">${(basePriceTotalCents / 100).toFixed(2)}</span>
                </div>
                {isProrated && packageData.price && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span data-testid="text-label-original-price">Original price</span>
                    <span className="line-through" data-testid="text-value-original-price">${(packageData.price * quantity).toFixed(2)}</span>
                  </div>
                )}
                {appliedPromoCode && discountCents > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedPromoCode.code})</span>
                    <span>-${(discountCents / 100).toFixed(2)}</span>
                  </div>
                )}
                {useCredits && creditsCents > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Credits Applied</span>
                    <span>-${(creditsCents / 100).toFixed(2)}</span>
                  </div>
                )}
                {subtotalCents > 0 && (
                  <div className="flex justify-between">
                    <span data-testid="text-label-processing-fee">
                      {hasBackendFee ? 'Service fee' : 'Estimated service fee'}
                    </span>
                    <span data-testid="text-value-processing-fee">${(displayStripeFeeCents / 100).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span data-testid="text-label-total">Total</span>
                  <span className={`text-lg ${displayTotalCents === 0 ? 'text-green-600' : ''}`} data-testid="text-value-total">
                    {displayTotalCents === 0 ? 'FREE' : `$${(displayTotalCents / 100).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          <Card data-testid="card-sessions-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Session Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-gray-600 text-sm" data-testid="text-no-sessions">No sessions scheduled yet.</p>
                ) : (
                  sessions.map((session, index) => {
                    const { date, time } = formatDateTime(session.date, session.startTime, session.endTime);
                    const isPast = new Date(session.startTime) < now;
                    
                    return (
                      <div 
                        key={session.id} 
                        className={`border rounded-lg p-3 ${isPast ? 'bg-gray-50 opacity-60' : 'bg-white'}`}
                        data-testid={`session-item-${session.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium" data-testid={`text-session-number-${session.id}`}>
                            Session {session.sessionNumber}
                            {isPast && <span className="ml-2 text-xs text-gray-500">(Past)</span>}
                          </div>
                          {session.sessionType && (
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-session-type-${session.id}`}>
                              {session.sessionType}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2" data-testid={`text-session-date-${session.id}`}>
                            <Calendar className="w-3 h-3" />
                            {date}
                          </div>
                          <div className="flex items-center gap-2" data-testid={`text-session-time-${session.id}`}>
                            <Clock className="w-3 h-3" />
                            {time}
                          </div>
                          {(session.location || session.address || session.city) && (
                            <div className="flex items-center gap-2" data-testid={`text-session-location-${session.id}`}>
                              <MapPin className="w-3 h-3" />
                              {session.location || session.address || `${session.city}, ${session.state}`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Promo Code Section */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Promo Code</h3>
            {appliedPromoCode ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    {appliedPromoCode.code} applied
                  </span>
                  <span className="ml-2 text-green-600">
                    (-${(discountAmount / 100).toFixed(2)})
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={removePromoCode}
                  className="text-green-700 hover:text-green-800"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1"
                  data-testid="input-promo-code"
                />
                <Button
                  variant="outline"
                  onClick={() => validatePromoCode(promoCode)}
                  disabled={!promoCode.trim() || isValidatingPromo}
                  data-testid="button-apply-promo"
                >
                  {isValidatingPromo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Account Credits Section */}
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
                      You have ${(creditBalance / 100).toFixed(2)} in account credits
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="use-credits">Use Credits</Label>
                    <Switch
                      id="use-credits"
                      checked={useCredits}
                      onCheckedChange={setUseCredits}
                      data-testid="toggle-credits"
                    />
                  </div>
                </div>
                
                {useCredits && appliedCredits > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      Using ${(appliedCredits / 100).toFixed(2)} from your account credits
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Free Booking Section - When total is $0 */}
          {finalAmount === 0 && (appliedPromoCode || (useCredits && appliedCredits > 0)) ? (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg text-center ${
                appliedPromoCode ? 'bg-green-50' : 'bg-blue-50'
              }`}>
                <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${
                  appliedPromoCode ? 'text-green-600' : 'text-blue-600'
                }`} />
                <h3 className={`font-medium mb-1 ${
                  appliedPromoCode ? 'text-green-800' : 'text-blue-800'
                }`}>
                  {appliedPromoCode 
                    ? 'This package is free with your promo code!' 
                    : 'This package is free with your account credits!'
                  }
                </h3>
                <p className={`text-sm ${
                  appliedPromoCode ? 'text-green-600' : 'text-blue-600'
                }`}>
                  Click below to complete your booking - no payment required.
                </p>
              </div>
              
              <Button 
                className={`w-full text-white ${
                  appliedPromoCode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={() => {
                  freeBookingMutation.mutate({ 
                    packageId: packageData.id, 
                    quantity: quantity,
                    promoCode: appliedPromoCode?.code,
                    appliedCredits: useCredits ? appliedCredits : 0
                  });
                }}
                disabled={freeBookingMutation.isPending}
                data-testid="button-book-free"
              >
                {freeBookingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>Book Free Package {quantity > 1 ? `(${quantity} Spots)` : ''}</>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                By completing this booking, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          ) : clientSecret ? (
            /* Payment Form */
            <Elements options={options} stripe={stripePromise}>
              <TimeBoundPackageCheckoutForm
                packageData={packageData}
                quantity={quantity}
                appliedPromoCode={appliedPromoCode}
                discountAmount={discountAmount}
                finalAmount={finalAmount}
                unitPriceCents={unitPriceCents}
                stripeFee={stripeFee}
                appliedCredits={appliedCredits}
                useCredits={useCredits}
                onPaymentSuccess={() => setIsBookingSuccess(true)}
                setIsBookingSuccess={setIsBookingSuccess}
              />
            </Elements>
          ) : null}

        </div>
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}
