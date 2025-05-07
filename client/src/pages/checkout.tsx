import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Class, Booking } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment form component
const CheckoutForm = ({ classItem }: { classItem: Class }) => {
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

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/bookings",
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
      toast({
        title: "Payment Successful",
        description: "Your booking has been confirmed!",
      });
      setPaymentStatus("success");
      
      // Redirect to bookings page after successful payment
      setTimeout(() => {
        navigate("/bookings");
      }, 1500);
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
          <span>Class price</span>
          <span>${classItem.price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Service fee</span>
          <span>${(classItem.price * 0.05).toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>${(classItem.price * 1.05).toFixed(2)}</span>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-primary text-white"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay $${(classItem.price * 1.05).toFixed(2)}`
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
  
  // Fetch class details
  const { 
    data: classItem, 
    isLoading: isLoadingClass, 
    error: classError 
  } = useQuery<Class>({
    queryKey: [`/api/classes/${classId}`],
  });
  
  // Fetch booking to check if user has already booked
  const { 
    data: bookings,
    isLoading: isLoadingBookings
  } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });
  
  // Check if this class is already booked by the user
  const userBooking = bookings?.find(booking => 
    booking.classId === classId && booking.status === 'confirmed'
  );
  
  // Create payment intent
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create a payment intent
        const res = await apiRequest("POST", "/api/create-payment-intent", { classId });
        const data = await res.json();
        
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || "Failed to initialize payment. Please try again.");
        toast({
          title: "Payment Initialization Failed",
          description: err.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (classItem && !userBooking) {
      createPaymentIntent();
    }
  }, [classItem, userBooking]);
  
  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEEE, MMMM d, yyyy");
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "h:mm a");
  };
  
  // If user has already booked and confirmed this class
  if (userBooking && userBooking.status === 'confirmed') {
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
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Complete Booking - Elevate Fitness</title>
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
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm classItem={classItem} />
                    </Elements>
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
