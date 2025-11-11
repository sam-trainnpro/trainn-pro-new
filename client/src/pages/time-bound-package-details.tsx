import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "../../../hooks/use-auth-simple";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import GoogleMapsScript from "@/components/maps/google-maps-script";
import LocationPreview from "@/components/maps/location-preview";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  DollarSign, 
  Star,
  Package as PackageIcon,
  AlertCircle,
  CheckCircle,
  UserCheck,
  Plus,
  Minus,
  CreditCard,
  Loader2,
  Tag
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "../../../hooks/use-toast";
import { formatInTimeZone } from "date-fns-tz";
import { Helmet } from "react-helmet";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

// Payment Form Component
function PaymentForm({
  packageId,
  quantity,
  finalAmount,
  stripeFee,
  appliedPromoCode,
  appliedCredits,
  onSuccess
}: {
  packageId: number;
  quantity: number;
  finalAmount: number;
  stripeFee: number;
  appliedPromoCode: any;
  appliedCredits: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

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

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/package/" + packageId,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      try {
        const bookResponse = await apiRequest("POST", `/api/time-bound-packages/${packageId}/book`, {
          paymentIntentId: paymentIntent?.id,
          quantity: quantity,
          stripeFee: stripeFee,
          promoCode: appliedPromoCode?.code || null,
          appliedCredits: appliedCredits
        });
        
        if (bookResponse.ok) {
          toast({
            title: "Package booked!",
            description: "You've successfully booked this package",
          });
          onSuccess();
        } else {
          throw new Error("Failed to book package");
        }
      } catch (error) {
        toast({
          title: "Booking Error",
          description: "Payment succeeded but booking failed. Please contact support.",
          variant: "destructive",
        });
      }
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Complete Purchase • ${((finalAmount + stripeFee) / 100).toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

// Free Booking Button Component
function FreeBookingButton({
  packageId,
  quantity,
  appliedPromoCode,
  appliedCredits,
  onSuccess
}: {
  packageId: number;
  quantity: number;
  appliedPromoCode: any;
  appliedCredits: number;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFreeBooking = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", `/api/time-bound-package-payment/free-booking`, {
        packageId: packageId,
        quantity: quantity,
        promoCode: appliedPromoCode?.code || null,
        appliedCredits: appliedCredits
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to book package");
      }

      toast({
        title: "Package booked!",
        description: "You've successfully booked this package",
      });
      
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Booking Error",
        description: err.message || "Failed to book package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handleFreeBooking}
      className="w-full" 
      size="lg"
      disabled={isProcessing}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Booking...
        </>
      ) : (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Complete Free Booking
        </>
      )}
    </Button>
  );
}

interface TimeBoundPackageSession {
  id: number;
  packageId: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  notes: string | null;
  sessionType: string | null;
}

interface TimeBoundPackageDetails {
  id: number;
  coachId: number;
  coachName: string;
  coachBusinessName?: string;
  displayBusinessName?: boolean;
  coachProfileImage?: string;
  coachBio?: string;
  title: string;
  description: string | null;
  totalSessions: number | null;
  price: number | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  allowLateJoin: boolean | null;
  location: string | null;
  address: string | null;
  categoryId: number | null;
  categoryName?: string;
  ageGroup: string;
  image: string | null;
  whatToBring: string | null;
  sessions: TimeBoundPackageSession[];
  bookedCount?: number;
}

export default function TimeBoundPackageDetailsPage() {
  const [, navigate] = useLocation();
  const [_, params] = useRoute<{ id: string }>("/package/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  
  // Payment state
  const [clientSecret, setClientSecret] = useState("");
  const [unitPriceCents, setUnitPriceCents] = useState<number | null>(null);
  const [finalAmount, setFinalAmount] = useState(0);
  const [stripeFee, setStripeFee] = useState(0);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success">("idle");
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  
  // Credits state
  const [useCredits, setUseCredits] = useState(false);
  const [appliedCredits, setAppliedCredits] = useState(0);
  
  // Fetch user credit balance
  const { data: creditData } = useQuery<{ balance: string }>({
    queryKey: ['/api/credits/balance'],
    enabled: !!user,
  });
  
  const creditBalance = creditData ? parseInt(creditData.balance) : 0;

  if (!params) {
    navigate("/packages");
    return null;
  }
  
  const packageId = parseInt(params.id);

  // Scroll to top when component mounts or package ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [packageId]);
  
  // Fetch package details with explicit queryFn
  const { 
    data: packageDetails, 
    isLoading: isLoadingPackage, 
    error: packageError 
  } = useQuery<TimeBoundPackageDetails>({
    queryKey: [`/api/time-bound-packages/${packageId}`],
    queryFn: async () => {
      const response = await fetch(`/api/time-bound-packages/${packageId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch package details');
      }
      return response.json();
    },
  });

  // Get rating statistics for the provider
  const { data: coachRatingStats } = useQuery({
    queryKey: ['/api/reviews/coach', packageDetails?.coachId, 'stats'],
    queryFn: () => fetch(`/api/reviews/coach/${packageDetails?.coachId}/stats`).then(res => res.json()),
    enabled: !!packageDetails?.coachId,
  });
  
  // Get recent reviews for the provider
  const { data: coachReviews } = useQuery({
    queryKey: [`/api/reviews/coach/${packageDetails?.coachId}`, { limit: 2 }],
    queryFn: () => fetch(`/api/reviews/coach/${packageDetails?.coachId}?limit=2`).then(res => res.json()),
    enabled: !!packageDetails?.coachId,
  });

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    const timeZone = 'America/Los_Angeles';
    return formatInTimeZone(date, timeZone, "EEEE, MMMM d, yyyy");
  };
  
  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Time not available';
    const date = new Date(dateString);
    const timeZone = 'America/Los_Angeles';
    return formatInTimeZone(date, timeZone, "h:mm a") + " PT";
  };

  const initializePayment = async () => {
    if (!user || !packageDetails) return;
    
    try {
      setIsInitializingPayment(true);
      
      const response = await apiRequest("POST", "/api/time-bound-package-payment/create-intent", {
        packageId: packageId,
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
      if (data.requiresPayment) {
        setClientSecret(data.clientSecret);
        setFinalAmount(data.subtotal);
        setStripeFee(data.stripeFee);
        setUnitPriceCents(data.unitPriceCents);
      } else {
        // Free booking
        setFinalAmount(0);
        setStripeFee(0);
        setUnitPriceCents(data.unitPriceCents);
      }
      
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializingPayment(false);
    }
  };

  // Promo code validation
  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingPromo(true);
    try {
      const response = await apiRequest("POST", "/api/time-bound-package-payment/validate-promo", {
        code: promoCode.trim(),
        packageId: packageId,
        quantity: quantity
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid promo code");
      }

      const data = await response.json();
      setAppliedPromoCode(data.promoCode);
      setDiscountAmount(data.discountAmount);
      
      toast({
        title: "Promo code applied!",
        description: `You saved $${(data.discountAmount / 100).toFixed(2)}`,
      });

      // Reinitialize payment with promo code
      await initializePayment();
    } catch (err: any) {
      toast({
        title: "Invalid Code",
        description: err.message || "This promo code cannot be applied",
        variant: "destructive",
      });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const removePromoCode = async () => {
    setAppliedPromoCode(null);
    setDiscountAmount(0);
    setPromoCode("");
    
    toast({
      title: "Promo code removed",
    });

    // Reinitialize payment without promo code
    await initializePayment();
  };

  // Credit management
  useEffect(() => {
    if (!packageDetails) return;
    
    const basePrice = (packageDetails.price || 0) * quantity;
    const basePriceCents = Math.round(basePrice * 100);
    const afterDiscount = basePriceCents - discountAmount;
    const creditsToApply = Math.min(creditBalance, Math.max(0, afterDiscount));
    
    setAppliedCredits(useCredits ? creditsToApply : 0);
  }, [useCredits, creditBalance, packageDetails, quantity, discountAmount]);

  // Initialize payment when package loads
  useEffect(() => {
    if (packageDetails && user) {
      initializePayment();
    }
  }, [packageDetails, user]);

  // Reinitialize payment when quantity, credits, or promo changes
  useEffect(() => {
    if (packageDetails && user && (appliedCredits || appliedPromoCode || quantity)) {
      initializePayment();
    }
  }, [appliedCredits, useCredits, appliedPromoCode, quantity]);

  const displayName = packageDetails?.displayBusinessName && packageDetails?.coachBusinessName 
    ? packageDetails.coachBusinessName 
    : packageDetails?.coachName;

  // Handle capacity correctly: null = unlimited, 0 = full, number = limited
  const spotsRemaining = packageDetails?.capacity !== null && packageDetails?.capacity !== undefined
    ? Math.max(0, packageDetails.capacity - (packageDetails.bookedCount || 0))
    : null; // null means unlimited capacity
  
  const isUnlimitedCapacity = packageDetails?.capacity === null || packageDetails?.capacity === undefined;
  const isProgramFull = spotsRemaining === 0;

  // Clamp quantity when capacity changes to prevent over-booking
  useEffect(() => {
    if (isUnlimitedCapacity) {
      // For unlimited capacity, cap at 10
      if (quantity > 10) {
        setQuantity(10);
      }
    } else if (spotsRemaining !== null && quantity > spotsRemaining) {
      // For limited capacity, clamp to available spots
      setQuantity(Math.max(1, spotsRemaining));
    }
  }, [spotsRemaining, isUnlimitedCapacity, quantity]);

  return (
    <div className="flex flex-col min-h-screen">
      {packageDetails && (
        <Helmet>
          <title>{`${packageDetails.title} - ${packageDetails.totalSessions} Sessions - Trainn`}</title>
          <meta name="description" content={packageDetails.description || `${packageDetails.totalSessions} session package with ${displayName}`} />
          <link rel="canonical" href={`https://trainn.pro/package/${packageDetails.id}`} />
          <meta property="og:title" content={`${packageDetails.title} - Trainn`} />
          <meta property="og:description" content={packageDetails.description || ''} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={`https://trainn.pro/package/${packageDetails.id}`} />
          <meta property="og:image" content={packageDetails.image || "https://trainn.pro/default-package-image.jpg"} />
        </Helmet>
      )}
      
      <Header />
      
      <main className="flex-grow bg-[#F7F7F7] py-6 md:py-8">
        <div className="container mx-auto px-4">
          {isLoadingPackage ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <div className="h-64 md:h-80 rounded-xl overflow-hidden">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          ) : packageError ? (
            <div className="p-8 bg-white rounded-xl shadow-sm text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">Package Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The package you're looking for doesn't exist or may have been removed.
              </p>
              <Button asChild>
                <Link href="/packages">Browse Packages</Link>
              </Button>
            </div>
          ) : packageDetails ? (
            <>
              <div className="mb-6">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold">{packageDetails.title}</h1>
                    <div className="flex items-center text-muted-foreground mt-1">
                      {packageDetails.location && (
                        <>
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{packageDetails.location}</span>
                        </>
                      )}
                      {packageDetails.categoryName && (
                        <>
                          {packageDetails.location && <span className="mx-2">•</span>}
                          <span className="text-primary font-medium">{packageDetails.categoryName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {packageDetails.image && (
                  <div className="h-64 md:h-80 rounded-xl overflow-hidden">
                    <img 
                      src={packageDetails.image}
                      alt={packageDetails.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Tabs defaultValue="details">
                    <TabsList className="mb-4">
                      <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                      <TabsTrigger value="location" data-testid="tab-location">Location</TabsTrigger>
                      <TabsTrigger value="provider" data-testid="tab-provider">Provider</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="bg-white rounded-xl p-6 shadow-sm" data-testid="tab-content-details">
                      <h2 className="text-xl font-bold mb-4">About This Package</h2>
                      
                      {packageDetails.description && (
                        <div className="mb-6 whitespace-pre-line" dangerouslySetInnerHTML={{ 
                          __html: packageDetails.description.replace(
                            /(https?:\/\/[^\s]+)/g, 
                            '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>'
                          )
                        }} />
                      )}
                      
                      {packageDetails.whatToBring && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">What to Bring</h3>
                          <p className="whitespace-pre-line">{packageDetails.whatToBring}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Program Dates</p>
                            <p className="font-medium">
                              {packageDetails.startDate && new Date(packageDetails.startDate).toLocaleDateString()} - {packageDetails.endDate && new Date(packageDetails.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <PackageIcon className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Total Sessions</p>
                            <p className="font-medium">{packageDetails.totalSessions} sessions</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <UserCheck className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Age Group</p>
                            <p className="font-medium">{packageDetails.ageGroup}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Users className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Capacity</p>
                            <p className="font-medium">
                              {isUnlimitedCapacity ? (
                                `${packageDetails.bookedCount || 0} enrolled (unlimited capacity)`
                              ) : (
                                <>
                                  {packageDetails.bookedCount || 0} / {packageDetails.capacity} enrolled
                                  {spotsRemaining !== null && spotsRemaining > 0 && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                      ({spotsRemaining} spots left)
                                    </span>
                                  )}
                                  {isProgramFull && (
                                    <span className="text-sm text-red-600 ml-2 font-medium">
                                      (Full)
                                    </span>
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {packageDetails.allowLateJoin && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900">Late Join Available</p>
                              <p className="text-sm text-blue-700">You can join this program mid-session with prorated pricing</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <h3 className="text-lg font-semibold mb-3">Session Schedule</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {packageDetails.sessions?.map((session, index) => (
                          <Card key={session.id} className="p-4" data-testid={`session-card-${index}`}>
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="font-medium">
                                  Session {index + 1}
                                  {session.sessionType && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                      ({session.sessionType})
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(session.date)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {session.location || packageDetails.location || 'TBD'}
                                  </div>
                                </div>
                                {session.notes && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    {session.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="location" className="bg-white rounded-xl p-6 shadow-sm" data-testid="tab-content-location">
                      <h2 className="text-xl font-bold mb-4">Location</h2>
                      
                      {packageDetails.address || packageDetails.location ? (
                        <>
                          <div className="mb-4">
                            <div className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50">
                              <MapPin className="h-5 w-5 text-primary mt-0.5" />
                              <div>
                                <p className="font-medium">Primary Location</p>
                                <p className="text-muted-foreground">
                                  {packageDetails.address || packageDetails.location}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Show session-specific locations if they differ */}
                          {packageDetails.sessions?.some(s => s.location && s.location !== packageDetails.location) && (
                            <div className="mt-6">
                              <h3 className="text-lg font-semibold mb-3">Session-Specific Locations</h3>
                              <div className="space-y-2">
                                {packageDetails.sessions
                                  .filter(s => s.location && s.location !== packageDetails.location)
                                  .map((session, index) => (
                                    <div key={session.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">
                                          Session {packageDetails.sessions.indexOf(session) + 1} - {new Date(session.date).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{session.location}</p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">Location information not available</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="provider" className="bg-white rounded-xl p-6 shadow-sm" data-testid="tab-content-provider">
                      <h2 className="text-xl font-bold mb-4">About the Provider</h2>
                      
                      <div className="flex items-start gap-4 mb-6">
                        <Avatar className="w-16 h-16">
                          <AvatarImage 
                            src={packageDetails.coachProfileImage || undefined} 
                            alt={displayName}
                          />
                          <AvatarFallback>
                            {displayName?.split(' ').map(name => name[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{displayName}</h3>
                          {coachRatingStats && coachRatingStats.averageRating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{coachRatingStats.averageRating.toFixed(1)}</span>
                              <span className="text-sm text-muted-foreground">
                                ({coachRatingStats.totalReviews} {coachRatingStats.totalReviews === 1 ? 'review' : 'reviews'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {packageDetails.coachBio && (
                        <div className="mb-6">
                          <h4 className="font-medium mb-2">Bio</h4>
                          <p className="text-muted-foreground whitespace-pre-line">{packageDetails.coachBio}</p>
                        </div>
                      )}

                      {coachReviews && coachReviews.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Recent Reviews</h4>
                          <div className="space-y-3">
                            {coachReviews.map((review: any) => (
                              <Card key={review.id} className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`h-4 w-4 ${
                                          i < review.rating 
                                            ? 'fill-yellow-400 text-yellow-400' 
                                            : 'text-gray-300'
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {review.comment && (
                                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  - {review.customerName}
                                </p>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
                
                {/* Booking sidebar */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-6">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          ${packageDetails.price && quantity ? (packageDetails.price * quantity).toFixed(2) : packageDetails.price}
                        </span>
                        <Badge variant="secondary">
                          {packageDetails.totalSessions} sessions
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {quantity > 1 ? `${quantity} × $${packageDetails.price} per person` : 'Full package price'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Quantity Selector - Show for unlimited or when spots available */}
                      {!isProgramFull && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Number of spots</label>
                          <div className="flex items-center justify-between border rounded-lg p-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                              data-testid="button-decrease-quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold px-4" data-testid="text-quantity">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (isUnlimitedCapacity) {
                                  // For unlimited capacity, allow any reasonable number (cap at 10)
                                  setQuantity(Math.min(10, quantity + 1));
                                } else if (spotsRemaining !== null) {
                                  // For limited capacity, respect spots remaining
                                  setQuantity(Math.min(spotsRemaining, quantity + 1));
                                }
                              }}
                              disabled={!isUnlimitedCapacity && spotsRemaining !== null && quantity >= spotsRemaining}
                              data-testid="button-increase-quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            {isUnlimitedCapacity 
                              ? 'Book for yourself and your guests (up to 10 spots)' 
                              : 'Book for yourself and your guests'}
                          </p>
                        </div>
                      )}
                      
                      {/* Capacity status messaging */}
                      {isProgramFull ? (
                        <div className="space-y-3">
                          <Button 
                            className="w-full" 
                            size="lg"
                            disabled={true}
                            data-testid="button-book-package"
                          >
                            Program Full
                          </Button>
                          <p className="text-sm text-center text-red-600 font-medium">
                            This program is currently full
                          </p>
                        </div>
                      ) : spotsRemaining !== null && spotsRemaining <= 3 ? (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-center text-orange-700 font-medium">
                            Only {spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} left!
                          </p>
                        </div>
                      ) : null}

                      {/* Payment Details Section */}
                      {!isProgramFull && user && (
                        <div id="payment-section" className="space-y-4 pt-4 border-t">
                          {isInitializingPayment ? (
                            <div className="py-8 text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Preparing payment...</p>
                            </div>
                          ) : (
                            <>
                              {/* Promo Code */}
                              <div className="space-y-2">
                                <Label htmlFor="promo-code" className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  Promo Code
                                </Label>
                                {appliedPromoCode ? (
                                  <div className="flex items-center justify-between border rounded-lg p-3 bg-green-50">
                                    <div>
                                      <p className="font-medium text-green-700">{appliedPromoCode.code}</p>
                                      <p className="text-sm text-green-600">
                                        Saved ${(discountAmount / 100).toFixed(2)}
                                      </p>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={removePromoCode}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Input
                                      id="promo-code"
                                      placeholder="Enter code"
                                      value={promoCode}
                                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          validatePromoCode();
                                        }
                                      }}
                                    />
                                    <Button 
                                      onClick={validatePromoCode}
                                      disabled={isValidatingPromo || !promoCode.trim()}
                                      variant="outline"
                                    >
                                      {isValidatingPromo ? "Checking..." : "Apply"}
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {/* Account Credits */}
                              {creditBalance > 0 && (
                                <div className="flex items-center justify-between border rounded-lg p-3">
                                  <div>
                                    <Label htmlFor="use-credits" className="cursor-pointer">
                                      Use Account Credits
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                      ${(creditBalance / 100).toFixed(2)} available
                                    </p>
                                  </div>
                                  <Switch
                                    id="use-credits"
                                    checked={useCredits}
                                    onCheckedChange={setUseCredits}
                                  />
                                </div>
                              )}

                              {/* Pricing Breakdown */}
                              <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-sm">
                                  <span>Package price</span>
                                  <span>${((packageDetails.price || 0) * quantity).toFixed(2)}</span>
                                </div>
                                {appliedPromoCode && discountAmount > 0 && (
                                  <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount ({appliedPromoCode.code})</span>
                                    <span>-${(discountAmount / 100).toFixed(2)}</span>
                                  </div>
                                )}
                                {useCredits && appliedCredits > 0 && (
                                  <div className="flex justify-between text-sm text-blue-600">
                                    <span>Credits Applied</span>
                                    <span>-${(appliedCredits / 100).toFixed(2)}</span>
                                  </div>
                                )}
                                {finalAmount > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span>Service fee</span>
                                    <span>${(stripeFee / 100).toFixed(2)}</span>
                                  </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                  <span>Total</span>
                                  <span className={finalAmount + stripeFee === 0 ? "text-green-600" : ""}>
                                    {finalAmount + stripeFee === 0 ? "FREE" : `$${((finalAmount + stripeFee) / 100).toFixed(2)}`}
                                  </span>
                                </div>
                              </div>

                              {/* Stripe Payment Form or Free Booking */}
                              {finalAmount + stripeFee > 0 && clientSecret ? (
                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                  <PaymentForm 
                                    packageId={packageId}
                                    quantity={quantity}
                                    finalAmount={finalAmount}
                                    stripeFee={stripeFee}
                                    appliedPromoCode={appliedPromoCode}
                                    appliedCredits={appliedCredits}
                                    onSuccess={() => {
                                      setPaymentStatus("success");
                                      queryClient.invalidateQueries({ queryKey: ['/api/time-bound-packages'] });
                                      navigate("/bookings?tab=packages");
                                    }}
                                  />
                                </Elements>
                              ) : (finalAmount + stripeFee === 0) && (
                                <FreeBookingButton
                                  packageId={packageId}
                                  quantity={quantity}
                                  appliedPromoCode={appliedPromoCode}
                                  appliedCredits={appliedCredits}
                                  onSuccess={() => {
                                    setPaymentStatus("success");
                                    queryClient.invalidateQueries({ queryKey: ['/api/time-bound-packages'] });
                                    navigate("/bookings?tab=packages");
                                  }}
                                />
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Sign-in prompt for unauthenticated users */}
                      {!user && !isProgramFull && (
                        <div className="space-y-3 pt-4 border-t">
                          <p className="text-sm text-muted-foreground text-center">
                            Sign in to view pricing and book this package
                          </p>
                          <Button 
                            className="w-full" 
                            size="lg"
                            onClick={() => navigate("/auth")}
                            data-testid="button-sign-in"
                          >
                            Sign In to Book
                          </Button>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Per session</span>
                          <span className="font-medium">
                            ${packageDetails.price && packageDetails.totalSessions 
                              ? (packageDetails.price / packageDetails.totalSessions).toFixed(2) 
                              : '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Age group</span>
                          <span className="font-medium">{packageDetails.ageGroup}</span>
                        </div>
                        {packageDetails.startDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Starts</span>
                            <span className="font-medium">
                              {new Date(packageDetails.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}
