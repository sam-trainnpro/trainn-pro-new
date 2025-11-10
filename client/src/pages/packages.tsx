import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClassCategory } from "@shared/schema";
import { useLocation } from "wouter";
import queryString from "query-string";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import SearchFilters, { SearchFilters as SearchFiltersType } from "@/components/home/search-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Helmet } from "react-helmet";
import { Package, CheckCircle, XCircle, Calendar, User, Clock, MapPin, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ClassPackage {
  id: number;
  coachId: number;
  coachName: string;
  coachBusinessName?: string;
  displayBusinessName?: boolean;
  coachProfileImage?: string;
  title: string;
  packageType: 'set_pack' | 'time_bound';
  // Set pack fields
  classCount1: number | null;
  classCount2: number | null;
  classCount3: number | null;
  price1: number | null;
  price2: number | null;
  price3: number | null;
  eligibleClasses: string | null;
  // Time bound fields
  totalSessions: number | null;
  price: number | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  allowLateJoin: boolean | null;
  location: string | null;
  // Shared fields
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

interface TimeBoundPackageDetails extends ClassPackage {
  sessions: TimeBoundPackageSession[];
  bookedCount?: number;
  image: string | null;
  address: string | null;
  whatToBring: string | null;
}

export default function PackagesPage() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [locationPath, navigate] = useLocation();
  // Get search params from URL and ensure it's a string for queryString.parse
  const searchQuery: string = typeof window.location.search === 'string' ? window.location.search : '';
  const searchParams = queryString.parse(searchQuery);
  
  // Modal state for time-bound package details
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState<SearchFiltersType>({
    query: typeof searchParams.q === 'string' ? searchParams.q : "",
    classType: typeof searchParams.type === 'string' ? searchParams.type : undefined,
    ageGroup: typeof searchParams.ageGroup === 'string' ? searchParams.ageGroup : undefined,
    city: typeof searchParams.city === 'string' ? searchParams.city : undefined,
    outdoors: typeof searchParams.outdoors === 'string' ? searchParams.outdoors : undefined,
    date: searchParams.date ? new Date(searchParams.date as string) : undefined,
    latitude: typeof searchParams.lat === 'string' ? Number(searchParams.lat) : null,
    longitude: typeof searchParams.lng === 'string' ? Number(searchParams.lng) : null,
  });

  // Fetch all packages
  const { 
    data: packages, 
    isLoading: isLoadingPackages, 
    error: packagesError 
  } = useQuery<ClassPackage[]>({
    queryKey: ['/api/packages/all'],
    queryFn: async () => {
      const response = await fetch('/api/packages/all');
      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }
      return response.json();
    },
  });

  // Fetch all categories
  const { 
    data: categories, 
    isLoading: isLoadingCategories 
  } = useQuery<ClassCategory[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch time-bound package details when modal is open
  const { 
    data: packageDetails, 
    isLoading: isLoadingDetails 
  } = useQuery<TimeBoundPackageDetails>({
    queryKey: ['/api/time-bound-packages', selectedPackageId],
    enabled: !!selectedPackageId && isModalOpen,
  });

  // Filter packages based on search criteria
  const filteredPackages = packages?.filter(pkg => {
    // Text search in title, description, or coach name
    if (filters.query) {
      const searchTerm = filters.query.toLowerCase();
      const coachDisplayName = pkg.displayBusinessName && pkg.coachBusinessName 
        ? pkg.coachBusinessName 
        : pkg.coachName;
      
      const matchesQuery = 
        pkg.title.toLowerCase().includes(searchTerm) ||
        (pkg.description && pkg.description.toLowerCase().includes(searchTerm)) ||
        coachDisplayName.toLowerCase().includes(searchTerm);
      
      if (!matchesQuery) return false;
    }

    // Category filter
    if (filters.classType && pkg.categoryId) {
      if (pkg.categoryId.toString() !== filters.classType) return false;
    }

    // Age group filter
    if (filters.ageGroup && pkg.ageGroup !== filters.ageGroup) return false;

    // Only show active packages
    if (!pkg.isActive) return false;

    return true;
  }) || [];

  const handleSearch = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.classType) params.set('type', newFilters.classType);
    if (newFilters.ageGroup) params.set('ageGroup', newFilters.ageGroup);
    if (newFilters.city) params.set('city', newFilters.city);
    if (newFilters.outdoors) params.set('outdoors', newFilters.outdoors);
    if (newFilters.date) params.set('date', newFilters.date.toISOString().split('T')[0]);
    if (newFilters.latitude) params.set('lat', newFilters.latitude.toString());
    if (newFilters.longitude) params.set('lng', newFilters.longitude.toString());
    
    const queryString = params.toString();
    navigate(`/packages${queryString ? `?${queryString}` : ''}`);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '';
    return `$${price}`;
  };

  const getPackageOptions = (pkg: ClassPackage) => {
    if (pkg.packageType === 'set_pack') {
      const options: string[] = [];
      if (pkg.classCount1 && pkg.price1) {
        options.push(`${pkg.classCount1} classes: ${formatPrice(pkg.price1)}`);
      }
      if (pkg.classCount2 && pkg.price2) {
        options.push(`${pkg.classCount2} classes: ${formatPrice(pkg.price2)}`);
      }
      if (pkg.classCount3 && pkg.price3) {
        options.push(`${pkg.classCount3} classes: ${formatPrice(pkg.price3)}`);
      }
      return options.join(' | ');
    } else {
      // Time-bound package
      const parts: string[] = [];
      if (pkg.totalSessions) {
        parts.push(`${pkg.totalSessions} sessions`);
      }
      if (pkg.startDate && pkg.endDate) {
        const start = new Date(pkg.startDate);
        const end = new Date(pkg.endDate);
        parts.push(`${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
      }
      if (pkg.price) {
        parts.push(`${formatPrice(pkg.price)}`);
      }
      if (pkg.allowLateJoin) {
        parts.push('(Prorated pricing available)');
      }
      return parts.join(' | ');
    }
  };

  const getCoachDisplayName = (pkg: ClassPackage) => {
    return pkg.displayBusinessName && pkg.coachBusinessName 
      ? pkg.coachBusinessName 
      : pkg.coachName;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Browse Class Packages - Trainn</title>
        <meta name="description" content="Discover and book class packages from top providers in the San Francisco Bay Area. Save money with multi-class bundles for sports, fitness, music and art classes." />
        <link rel="canonical" href="https://trainn.pro/packages" />
        <meta property="og:title" content="Browse Class Packages - Trainn" />
        <meta property="og:description" content="Discover and book class packages from top providers in the San Francisco Bay Area. Save money with multi-class bundles for sports, fitness, music and art classes." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trainn.pro/packages" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Browse Class Packages - Trainn" />
        <meta name="twitter:description" content="Discover and book class packages from top providers. Save money with multi-class bundles." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow">
        <SearchFilters 
          onSearch={handleSearch} 
          showOnlyFutureCategories={true}
          hideFilters={['outdoors', 'date', 'city']}
        />
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Class Packages</h1>
                <p className="text-gray-600">
                  Save money with multi-class packages from top providers
                </p>
                <div className="mt-3 mb-4 text-sm text-gray-600">
                  <p>Package Expiration: 5 classes: 60 days* | 10 classes: 90 days* | 20 classes: 180 days*</p>
                  <p className="text-xs text-gray-500">* Expiration period begins on the date of purchase</p>
                </div>
                {filteredPackages.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing {filteredPackages.length} package{filteredPackages.length === 1 ? '' : 's'}
                  </p>
                )}
              </div>

              {isLoadingPackages ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : packagesError ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Unable to load packages</h3>
                    <p className="text-muted-foreground">
                      Please try again later or refresh the page.
                    </p>
                  </CardContent>
                </Card>
              ) : filteredPackages.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No packages found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search filters to find more packages.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFilters({ query: '' });
                        navigate('/packages');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredPackages.map((pkg: ClassPackage) => (
                    <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex flex-wrap items-center gap-2 mb-2">
                              <span className="break-words">{pkg.title}</span>
                              <Badge variant="default" className="bg-green-600 flex-shrink-0">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            </CardTitle>
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="w-10 h-10">
                                <AvatarImage 
                                  src={pkg.coachProfileImage || undefined} 
                                  alt={getCoachDisplayName(pkg)}
                                />
                                <AvatarFallback>
                                  {getCoachDisplayName(pkg).split(' ').map(name => name[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="w-4 h-4" />
                                <span>by {getCoachDisplayName(pkg)}</span>
                              </div>
                            </div>
                            {pkg.categoryName && (
                              <Badge variant="outline" className="mb-2">
                                {pkg.categoryName}
                              </Badge>
                            )}
                            {pkg.description && (
                              <p className="text-gray-600 break-words leading-relaxed">{pkg.description}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium mb-2">Package Options</h4>
                            <p className="text-sm text-gray-600">
                              {getPackageOptions(pkg)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>Age group: {pkg.ageGroup}</span>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                onClick={() => navigate(`/coaches/${pkg.coachId}`)}
                              >
                                View Provider
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Create URL with coach filter and eligible classes filter
                                  let classesUrl = `/classes?coachId=${pkg.coachId}`;
                                  
                                  // Add eligible classes filter if specific classes are defined
                                  if (pkg.eligibleClasses && pkg.eligibleClasses !== 'all') {
                                    try {
                                      const eligibleClassIds = JSON.parse(pkg.eligibleClasses);
                                      if (Array.isArray(eligibleClassIds) && eligibleClassIds.length > 0) {
                                        classesUrl += `&packageClasses=${eligibleClassIds.join(',')}`;
                                      }
                                    } catch (e) {
                                      // If parsing fails, fall back to coach-only filter
                                      console.warn('Failed to parse eligible classes:', pkg.eligibleClasses);
                                    }
                                  }
                                  
                                  navigate(classesUrl);
                                }}
                              >
                                View Classes
                              </Button>
                            </div>
                            <Button 
                              className="bg-primary text-white hover:bg-primary/90"
                              size="sm"
                              data-testid={`button-buy-package-${pkg.id}`}
                              onClick={() => {
                                if (pkg.packageType === 'time_bound') {
                                  // Open detail modal for time-bound packages
                                  setSelectedPackageId(pkg.id);
                                  setIsModalOpen(true);
                                } else {
                                  // Handle set_pack packages as before
                                  const options = [];
                                  if (pkg.classCount1 && pkg.price1) options.push({ count: pkg.classCount1, price: pkg.price1 });
                                  if (pkg.classCount2 && pkg.price2) options.push({ count: pkg.classCount2, price: pkg.price2 });
                                  if (pkg.classCount3 && pkg.price3) options.push({ count: pkg.classCount3, price: pkg.price3 });
                                  
                                  // If only one option, go directly to checkout
                                  if (options.length === 1) {
                                    const option = options[0];
                                    navigate(`/package-checkout?packageId=${pkg.id}&classCount=${option.count}&price=${option.price}`);
                                  } else {
                                    // Multiple options, go to selection page
                                    navigate(`/package/${pkg.id}/purchase`);
                                  }
                                }
                              }}
                            >
                              {pkg.packageType === 'time_bound' ? 'View Details' : 'Buy Package'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNavigation />
      
      {/* Time-bound package detail modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-package-details">
          {isLoadingDetails ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : packageDetails ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{packageDetails.title}</DialogTitle>
                <DialogDescription>
                  {packageDetails.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Package Image */}
                {packageDetails.image && (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={packageDetails.image} 
                      alt={packageDetails.title}
                      className="w-full h-64 object-cover"
                      data-testid="package-image"
                    />
                  </div>
                )}

                {/* Package info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Sessions</div>
                      <div className="text-muted-foreground">{packageDetails.totalSessions}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Capacity</div>
                      <div className="text-muted-foreground">
                        {packageDetails.bookedCount || 0} / {packageDetails.capacity}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Price</div>
                      <div className="text-muted-foreground">${packageDetails.price}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Age Group</div>
                      <div className="text-muted-foreground">{packageDetails.ageGroup}</div>
                    </div>
                  </div>
                </div>

                {/* Provider info */}
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={packageDetails.coachProfileImage || undefined} 
                      alt={packageDetails.displayBusinessName && packageDetails.coachBusinessName 
                        ? packageDetails.coachBusinessName 
                        : packageDetails.coachName}
                    />
                    <AvatarFallback>
                      {(packageDetails.displayBusinessName && packageDetails.coachBusinessName 
                        ? packageDetails.coachBusinessName 
                        : packageDetails.coachName).split(' ').map(name => name[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {packageDetails.displayBusinessName && packageDetails.coachBusinessName 
                        ? packageDetails.coachBusinessName 
                        : packageDetails.coachName}
                    </div>
                    <div className="text-sm text-muted-foreground">Provider</div>
                  </div>
                </div>

                {/* Location */}
                {packageDetails.location && (
                  <Card className="p-4" data-testid="package-location">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">Primary Location</div>
                        <div className="text-sm text-muted-foreground">
                          {packageDetails.address || packageDetails.location}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* What to Bring */}
                {packageDetails.whatToBring && (
                  <Card className="p-4" data-testid="what-to-bring">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium mb-1">What to Bring</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {packageDetails.whatToBring}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Sessions list */}
                <div>
                  <h3 className="font-semibold mb-3">Session Schedule</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {packageDetails.sessions?.map((session, index) => {
                      // Format times from ISO timestamps
                      const startTime = new Date(session.startTime).toLocaleTimeString([], { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      });
                      const endTime = new Date(session.endTime).toLocaleTimeString([], { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      });
                      
                      return (
                        <Card key={session.id} className="p-3" data-testid={`session-card-${index}`}>
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
                                  {new Date(session.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {startTime} - {endTime}
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
                      );
                    })}
                  </div>
                </div>

                {/* Booking button */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <div className="text-2xl font-bold">${packageDetails.price}</div>
                    {packageDetails.allowLateJoin && (
                      <div className="text-sm text-muted-foreground">
                        Prorated pricing available for late joins
                      </div>
                    )}
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-primary text-white hover:bg-primary/90"
                    data-testid="button-book-package"
                    onClick={() => {
                      // Navigate to time-bound package checkout
                      navigate(`/time-bound-package-checkout?packageId=${packageDetails.id}`);
                    }}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Package details not found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}