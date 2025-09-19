import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "../../../hooks/use-auth-simple";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  X, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  CalendarDays,
  Loader2,
  Star,
  BookOpen,
  Package,
  User,
  Mail
} from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "../../../hooks/use-toast";
import { format } from "date-fns";
import { Helmet } from "react-helmet";

interface BookingWithClass extends Booking {
  class?: Class;
}

interface PackagePurchaseWithDetails {
  id: number;
  userId: number;
  packageId: number;
  packageType: string;
  classCount: number;
  price: string;
  currency: string;
  paymentMethod: string;
  purchaseDate: string;
  paymentStatus: string;
  usedClasses: number;
  remainingClasses: number;
  expirationDate: string;
  packageDetails?: {
    id: number;
    title: string;
    coachId: number;
    eligibleClasses: string;
  };
  coachDetails?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cancelingBookingId, setCancelingBookingId] = useState<number | null>(null);

  const formatDateForCalendar = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const generateGoogleCalendarUrl = (booking: any) => {
    if (!booking.class) return '';
    
    const classData = booking.class;
    const startTime = new Date(classData.startTime);
    const endTime = new Date(classData.endTime);
    
    const title = encodeURIComponent(classData.title);
    const description = encodeURIComponent(
      `${classData.description || ''}\n\nLocation: ${classData.address}${classData.toFindUs ? `\n\nHow to Find Us: ${classData.toFindUs}` : ''}\n\nBooked through Trainn`
    );
    const location = encodeURIComponent(classData.address || '');
    const startDateTime = formatDateForCalendar(startTime);
    const endDateTime = formatDateForCalendar(endTime);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${description}&location=${location}`;
  };

  const generateOutlookCalendarUrl = (booking: any) => {
    if (!booking.class) return '';
    
    const classData = booking.class;
    const startTime = new Date(classData.startTime);
    const endTime = new Date(classData.endTime);
    
    const title = encodeURIComponent(classData.title);
    const description = encodeURIComponent(
      `${classData.description || ''}\n\nLocation: ${classData.address}${classData.toFindUs ? `\n\nHow to Find Us: ${classData.toFindUs}` : ''}\n\nBooked through Trainn`
    );
    const location = encodeURIComponent(classData.address || '');
    const startDateTime = formatDateForCalendar(startTime);
    const endDateTime = formatDateForCalendar(endTime);

    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDateTime}&enddt=${endDateTime}&body=${description}&location=${location}`;
  };

  const generateAppleCalendarICS = (booking: any) => {
    if (!booking.class) return '';
    
    const classData = booking.class;
    const startTime = new Date(classData.startTime);
    const endTime = new Date(classData.endTime);
    
    const title = classData.title;
    const description = `${classData.description || ''}\n\nLocation: ${classData.address}${classData.toFindUs ? `\n\nHow to Find Us: ${classData.toFindUs}` : ''}\n\nBooked through Trainn`;
    const location = classData.address || '';
    const startDateTime = formatDateForCalendar(startTime);
    const endDateTime = formatDateForCalendar(endTime);
    const uid = `booking-${booking.id}-${Date.now()}@trainn.pro`;
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Trainn//Event//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  };

  const handleAddToGoogleCalendar = (booking: any) => {
    const calendarUrl = generateGoogleCalendarUrl(booking);
    if (calendarUrl) {
      window.open(calendarUrl, '_blank');
    }
  };

  const handleAddToOutlookCalendar = (booking: any) => {
    const calendarUrl = generateOutlookCalendarUrl(booking);
    if (calendarUrl) {
      window.open(calendarUrl, '_blank');
    }
  };

  const handleAddToAppleCalendar = (booking: any) => {
    const icsUrl = generateAppleCalendarICS(booking);
    if (icsUrl) {
      const link = document.createElement('a');
      link.href = icsUrl;
      link.download = `${booking.class.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Check for refresh parameter and force page reload on payment completion
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh') === 'true') {
      // Force complete page reload to ensure fresh data after payment
      window.history.replaceState({}, '', '/bookings');
      window.location.reload();
    }
  }, []);
  
  // Fetch user bookings with aggressive refresh settings
  const { data: bookings, isLoading, error, refetch } = useQuery<BookingWithClass[]>({
    queryKey: ['/api/bookings'],
    enabled: !!user,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache results (renamed from cacheTime)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  // Fetch user reviews
  const { data: userReviews } = useQuery<any[]>({
    queryKey: [`/api/reviews/customer/${user?.id}`],
    enabled: !!user,
  });

  // Fetch user packages
  const { 
    data: packages, 
    isLoading: isLoadingPackages, 
    error: packagesError 
  } = useQuery<PackagePurchaseWithDetails[]>({
    queryKey: ['/api/user/packages'],
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
      
      // Invalidate credit balance query to refresh account balance on profile page
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
      
      // Invalidate user packages query to refresh restored package classes
      queryClient.invalidateQueries({ queryKey: ['/api/user/packages'] });
      
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
  
  // Filter and sort bookings by status and date/time
  const upcomingBookings = bookings?.filter((booking: BookingWithClass) => 
    booking.status === 'confirmed' && 
    booking.class && booking.class.startTime && 
    new Date(booking.class.startTime) > new Date()
  ).sort((a: BookingWithClass, b: BookingWithClass) => {
    // Sort by start time (earliest first)
    const dateA = new Date(a.class!.startTime!);
    const dateB = new Date(b.class!.startTime!);
    return dateA.getTime() - dateB.getTime();
  });
  
  const pastBookings = bookings?.filter((booking: BookingWithClass) => 
    booking.class && booking.class.startTime && 
    new Date(booking.class.startTime) <= new Date()
  ).sort((a: BookingWithClass, b: BookingWithClass) => {
    // Sort by start time (most recent first)
    const dateA = new Date(a.class!.startTime!);
    const dateB = new Date(b.class!.startTime!);
    return dateB.getTime() - dateA.getTime();
  });
  

  
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
  const formatDate = (dateValue: string | Date | null) => {
    if (!dateValue) return "Unknown date";
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return format(date, "EEEE, MMMM d, yyyy");
  };
  
  // Format the time
  const formatTime = (dateValue: string | Date | null) => {
    if (!dateValue) return "Unknown time";
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return format(date, "h:mm a");
  };
  
  // Handle booking cancellation
  const handleCancelBooking = (bookingId: number) => {
    setCancelingBookingId(bookingId);
    cancelBookingMutation.mutate(bookingId);
  };

  // Check if a booking has been reviewed
  const hasBeenReviewed = (classId: number) => {
    return Array.isArray(userReviews) && userReviews.some((review: any) => review.classId === classId);
  };

  // Get existing review for a class
  const getExistingReview = (classId: number) => {
    return Array.isArray(userReviews) ? userReviews.find((review: any) => review.classId === classId) : undefined;
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
          ) : bookings && Array.isArray(bookings) && bookings.length > 0 ? (
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

                <TabsTrigger value="past">Past</TabsTrigger>
                <TabsTrigger value="packages">Packages</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                {upcomingBookings && upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking: BookingWithClass) => (
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
                              <span>{booking.quantity || 1} {(booking.quantity || 1) === 1 ? 'spot' : 'spots'} booked</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center gap-3">
                          <div className="flex gap-3">
                            <Button 
                              asChild 
                              variant="outline" 
                              className="border-primary text-primary hover:bg-primary hover:text-white"
                            >
                              <Link href={`/classes/${booking.classId}`}>
                                View Class Details
                              </Link>
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline"
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                  data-testid="add-to-calendar"
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Add to Calendar
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  data-testid="google-calendar-option"
                                  onClick={() => handleAddToGoogleCalendar(booking)}
                                >
                                  <div className="flex items-center">
                                    <FcGoogle className="w-4 h-4 mr-3" />
                                    Google Calendar
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  data-testid="outlook-calendar-option"
                                  onClick={() => handleAddToOutlookCalendar(booking)}
                                >
                                  <div className="flex items-center">
                                    <Mail className="w-4 h-4 mr-3 text-blue-600" />
                                    Outlook Calendar
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  data-testid="apple-calendar-option"
                                  onClick={() => handleAddToAppleCalendar(booking)}
                                >
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 mr-3 bg-red-500 rounded-sm flex flex-col items-center justify-center text-white text-xs font-semibold leading-none">
                                      <div className="text-[6px] mb-[1px]">SEP</div>
                                      <div className="text-[8px]">16</div>
                                    </div>
                                    Apple Calendar
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
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

              
              <TabsContent value="past">
                {pastBookings && pastBookings.length > 0 ? (
                  <div className="space-y-4">
                    {pastBookings.map((booking: BookingWithClass) => (
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
                              <span>{booking.quantity || 1} {(booking.quantity || 1) === 1 ? 'spot' : 'spots'} booked</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-3">
                          <Button 
                            asChild 
                            variant="outline"
                          >
                            <Link href={`/classes/${booking.classId}`}>
                              View Class Details
                            </Link>
                          </Button>
                          
                          {booking.class && (
                            hasBeenReviewed(booking.classId) ? (
                              <Button 
                                variant="outline" 
                                className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                                onClick={() => {
                                  const url = `/review?classId=${booking.classId}&bookingId=${booking.id}`;
                                  console.log('Navigating to view review URL:', url);
                                  window.location.href = url;
                                }}
                              >
                                <Star className="h-4 w-4 mr-2" />
                                View Review
                              </Button>
                            ) : (
                              <Button 
                                className="bg-primary text-white hover:bg-primary/90"
                                onClick={() => {
                                  const url = `/review?classId=${booking.classId}&bookingId=${booking.id}`;
                                  console.log('Navigating to add review URL:', url);
                                  console.log('Class ID:', booking.classId, 'Booking ID:', booking.id);
                                  window.location.href = url;
                                }}
                              >
                                <Star className="h-4 w-4 mr-2" />
                                Add Review
                              </Button>
                            )
                          )}
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

              <TabsContent value="packages">
                {isLoadingPackages ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : packagesError ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Packages</h3>
                      <p className="text-gray-500">Something went wrong. Please try again later.</p>
                    </CardContent>
                  </Card>
                ) : packages && packages.length > 0 ? (
                  <div className="space-y-4">
                    {packages.map((packagePurchase) => (
                      <Card key={packagePurchase.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">
                                  {packagePurchase.packageDetails?.title || 'Class Package'}
                                </h3>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Purchase Date</p>
                                  <p className="font-medium">
                                    {format(new Date(packagePurchase.purchaseDate), "MMMM d, yyyy")}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Expires</p>
                                  <p className="font-medium">
                                    {format(new Date(packagePurchase.expirationDate), "MMMM d, yyyy")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Provider</p>
                                  <p className="font-medium">
                                    {packagePurchase.coachDetails ? 
                                      `${packagePurchase.coachDetails.firstName} ${packagePurchase.coachDetails.lastName}` : 
                                      'Coach Name'
                                    }
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <p className="text-sm text-gray-600">Classes Used</p>
                                  <p className="font-semibold text-lg">
                                    {packagePurchase.usedClasses}/{packagePurchase.classCount} classes used
                                  </p>
                                </div>
                                <div className="w-16 h-16 relative">
                                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#e5e7eb"
                                      strokeWidth="2"
                                    />
                                    <path
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#3b82f6"
                                      strokeWidth="2"
                                      strokeDasharray={`${(packagePurchase.usedClasses / packagePurchase.classCount) * 100}, 100`}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-medium">
                                      {Math.round((packagePurchase.usedClasses / packagePurchase.classCount) * 100)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              asChild 
                              variant="outline" 
                              className="flex items-center gap-2"
                            >
                              <Link 
                                href={(() => {
                                  // Use same filtering logic as "View Classes" on packages page
                                  let classesUrl = `/classes?coachId=${packagePurchase.packageDetails?.coachId}`;
                                  
                                  // Add eligible classes filter if specific classes are defined
                                  if (packagePurchase.packageDetails?.eligibleClasses && 
                                      packagePurchase.packageDetails.eligibleClasses !== 'all') {
                                    try {
                                      const eligibleClassIds = JSON.parse(packagePurchase.packageDetails.eligibleClasses);
                                      if (Array.isArray(eligibleClassIds) && eligibleClassIds.length > 0) {
                                        classesUrl += `&packageClasses=${eligibleClassIds.join(',')}`;
                                      }
                                    } catch (e) {
                                      // If parsing fails, fall back to coach-only filter
                                      console.warn('Failed to parse eligible classes:', packagePurchase.packageDetails.eligibleClasses);
                                    }
                                  }
                                  
                                  return classesUrl;
                                })()}
                              >
                                View Schedule Details
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-xl font-bold mb-2">No Packages Found</h2>
                      <p className="text-muted-foreground mb-6">
                        You haven't purchased any class packages yet. Browse available packages to get started!
                      </p>
                      <Button asChild className="bg-primary text-white">
                        <Link href="/packages">Browse Available Packages</Link>
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
