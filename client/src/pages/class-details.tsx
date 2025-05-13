import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Class, ClassCategory, User, Booking, ClassWithSchedules, ClassSchedule } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
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
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  DollarSign, 
  Star,
  MapIcon,
  Share2,
  Heart,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Helmet } from "react-helmet";

export default function ClassDetailsPage() {
  const [, navigate] = useLocation();
  const [_, params] = useRoute<{ id: string }>("/classes/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookingStatus, setBookingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  if (!params) {
    navigate("/classes");
    return null;
  }
  
  const classId = parseInt(params.id);
  
  // Fetch class details with schedules
  const { 
    data: classItem, 
    isLoading: isLoadingClass, 
    error: classError 
  } = useQuery<ClassWithSchedules>({
    queryKey: [`/api/classes/${classId}`],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`${queryKey[0]}?includeSchedules=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch class details');
      }
      return response.json();
    },
  });
  
  // Get category data
  const { 
    data: category, 
    isLoading: isLoadingCategory 
  } = useQuery<ClassCategory>({
    queryKey: [`/api/categories/${classItem?.categoryId}`],
    enabled: !!classItem,
  });
  
  // Get coach data
  const { 
    data: coach, 
    isLoading: isLoadingCoach 
  } = useQuery<User>({
    queryKey: [`/api/coaches/${classItem?.coachId}`],
    enabled: !!classItem,
  });
  
  // Check if user has already booked this class
  const { 
    data: bookings,
    isLoading: isLoadingBookings
  } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    enabled: !!user,
  });
  
  const userBooking = bookings?.find(booking => 
    booking.classId === classId && (booking.status === 'pending' || booking.status === 'confirmed')
  );
  
  // Format dates using Pacific Time Zone
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    // Use Pacific Time for all dates
    const timeZone = 'America/Los_Angeles';
    return formatInTimeZone(date, timeZone, "EEEE, MMMM d, yyyy");
  };
  
  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Time not available';
    const date = new Date(dateString);
    // Use Pacific Time for all times
    const timeZone = 'America/Los_Angeles';
    return formatInTimeZone(date, timeZone, "h:mm a") + " PT";
  };
  
  // Handler for booking a class
  const handleBookClass = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book this class",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    setBookingStatus("loading");
    
    try {
      await apiRequest("POST", "/api/bookings", { classId });
      setBookingStatus("success");
      toast({
        title: "Booking created",
        description: "Proceed to checkout to complete your booking",
      });
      
      // Redirect to checkout page
      navigate(`/checkout/${classId}`);
    } catch (error: any) {
      setBookingStatus("error");
      toast({
        title: "Booking failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {classItem && (
        <Helmet>
          <title>{classItem.title} - Elevate Fitness</title>
          <meta name="description" content={classItem.description} />
        </Helmet>
      )}
      
      <Header />
      
      <main className="flex-grow bg-[#F7F7F7] py-6 md:py-8">
        <div className="container mx-auto px-4">
          {isLoadingClass ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <div className="h-64 md:h-80 rounded-xl overflow-hidden">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          ) : classError ? (
            <div className="p-8 bg-white rounded-xl shadow-sm text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">Class Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The class you're looking for doesn't exist or may have been removed.
              </p>
              <Button asChild>
                <Link href="/classes">Browse Classes</Link>
              </Button>
            </div>
          ) : classItem ? (
            <>
              <div className="mb-6">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold">{classItem.title}</h1>
                    <div className="flex items-center text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{classItem.location}</span>
                      <span className="mx-2">•</span>
                      {category && (
                        <span className="text-primary font-medium">{category.name}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="h-64 md:h-80 rounded-xl overflow-hidden">
                  <img 
                    src={classItem.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600"}
                    alt={classItem.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Tabs defaultValue="details">
                    <TabsList className="mb-4">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="location">Location</TabsTrigger>
                      <TabsTrigger value="coach">Coach</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="bg-white rounded-xl p-6 shadow-sm">
                      <h2 className="text-xl font-bold mb-4">About This Class</h2>
                      <p className="mb-6 whitespace-pre-line">{classItem.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {classItem.isRecurring && classItem.schedules && classItem.schedules.length > 0 ? (
                          <div className="flex flex-col col-span-2">
                            <div className="flex items-center mb-2">
                              <Calendar className="h-5 w-5 mr-3 text-primary" />
                              <p className="font-medium">Recurring Class Schedule</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 ml-8 mt-2">
                              {classItem.schedules.map((schedule, index) => {
                                // Get day name
                                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                const dayName = days[schedule.dayOfWeek];
                                
                                // Format time
                                const formatTimeString = (timeStr: string) => {
                                  const [hours, minutes] = timeStr.split(':').map(Number);
                                  const period = hours >= 12 ? 'PM' : 'AM';
                                  const displayHours = hours % 12 || 12; // Convert 0 to 12
                                  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                                };
                                
                                return (
                                  <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p className="font-medium text-primary">{dayName}</p>
                                    <p className="text-gray-700">{formatTimeString(schedule.startTime)} - {formatTimeString(schedule.endTime)}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 mr-3 text-primary" />
                              <div>
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p className="font-medium">{formatDate(classItem.startTime)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 mr-3 text-primary" />
                              <div>
                                <p className="text-sm text-muted-foreground">Time</p>
                                <p className="font-medium">
                                  {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="flex items-center">
                          <Users className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Capacity</p>
                            <p className="font-medium">{classItem.capacity} spots</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="font-medium">{classItem.address}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="location" className="bg-white rounded-xl p-6 shadow-sm min-h-[300px]">
                      <h2 className="text-xl font-bold mb-4">Location</h2>
                      <div className="bg-[#F7F7F7] h-48 md:h-64 rounded-lg flex items-center justify-center mb-4">
                        <MapIcon className="h-12 w-12 text-muted-foreground" />
                        <p className="ml-2 text-muted-foreground">Map view</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Address</h3>
                        <p className="text-muted-foreground">{classItem.address}</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="coach" className="bg-white rounded-xl p-6 shadow-sm">
                      {isLoadingCoach ? (
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-16 w-16 rounded-full" />
                          <div>
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      ) : coach ? (
                        <div>
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                              {coach.profileImage ? (
                                <img 
                                  src={coach.profileImage} 
                                  alt={`${coach.firstName} ${coach.lastName}`} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xl font-medium">
                                  {coach.firstName[0]}{coach.lastName[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <h2 className="text-xl font-bold">Coach {coach.firstName} {coach.lastName}</h2>
                              <div className="flex items-center">
                                <Star className="text-[#FFCC00] fill-[#FFCC00] h-4 w-4" />
                                <span className="ml-1">4.9</span>
                                <span className="text-sm text-muted-foreground ml-1">(124 reviews)</span>
                              </div>
                            </div>
                          </div>
                          
                          {coach.bio ? (
                            <div className="mb-4">
                              <h3 className="font-medium mb-2">About</h3>
                              <p className="text-muted-foreground">{coach.bio}</p>
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic mb-4">
                              This coach hasn't added a bio yet.
                            </p>
                          )}
                          
                          <Button asChild variant="outline" className="w-full sm:w-auto">
                            <Link href={`/coaches/${coach.id}`}>View Full Profile</Link>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Coach information not available</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>${classItem.price.toFixed(2)}</span>
                        <span className="text-sm font-normal text-muted-foreground">per person</span>
                      </CardTitle>
                      <CardDescription>
                        {classItem.isRecurring && classItem.schedules && classItem.schedules.length > 0 
                          ? "Recurring Class - Multiple Schedule Options"
                          : `${formatDate(classItem.startTime)} • ${formatTime(classItem.startTime)}`
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <div className="text-center py-2 bg-[#F7F7F7] rounded-lg text-sm mb-4">
                          <span className="font-medium">8/12</span> spots left
                        </div>
                        
                        {userBooking ? (
                          <div className="bg-primary/10 p-4 rounded-lg text-center mb-4">
                            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-primary font-medium">You've already booked this class</p>
                            <p className="text-sm text-muted-foreground">
                              Status: {userBooking.status === 'confirmed' ? 'Confirmed' : 'Pending payment'}
                            </p>
                          </div>
                        ) : (
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-white"
                            onClick={handleBookClass}
                            disabled={bookingStatus === "loading"}
                          >
                            {bookingStatus === "loading" ? "Processing..." : "Book Now"}
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Class price</span>
                          <span>${classItem.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service fee</span>
                          <span>${(classItem.price * 0.05).toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-3 flex justify-between font-medium">
                          <span>Total</span>
                          <span>${(classItem.price * 1.05).toFixed(2)}</span>
                        </div>
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
