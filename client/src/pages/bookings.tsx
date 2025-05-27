import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Booking, Class } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  X, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  CalendarDays,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Helmet } from "react-helmet";

interface BookingWithClass extends Booking {
  class?: Class;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cancelingBookingId, setCancelingBookingId] = useState<number | null>(null);
  
  // Fetch user bookings
  const { data: bookings, isLoading, error, refetch } = useQuery<BookingWithClass[]>({
    queryKey: ['/api/bookings'],
    enabled: !!user,
  });
  
  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("PUT", `/api/bookings/${bookingId}/cancel`, {});
    },
    onSuccess: () => {
      toast({
        title: "Booking cancelled",
        description: "Your booking has been successfully cancelled",
      });
      
      // Refetch bookings after cancellation
      refetch();
      
      // Reset state
      setCancelingBookingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      
      // Reset state
      setCancelingBookingId(null);
    }
  });
  
  // Filter bookings by status
  const upcomingBookings = bookings?.filter(booking => 
    booking.status === 'confirmed' && 
    (booking.class && new Date(booking.class.startTime) > new Date())
  );
  
  const pastBookings = bookings?.filter(booking => 
    booking.class && new Date(booking.class.startTime) <= new Date()
  );
  
  const pendingBookings = bookings?.filter(booking => 
    booking.status === 'pending'
  );
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending Payment</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-destructive border-destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Format the date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE, MMMM d, yyyy");
  };
  
  // Format the time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };
  
  // Handle booking cancellation
  const handleCancelBooking = (bookingId: number) => {
    setCancelingBookingId(bookingId);
    cancelBookingMutation.mutate(bookingId);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>My Bookings - Trainn Fitness</title>
        <meta name="description" content="View and manage your fitness class bookings. Track upcoming classes, past sessions, and booking status." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow bg-[#F7F7F7] py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-6">My Bookings</h1>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-28" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold mb-2">Error Loading Bookings</h2>
                <p className="text-muted-foreground mb-4">
                  We couldn't load your bookings. Please try again later.
                </p>
                <Button onClick={() => refetch()}>Retry</Button>
              </CardContent>
            </Card>
          ) : bookings && bookings.length > 0 ? (
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming">
                  Upcoming
                  {upcomingBookings?.length ? (
                    <span className="ml-2 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                      {upcomingBookings.length}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  {pendingBookings?.length ? (
                    <span className="ml-2 bg-amber-500/10 text-amber-500 rounded-full px-2 py-0.5 text-xs">
                      {pendingBookings.length}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                {upcomingBookings && upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map(booking => (
                      <Card key={booking.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{booking.class?.title}</CardTitle>
                              <CardDescription>
                                {booking.class ? formatDate(booking.class.startTime) : "Unknown date"}
                              </CardDescription>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 mr-2 text-primary" />
                              <span>
                                {booking.class 
                                  ? `${formatTime(booking.class.startTime)} - ${formatTime(booking.class.endTime)}`
                                  : "Unknown time"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-5 w-5 mr-2 text-primary" />
                              <span>{booking.class?.location || "Unknown location"}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 mr-2 text-primary" />
                              <span>Booking #{booking.id}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button 
                            asChild 
                            variant="outline" 
                            className="border-primary text-primary hover:bg-primary hover:text-white"
                          >
                            <Link href={`/classes/${booking.classId}`}>
                              View Class Details
                            </Link>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                              >
                                Cancel Booking
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel your booking for "{booking.class?.title}". 
                                  Cancellation policies may apply.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                  disabled={cancelingBookingId === booking.id}
                                >
                                  {cancelingBookingId === booking.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    "Confirm Cancellation"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-xl font-bold mb-2">No Upcoming Bookings</h2>
                      <p className="text-muted-foreground mb-6">
                        You don't have any upcoming classes booked yet.
                      </p>
                      <Button asChild className="bg-primary text-white">
                        <Link href="/classes">Browse Classes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="pending">
                {pendingBookings && pendingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {pendingBookings.map(booking => (
                      <Card key={booking.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{booking.class?.title}</CardTitle>
                              <CardDescription>
                                {booking.class ? formatDate(booking.class.startTime) : "Unknown date"}
                              </CardDescription>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 mr-2 text-primary" />
                              <span>
                                {booking.class 
                                  ? `${formatTime(booking.class.startTime)} - ${formatTime(booking.class.endTime)}`
                                  : "Unknown time"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-5 w-5 mr-2 text-primary" />
                              <span>{booking.class?.location || "Unknown location"}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 mr-2 text-primary" />
                              <span>Booking #{booking.id}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button asChild variant="outline">
                            <Link href={`/classes/${booking.classId}`}>
                              View Class Details
                            </Link>
                          </Button>
                          
                          <Button 
                            asChild 
                            className="bg-primary text-white"
                          >
                            <Link href={`/checkout/${booking.classId}`}>
                              Complete Payment
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-xl font-bold mb-2">No Pending Bookings</h2>
                      <p className="text-muted-foreground mb-6">
                        You don't have any bookings waiting for payment.
                      </p>
                      <Button asChild>
                        <Link href="/classes">Browse Classes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="past">
                {pastBookings && pastBookings.length > 0 ? (
                  <div className="space-y-4">
                    {pastBookings.map(booking => (
                      <Card key={booking.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{booking.class?.title}</CardTitle>
                              <CardDescription>
                                {booking.class ? formatDate(booking.class.startTime) : "Unknown date"}
                              </CardDescription>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 mr-2 text-primary" />
                              <span>
                                {booking.class 
                                  ? `${formatTime(booking.class.startTime)} - ${formatTime(booking.class.endTime)}`
                                  : "Unknown time"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-5 w-5 mr-2 text-primary" />
                              <span>{booking.class?.location || "Unknown location"}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 mr-2 text-primary" />
                              <span>Booking #{booking.id}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            asChild 
                            variant="outline"
                          >
                            <Link href={`/classes/${booking.classId}`}>
                              View Class Details
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-xl font-bold mb-2">No Past Bookings</h2>
                      <p className="text-muted-foreground mb-6">
                        You haven't attended any classes yet.
                      </p>
                      <Button asChild>
                        <Link href="/classes">Browse Classes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">No Bookings Found</h2>
                <p className="text-muted-foreground mb-6">
                  You haven't booked any classes yet. Start your fitness journey today!
                </p>
                <Button asChild className="bg-primary text-white">
                  <Link href="/classes">Browse Classes</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}
