import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
import { Helmet } from "react-helmet";
import { Package, User, Calendar, CheckCircle, CreditCard, Loader2, Clock, MapPin, CalendarDays } from "lucide-react";
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
  finalAmount,
  proratedAmount,
  stripeFee,
  onPaymentSuccess, 
  setIsBookingSuccess 
}: { 
  packageData: TimeBoundPackage; 
  finalAmount: number;
  proratedAmount: number | null;
  stripeFee: number;
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
        return_url: window.location.origin + "/time-bound-package-checkout?packageId=" + packageData.id + "&payment_status=success",
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
      console.log("=== TIME-BOUND PACKAGE PAYMENT SUCCEEDED ===");
      console.log("Payment Intent:", paymentIntent);
      console.log("Payment Intent ID:", paymentIntent?.id);
      console.log("Package ID:", packageData.id);
      
      try {
        const bookResponse = await apiRequest("POST", `/api/time-bound-packages/${packageData.id}/book`, {
          paymentIntentId: paymentIntent?.id,
          stripeFee: stripeFee
        });
        
        console.log("Time-bound package booking response:", bookResponse.status);
        
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
        console.error("Package booking error:", error);
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
            Complete Purchase • ${finalAmount.toFixed(2)}
          </>
        )}
      </Button>
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
  const [proratedAmount, setProratedAmount] = useState<number | null>(null);
  const [finalAmount, setFinalAmount] = useState(0);
  const [stripeFee, setStripeFee] = useState(0);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get URL parameter for package ID
  const urlParams = new URLSearchParams(window.location.search);
  const packageId = urlParams.get('packageId') ? parseInt(urlParams.get('packageId')!) : null;

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

  // Initialize payment intent when package data is loaded
  useEffect(() => {
    if (packageData && user && !clientSecret) {
      initializePayment();
    }
  }, [packageData, user]);

  const initializePayment = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest("POST", "/api/time-bound-package-payment/create-intent", {
        packageId: packageData!.id
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initialize payment");
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setFinalAmount(data.finalAmount);
      setProratedAmount(data.proratedAmount);
      
      // Calculate Stripe fee (5% of final amount)
      const fee = data.finalAmount * 0.05;
      setStripeFee(fee);
      
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

  const basePrice = proratedAmount || packageData.price || 0;
  const processingFee = basePrice * 0.05;
  const totalAmount = basePrice + processingFee;

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
            onClick={() => navigate('/packages')}
            className="mb-4"
            data-testid="button-back"
          >
            ← Back to Packages
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
                </div>
              </div>

              {isProrated && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" data-testid="alert-prorated">
                  <p className="text-sm text-blue-800 font-medium">
                    💡 Prorated Pricing Applied
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Joining with {remainingSessions} of {packageData.totalSessions} sessions remaining. 
                    Price adjusted from ${packageData.price} to ${proratedAmount?.toFixed(2)}.
                  </p>
                </div>
              )}

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span data-testid="text-label-package-price">Package price</span>
                  <span data-testid="text-value-package-price">${basePrice.toFixed(2)}</span>
                </div>
                {isProrated && packageData.price && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span data-testid="text-label-original-price">Original price</span>
                    <span className="line-through" data-testid="text-value-original-price">${packageData.price.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span data-testid="text-label-processing-fee">Processing fee (5%)</span>
                  <span data-testid="text-value-processing-fee">${processingFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span data-testid="text-label-total">Total</span>
                  <span className="text-lg" data-testid="text-value-total">${totalAmount.toFixed(2)}</span>
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
                            <Calendar className="w-4 h-4" />
                            {date}
                          </div>
                          <div className="flex items-center gap-2" data-testid={`text-session-time-${session.id}`}>
                            <Clock className="w-4 h-4" />
                            {time}
                          </div>
                          {(session.location || session.address || session.city) && (
                            <div className="flex items-center gap-2" data-testid={`text-session-location-${session.id}`}>
                              <MapPin className="w-4 h-4" />
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

          {/* Payment Form */}
          {clientSecret && (
            <Elements options={options} stripe={stripePromise}>
              <TimeBoundPackageCheckoutForm
                packageData={packageData}
                finalAmount={totalAmount}
                proratedAmount={proratedAmount}
                stripeFee={stripeFee}
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
