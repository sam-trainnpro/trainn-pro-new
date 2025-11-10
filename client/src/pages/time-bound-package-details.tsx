import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "../../../hooks/use-auth-simple";
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
  UserCheck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "../../../hooks/use-toast";
import { formatInTimeZone } from "date-fns-tz";
import { Helmet } from "react-helmet";

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

  const handleBookPackage = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book this package",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    // Navigate to package checkout
    navigate(`/time-bound-package-checkout/${packageId}`);
  };

  const displayName = packageDetails?.displayBusinessName && packageDetails?.coachBusinessName 
    ? packageDetails.coachBusinessName 
    : packageDetails?.coachName;

  const spotsRemaining = packageDetails?.capacity 
    ? packageDetails.capacity - (packageDetails.bookedCount || 0)
    : null;

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
                        
                        {packageDetails.capacity && (
                          <div className="flex items-center">
                            <Users className="h-5 w-5 mr-3 text-primary" />
                            <div>
                              <p className="text-sm text-muted-foreground">Capacity</p>
                              <p className="font-medium">
                                {packageDetails.bookedCount || 0} / {packageDetails.capacity} enrolled
                                {spotsRemaining !== null && spotsRemaining > 0 && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    ({spotsRemaining} spots left)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
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
                            <div className="flex items-start gap-3 mb-4">
                              <MapPin className="h-5 w-5 text-primary mt-0.5" />
                              <div>
                                <p className="font-medium">Primary Location</p>
                                <p className="text-muted-foreground">
                                  {packageDetails.address || packageDetails.location}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <GoogleMapsScript>
                            <LocationPreview 
                              location={packageDetails.address || packageDetails.location || ''} 
                            />
                          </GoogleMapsScript>

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
                          ${packageDetails.price}
                        </span>
                        <Badge variant="secondary">
                          {packageDetails.totalSessions} sessions
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Full package price
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleBookPackage}
                        disabled={spotsRemaining === 0}
                        data-testid="button-book-package"
                      >
                        {spotsRemaining === 0 ? 'Program Full' : 'Book Package'}
                      </Button>
                      
                      {spotsRemaining !== null && spotsRemaining > 0 && spotsRemaining <= 3 && (
                        <p className="text-sm text-center text-orange-600 font-medium">
                          Only {spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} left!
                        </p>
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
