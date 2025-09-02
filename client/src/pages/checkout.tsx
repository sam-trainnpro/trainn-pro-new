import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "../../../hooks/use-auth-simple";
import { Class, Booking } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import { Input } from "@/components/ui/input";

// Declare fbq for Meta Pixel tracking
declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: any) => void;
  }
}

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLISHABLE_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment form component
const CheckoutForm = ({ classItem, quantity, appliedPromoCode, discountAmount, finalAmount, appliedCredits = 0, useCredits = false, onPaymentSuccess, setIsBookingSuccess }: { 
  classItem: Class; 
  quantity: number; 
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
        return_url: window.location.origin + "/checkout/" + classItem.id + "?payment_status=success",
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
      // Payment succeeded, now confirm the booking
      console.log("=== PAYMENT SUCCEEDED ===");
      console.log("Payment Intent:", paymentIntent);
      console.log("Payment Intent ID:", paymentIntent?.id);
      console.log("Class ID:", classItem.id);
      console.log("Quantity:", quantity);
      
      try {
        const confirmResponse = await apiRequest("POST", "/api/payment/confirm", {
          paymentIntentId: paymentIntent?.id,
          classId: classItem.id,
          quantity: quantity,
          promoCode: appliedPromoCode?.code || null,
          appliedCredits: appliedCredits
        });
        
        console.log("Payment confirmation response:", confirmResponse.status);
        
        if (confirmResponse.ok) {
          // Invalidate bookings cache to refresh My Bookings page
          queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
          queryClient.invalidateQueries({ queryKey: [`/api/classes/${classItem.id}/bookings/count`] });
          
          toast({
            title: "Payment Successful",
            description: "Your booking has been confirmed!",
          });
          setPaymentStatus("success");
          
          // IMMEDIATE: Set success state and navigate to prevent any flash
          setIsBookingSuccess?.(true);
          onPaymentSuccess?.();
          navigate("/bookings?refresh=true");
          
          // BACKGROUND: Cleanup queries after navigation
          setTimeout(() => {
            queryClient.removeQueries({ queryKey: ['/api/bookings'] });
            queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
          }, 0);
        } else {
          const errorData = await confirmResponse.json();
          console.error("Payment confirmation failed:", errorData);
          throw new Error(errorData.message || "Failed to confirm booking");
        }
      } catch (confirmError) {
        console.error("Payment confirmation error:", confirmError);
        toast({
          title: "Payment Processed",
          description: "Payment successful, but there was an issue confirming your booking. Please contact support.",
          variant: "destructive",
        });
      }
    }
    
    setIsProcessing(false);
  };
  
  // If payment was successful, show a success message
  if (paymentStatus === "success") {
    return (
      <div className="text-center py-6">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
        <p className="mb-4">Your booking has been confirmed. Redirecting to your bookings...</p>
        <Button 
          variant="outline"
          onClick={() => navigate("/bookings")}
        >
          View My Bookings
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#F7F7F7] rounded-lg p-4">
        <PaymentElement />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Class price {quantity > 1 ? `(${quantity} × $${classItem.price.toFixed(2)})` : ''}</span>
          <span>${(classItem.price * quantity).toFixed(2)}</span>
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
          <span>${((finalAmount * 0.05) / 100).toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>${((finalAmount + (finalAmount * 0.05)) / 100).toFixed(2)}</span>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-primary text-white"
        disabled={!stripe || isProcessing}
        onClick={() => {
          // Track Purchase event in Meta Pixel
          if (window.fbq) {
            window.fbq('track', 'Purchase');
          }
        }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay $${((finalAmount + (finalAmount * 0.05)) / 100).toFixed(2)}`
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        By completing this purchase, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
};

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const [_, params] = useRoute<{ classId: string }>("/checkout/:classId");
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
  const [usePackage, setUsePackage] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  
  // Free booking mutation for 100% discount promo codes
  const freeBookingMutation = useMutation({
    mutationFn: async (data: { classId: number; quantity: number; promoCode?: string }) => {
      const response = await apiRequest("POST", "/api/bookings/free-promo", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to book with promo code");
      }
      return response.json();
    },
    onSuccess: async (result) => {
      const isCreditsBooking = !result.message.includes('promo code');
      
      // IMMEDIATE: Set success state and navigate to prevent any flash
      setIsBookingSuccess(true);
      navigate("/bookings");
      
      // BACKGROUND: Show toast and cleanup queries after navigation
      setTimeout(() => {
        toast({
          title: "Booking confirmed!",
          description: isCreditsBooking 
            ? "Your free class booking has been confirmed with account credits."
            : "Your free class booking has been confirmed with promo code.",
        });
        
        // Background cleanup - invalidate queries for fresh data on next visit
        queryClient.removeQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}/bookings/count`] });
        queryClient.invalidateQueries({ queryKey: [`/api/bookings/class/${classId}`] });
        
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
          ? "Failed to book free class with account credits" 
          : "Failed to book free class with promo code"),
        variant: "destructive",
      });
    },
  });
  
  // Package booking mutation for package-based payments
  const packageBookingMutation = useMutation({
    mutationFn: async (data: { classId: number; quantity: number; packageId: number }) => {
      const response = await apiRequest("POST", "/api/bookings/package", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to book with package");
      }
      return response.json();
    },
    onSuccess: async (result) => {
      // IMMEDIATE: Set success state and navigate to prevent any flash
      setIsBookingSuccess(true);
      navigate("/bookings");
      
      // BACKGROUND: Show toast and cleanup queries after navigation
      setTimeout(() => {
        toast({
          title: "Booking confirmed!",
          description: "Your class booking has been confirmed using your package.",
        });
        
        // Background cleanup - invalidate queries for fresh data on next visit
        queryClient.removeQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}/bookings/count`] });
        queryClient.invalidateQueries({ queryKey: [`/api/bookings/class/${classId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/packages'] });
      }, 0);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message || "Failed to book class with package",
        variant: "destructive",
      });
    },
  });
  
  // Get quantity from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const quantity = parseInt(urlParams.get('quantity') || '1');
  const paymentStatus = urlParams.get('payment_status');
  
  // Redirect if not logged in
  if (!user) {
    navigate("/auth");
    return null;
  }
  
  if (!params) {
    navigate("/classes");
    return null;
  }
  
  const classId = parseInt(params.classId);
  
  // Fetch class details FIRST - other queries depend on this
  const { 
    data: classItem, 
    isLoading: isLoadingClass, 
    error: classError 
  } = useQuery<Class>({
    queryKey: [`/api/classes/${classId}`],
  });
  
  // Fetch user credit balance
  const { data: creditData, refetch: refetchCredits } = useQuery({
    queryKey: ['/api/credits/balance'],
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
  });
  
  const creditBalance = (creditData as { balance?: number })?.balance || 0;
  
  // Log credit balance for debugging
  useEffect(() => {
    console.log('Credit balance fetched:', creditBalance);
  }, [creditBalance]);
  
  // Fetch user's referral status to check if they should get automatic credit
  const { data: referralStatus } = useQuery({
    queryKey: ['/api/referrals/my-status'],
    enabled: !!user,
  });
  
  // Fetch user's booking history to check if this is their first purchase
  const { data: userBookings } = useQuery({   
    queryKey: ['/api/bookings'],
    enabled: !!user,
  });

  // Fetch user's purchased packages to check eligibility for package payment
  const { data: userPackages } = useQuery({
    queryKey: ['/api/user/packages'],
    enabled: !!user && !!classItem,
  });

  // Check if class is eligible for any purchased packages
  const eligiblePackage = React.useMemo(() => {
    if (!userPackages || !classItem || !Array.isArray(userPackages)) return null;
    
    try {
      return userPackages.find((pkg: any) => {
        // Only consider packages with remaining classes
        if (!pkg || pkg.remainingClasses <= 0) return false;
        
        // Check if class is in package's eligible classes
        if (!pkg.packageDetails?.eligibleClasses) return false;
        
        try {
          const eligibleClassIds = JSON.parse(pkg.packageDetails.eligibleClasses);
          if (!Array.isArray(eligibleClassIds)) return false;
          
          return eligibleClassIds.some((eligibleId: string) => {
            // Check if it's a series ID (starts with 'series_')
            if (eligibleId.startsWith('series_')) {
              return classItem.recurringSeriesId === eligibleId;
            } else {
              // Compare with the class ID directly
              return classItem.id.toString() === eligibleId;
            }
          });
        } catch (e) {
          console.warn('Failed to parse eligible classes:', pkg.packageDetails?.eligibleClasses);
          return false;
        }
      }) || null;
    } catch (e) {
      console.warn('Error finding eligible package:', e);
      return null;
    }
  }, [userPackages, classItem]);
  
  // Check if user is eligible for automatic referral credit (first-time purchase via referral)
  const isFirstTimeReferralUser = React.useMemo(() => {
    if (!referralStatus || !userBookings) return false;
    
    // Type the referralStatus properly
    const status = referralStatus as { status?: string; isReferral?: boolean };
    
    // User must have signed up via referral and not yet completed their first purchase
    const hasReferral = status.status === 'signed_up';
    
    // Check for COMPLETED bookings only (not pending ones from failed attempts)
    const completedBookings = Array.isArray(userBookings) ? 
      userBookings.filter((booking: any) => booking.status === 'confirmed') : [];
    const hasNoCompletedBookings = completedBookings.length === 0;
    
    console.log("🎯 Referral eligibility check:", {
      hasReferral,
      totalBookings: Array.isArray(userBookings) ? userBookings.length : 0,
      completedBookings: completedBookings.length,
      hasNoCompletedBookings,
      isEligible: hasReferral && hasNoCompletedBookings
    });
    
    return hasReferral && hasNoCompletedBookings;
  }, [referralStatus, userBookings]);
  
  // Class details already fetched above

  // Validate promo code function
  const validatePromoCode = async (code: string) => {
    if (!code.trim()) return;
    
    setIsValidatingPromo(true);
    try {
      const response = await apiRequest('POST', '/api/promo-codes/validate', {
        code: code.toUpperCase(),
        classId: classId,
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
        const errorResult = await response.json();
        toast({
          title: "Invalid Promo Code",
          description: "This promo code has already been used or is not eligible for this purchase.",
          variant: "destructive",
        });
        // Reset promo code states
        setAppliedPromoCode(null);
        setDiscountAmount(0);
        setFinalAmount(classItem ? classItem.price * quantity * 100 : 0);
      }
    } catch (error) {
      toast({
        title: "Promo Code Not Accepted",
        description: "This promo code has already been used or is not eligible for this purchase.",
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
    setFinalAmount(classItem ? classItem.price * quantity * 100 : 0);
  };
  
  // Fetch booking to check if user has already booked
  const { 
    data: bookings,
    isLoading: isLoadingBookings
  } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });
  
  // Fetch booking count to check availability
  const { 
    data: bookingCount,
    isLoading: isLoadingBookingCount
  } = useQuery<{
    total: number;
    active: number;
    totalSpotsBooked: number;
    capacity: number;
    spotsLeft: number;
  }>({
    queryKey: [`/api/classes/${classId}/bookings/count`],
  });
  
  // Check if this class is already booked by the user
  const userBooking = bookings?.find(booking => 
    booking.classId === classId && booking.status === 'confirmed'
  );
  
  // Handle successful payment redirect from Amazon Pay
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (paymentStatus === 'success' && classItem) {
        console.log("=== PROCESSING AMAZON PAY SUCCESS REDIRECT ===");
        setIsLoading(true);
        
        try {
          // Get the payment intent from URL parameters
          const paymentIntentId = urlParams.get('payment_intent');
          if (!paymentIntentId) {
            throw new Error("Payment intent ID not found in URL");
          }
          
          console.log("Payment Intent ID from URL:", paymentIntentId);
          
          const confirmResponse = await apiRequest("POST", "/api/payment/confirm", {
            paymentIntentId: paymentIntentId,
            classId: classItem.id,
            quantity: quantity,
            appliedCredits: appliedCredits
          });
          
          if (confirmResponse.ok) {
            // Invalidate bookings cache to refresh My Bookings page
            queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
            queryClient.invalidateQueries({ queryKey: [`/api/classes/${classItem.id}/bookings/count`] });
            
            toast({
              title: "Payment Successful",
              description: "Your booking has been confirmed!",
            });
            
            // Force refresh bookings data before navigating
            await queryClient.refetchQueries({ queryKey: ['/api/bookings'] });
            
            // Redirect to bookings page after successful payment
            setTimeout(() => {
              navigate("/bookings?refresh=true");
            }, 2000);
          } else {
            const errorData = await confirmResponse.json();
            console.error("Payment confirmation failed:", errorData);
            throw new Error(errorData.message || "Failed to confirm booking");
          }
        } catch (error: any) {
          console.error("Error processing payment success:", error);
          toast({
            title: "Payment Processing Error",
            description: error.message || "There was an issue processing your payment. Please contact support.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    if (paymentStatus === 'success' && classItem) {
      handlePaymentSuccess();
    }
  }, [paymentStatus, classItem, classId, quantity, toast, navigate, queryClient]);

  // Reset client secret when key parameters change to ensure new payment intent creation
  useEffect(() => {
    if (clientSecret) {
      console.log("🔄 Resetting client secret due to parameter change", {
        appliedCredits,
        useCredits,
        appliedPromoCode: appliedPromoCode?.code,
        discountAmount
      });
      setClientSecret("");
    }
  }, [appliedCredits, useCredits, appliedPromoCode, discountAmount]);

  // Removed separate credit auto-application - now handled in payment intent logic

  // Calculate final amount - runs when class loads or any payment option changes
  useEffect(() => {
    if (!classItem || creditBalance === undefined) return;
    
    const baseAmount = classItem.price * quantity * 100; // Amount in cents
    const discountToApply = appliedPromoCode ? discountAmount : 0;
    const amountAfterPromo = Math.max(0, baseAmount - discountToApply);
    
    // Calculate credits to apply if credits are enabled
    if (useCredits && creditBalance > 0) {
      const creditsToApply = Math.min(creditBalance, amountAfterPromo);
      setAppliedCredits(creditsToApply);
    } else {
      setAppliedCredits(0);
    }
    
    // Calculate final amount with credits and package options
    let calculatedAmount;
    
    if (usePackage && eligiblePackage) {
      // If using package, final amount is 0 (already paid for in package)
      calculatedAmount = 0;
    } else {
      // Normal calculation with credits
      const creditToApply = useCredits ? appliedCredits : 0;
      calculatedAmount = Math.max(0, amountAfterPromo - creditToApply);
    }
    
    console.log("💰 Final amount calculation:", {
      baseAmount: baseAmount / 100,
      creditToApply: useCredits ? appliedCredits / 100 : 0,
      discountToApply: discountToApply / 100,
      calculatedAmount: calculatedAmount / 100,
      useCredits,
      usePackage,
      appliedCredits,
      hasEligiblePackage: !!eligiblePackage,
      hasPromoCode: !!appliedPromoCode
    });
    
    setFinalAmount(calculatedAmount);
  }, [
    classItem?.id, 
    classItem?.price,
    quantity, 
    creditBalance, 
    appliedPromoCode?.code, 
    discountAmount, 
    useCredits, 
    appliedCredits, 
    usePackage, 
    eligiblePackage?.id,
    eligiblePackage?.remainingClasses
  ]);

  // Consolidated payment intent creation - ensures proper sequencing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const createPaymentIntent = async () => {
      try {
        console.log("🚦 Payment Intent Decision Point:", {
          hasClassItem: !!classItem,
          hasUserBooking: !!userBooking,
          paymentStatus,
          finalAmount: finalAmount / 100,
          hasClientSecret: !!clientSecret,
          isFirstTimeReferralUser,
          creditBalance,
          useCredits,
          appliedCredits,
          timestamp: new Date().toISOString()
        });
        
        // Strict validation - all data must be loaded
        if (!classItem || !referralStatus || !userBookings || creditBalance === null) {
          console.log("⏳ Waiting for all data to load...");
          return;
        }
        
        // No booking for existing bookings or successful payments
        if (userBooking || paymentStatus === 'success') {
          console.log("⚠️ Skip payment intent - already booked or paid");
          return;
        }
        
        // Don't create if we already have a client secret
        if (clientSecret) {
          console.log("⚠️ Skip payment intent - already exists");
          return;
        }
        
        // For free bookings, skip payment intent
        if (finalAmount === 0) {
          console.log("💰 Free booking detected, skipping payment intent");
          return;
        }
        
        // Skip payment intent creation if using package (no payment needed)
        if (usePackage && eligiblePackage) {
          console.log("📦 Using package - no payment intent needed");
          return;
        }
        
        setIsLoading(true);
        setError(null);
        
        // Calculate final amount
        const amountToCharge = finalAmount;
        const totalWithFee = amountToCharge + (amountToCharge * 0.05);
        
        console.log("🔥 CREATING SINGLE PAYMENT INTENT:", {
          finalAmount: finalAmount / 100,
          totalWithFee: totalWithFee / 100,
          appliedCredits,
          useCredits,
          isFirstTimeReferralUser,
          creditBalance,
          timestamp: new Date().toISOString()
        });
        
        const res = await apiRequest("POST", "/api/payment/create-intent", { 
          classId, 
          quantity,
          amount: totalWithFee / 100,
          promoCode: appliedPromoCode?.code || null,
          useCredits: useCredits,
          appliedCredits: appliedCredits
        });
        const data = await res.json();
        
        setClientSecret(data.clientSecret);
        console.log("✅ Payment intent created with amount:", totalWithFee / 100);
        
      } catch (err: any) {
        setError(err.message || "Failed to initialize payment");
        toast({
          title: "Payment Initialization Failed",
          description: err.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Run with slight delay to allow state to stabilize
    timeoutId = setTimeout(createPaymentIntent, 150);
    
    return () => clearTimeout(timeoutId);
  }, [
    classItem, userBooking, paymentStatus, clientSecret, finalAmount,
    isFirstTimeReferralUser, creditBalance, useCredits, appliedCredits, 
    referralStatus, userBookings, appliedPromoCode, classId, quantity, toast
  ]);
  
  // Format dates
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "EEEE, MMMM d, yyyy");
  };
  
  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "h:mm a");
  };
  
  // Show processing state for Amazon Pay redirect
  if (paymentStatus === 'success' && isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-[#F7F7F7] py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <h2 className="text-xl font-bold mb-2">Processing Your Payment</h2>
                <p className="text-muted-foreground">
                  Please wait while we confirm your booking...
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // If user has already booked and confirmed this class (but not during success flow)
  if (userBooking && userBooking.status === 'confirmed' && !isBookingSuccess) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-[#F7F7F7] py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={() => navigate(`/classes/${classId}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Class
              </Button>
              
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Already Booked</h2>
                  <p className="text-muted-foreground mb-6">
                    You've already booked and paid for this class.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild variant="outline">
                      <Link href={`/classes/${classId}`}>View Class Details</Link>
                    </Button>
                    <Button asChild className="bg-primary text-white">
                      <Link href="/bookings">View My Bookings</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If class is full (0 spots left)
  if (bookingCount && bookingCount.spotsLeft === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-[#F7F7F7] py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={() => navigate(`/classes/${classId}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Class
              </Button>
              
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Class is Full</h2>
                  <p className="text-muted-foreground mb-6">
                    This class is full, please check back again later in case there are cancellations.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild variant="outline">
                      <Link href={`/classes/${classId}`}>View Class Details</Link>
                    </Button>
                    <Button asChild className="bg-primary text-white">
                      <Link href="/">Browse Other Classes</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Complete Booking - Trainn Fitness</title>
        <meta name="description" content="Complete your fitness class booking. Secure checkout with payment processing." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow bg-[#F7F7F7] py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="mb-4"
              onClick={() => navigate(`/classes/${classId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Class
            </Button>
            <h1 className="text-2xl md:text-3xl font-heading font-bold">Complete Your Booking</h1>
          </div>
          
          {isLoadingClass || isLoadingBookings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            </div>
          ) : classError ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Class Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  The class you're trying to book doesn't exist or may have been removed.
                </p>
                <Button asChild>
                  <Link href="/classes">Browse Classes</Link>
                </Button>
              </CardContent>
            </Card>
          ) : classItem ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{classItem.title}</CardTitle>
                  <CardDescription>
                    {formatDate(classItem.startTime)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{classItem.location}</p>
                        <p className="text-sm text-muted-foreground">{classItem.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Booking for</p>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Initializing payment...</p>
                    </div>
                  ) : error ? (
                    <div className="py-8 text-center">
                      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                      <p className="text-destructive font-medium mb-2">Payment initialization failed</p>
                      <p className="text-muted-foreground mb-4">{error}</p>
                      <Button 
                        onClick={() => navigate(`/classes/${classId}`)}
                        variant="outline"
                      >
                        Return to Class
                      </Button>
                    </div>
                  ) : finalAmount === 0 && (appliedPromoCode || (useCredits && appliedCredits > 0)) ? (
                    <>
                      {/* Promo Code Section for Free Booking */}
                      {appliedPromoCode && (
                        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                          <h3 className="font-medium mb-3">Promo Code</h3>
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              <span className="text-green-800 font-medium">
                                {appliedPromoCode.code} applied - 100% OFF!
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
                        </div>
                      )}

                      {/* Credit Application Section for Free Booking */}
                      {useCredits && appliedCredits > 0 && (
                        <div className="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
                          <h3 className="font-medium mb-3">Account Credits Applied</h3>
                          <div className="flex items-center justify-between p-3 bg-blue-100 border border-blue-200 rounded">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="text-blue-800 font-medium">
                                Credits Applied - 100% OFF!
                              </span>
                              <span className="ml-2 text-blue-600">
                                (-${(appliedCredits / 100).toFixed(2)})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Free Booking Section */}
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Class price {quantity > 1 ? `(${quantity} × $${classItem.price.toFixed(2)})` : ''}</span>
                            <span>${(classItem.price * quantity).toFixed(2)}</span>
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
                          <Separator />
                          <div className="flex justify-between font-medium text-lg">
                            <span>Total</span>
                            <span className="text-green-600">FREE</span>
                          </div>
                        </div>
                        
                        <div className={`p-4 rounded-lg text-center ${
                          usePackage ? 'bg-purple-50' : 
                          appliedPromoCode ? 'bg-green-50' : 'bg-blue-50'
                        }`}>
                          <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${
                            usePackage ? 'text-purple-600' : 
                            appliedPromoCode ? 'text-green-600' : 'text-blue-600'
                          }`} />
                          <h3 className={`font-medium mb-1 ${
                            usePackage ? 'text-purple-800' : 
                            appliedPromoCode ? 'text-green-800' : 'text-blue-800'
                          }`}>
                            {usePackage && eligiblePackage 
                              ? `This class is included in your ${eligiblePackage?.packageDetails?.name || 'package'}!`
                              : appliedPromoCode 
                                ? 'This class is free with your promo code!' 
                                : 'This class is free with your account credits!'
                            }
                          </h3>
                          <p className={`text-sm ${
                            usePackage ? 'text-purple-600' : 
                            appliedPromoCode ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            Click below to complete your booking - no payment required.
                          </p>
                        </div>
                        
                        <Button 
                          className={`w-full text-white ${
                            usePackage ? 'bg-purple-600 hover:bg-purple-700' :
                            appliedPromoCode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          onClick={() => {
                            // Track Purchase event in Meta Pixel (even for free bookings)
                            if (window.fbq) {
                              window.fbq('track', 'Purchase');
                            }
                            
                            if (usePackage && eligiblePackage?.id) {
                              // Handle package booking
                              packageBookingMutation.mutate({ 
                                classId: classItem.id, 
                                quantity: quantity,
                                packageId: eligiblePackage.id
                              });
                            } else if (appliedPromoCode) {
                              freeBookingMutation.mutate({ 
                                classId: classItem.id, 
                                quantity: quantity,
                                promoCode: appliedPromoCode.code
                              });
                            } else {
                              // Handle free booking with credits
                              freeBookingMutation.mutate({ 
                                classId: classItem.id, 
                                quantity: quantity
                              });
                            }
                          }}
                          disabled={freeBookingMutation.isPending || packageBookingMutation.isPending}
                        >
                          {(freeBookingMutation.isPending || packageBookingMutation.isPending) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Booking...
                            </>
                          ) : (
                            <>
                              {usePackage && eligiblePackage 
                                ? `Book with Package ${quantity > 1 ? `(${quantity} Spots)` : ''}` 
                                : `Book Free Class ${quantity > 1 ? `(${quantity} Spots)` : ''}`
                              }
                            </>
                          )}
                        </Button>
                        
                        <p className="text-xs text-muted-foreground text-center">
                          By completing this booking, you agree to our Terms of Service and Privacy Policy.
                        </p>
                      </div>
                    </>
                  ) : clientSecret ? (
                    <>
                      {/* Promo Code Section */}
                      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
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
                            />
                            <Button
                              variant="outline"
                              onClick={() => validatePromoCode(promoCode)}
                              disabled={!promoCode.trim() || isValidatingPromo}
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

                      {/* Payment Methods Section */}
                      {(creditBalance > 0 || eligiblePackage) && (
                        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                          <h3 className="font-medium mb-4">Payment Options</h3>
                          
                          {/* Package Payment Option */}
                          {eligiblePackage && (
                            <div className="mb-4">
                              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  checked={usePackage}
                                  onChange={(e) => {
                                    setUsePackage(e.target.checked);
                                    if (e.target.checked) {
                                      setUseCredits(false);
                                    }
                                  }}
                                  className="w-4 h-4 text-primary"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">Use Package: {eligiblePackage?.packageDetails?.name || 'Unknown Package'}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {eligiblePackage?.remainingClasses || 0} classes remaining • Already paid
                                  </div>
                                </div>
                              </label>
                            </div>
                          )}
                          
                          {/* Credits Payment Option */}
                          {creditBalance > 0 && (
                            <div className="mb-4">
                              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  checked={useCredits && !usePackage}
                                  onChange={(e) => {
                                    setUseCredits(e.target.checked);
                                    if (e.target.checked) {
                                      setUsePackage(false);
                                    }
                                  }}
                                  className="w-4 h-4 text-primary"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">Use Account Credits</div>
                                  <div className="text-xs text-muted-foreground">
                                    Available: ${(creditBalance / 100).toFixed(2)}
                                    {useCredits && appliedCredits > 0 && ` • Applying: $${(appliedCredits / 100).toFixed(2)}`}
                                  </div>
                                </div>
                              </label>
                              {isFirstTimeReferralUser && (
                                <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800">
                                  Welcome bonus! You've received $5.00 credit for joining via referral.
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Regular Payment Option */}
                          <div className="mb-4">
                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="paymentMethod"
                                checked={!useCredits && !usePackage}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setUseCredits(false);
                                    setUsePackage(false);
                                  }
                                }}
                                className="w-4 h-4 text-primary"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">Pay with Card</div>
                                <div className="text-xs text-muted-foreground">
                                  Credit or debit card
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}

                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm 
                          classItem={classItem} 
                          quantity={quantity}
                          appliedPromoCode={appliedPromoCode}
                          discountAmount={discountAmount}
                          finalAmount={finalAmount}
                          appliedCredits={appliedCredits}
                          useCredits={useCredits}
                          onPaymentSuccess={() => setIsBookingSuccess(true)}
                          setIsBookingSuccess={setIsBookingSuccess}
                        />
                      </Elements>
                    </>
                  ) : !appliedPromoCode ? (
                    <>
                      {/* Promo Code Section without payment form */}
                      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-medium mb-3">Promo Code</h3>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter promo code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={() => validatePromoCode(promoCode)}
                            disabled={!promoCode.trim() || isValidatingPromo}
                          >
                            {isValidatingPromo ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Apply'
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="py-8 text-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Apply a promo code to continue with your booking.</p>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
