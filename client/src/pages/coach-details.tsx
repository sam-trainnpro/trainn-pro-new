import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { User, Class, ClassCategory, ClassPackage } from "@shared/schema";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ClassCard from "@/components/class/class-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar,
  Star, 
  ChevronRight,
  UserCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";

export default function CoachDetailsPage() {
  const [, navigate] = useLocation();
  const [_, params] = useRoute<{ id: string }>("/coaches/:id");
  
  if (!params) {
    navigate("/coaches");
    return null;
  }
  
  const coachId = parseInt(params.id);
  
  // Fetch coach details
  const { 
    data: coach, 
    isLoading: isLoadingCoach, 
    error: coachError 
  } = useQuery<User>({
    queryKey: ['/api/coaches', coachId],
  });
  
  // Fetch coach's classes
  const { 
    data: coachClasses, 
    isLoading: isLoadingClasses 
  } = useQuery<Class[]>({
    queryKey: ['/api/coaches', coachId, 'classes'],
    enabled: !!coachId,
  });

  // Get categories for expertise display
  const { data: categories = [] } = useQuery<ClassCategory[]>({
    queryKey: ['/api/categories'],
  });

  // Get coach rating stats
  const { data: ratingStats } = useQuery<{ averageRating: number; totalReviews: number }>({
    queryKey: ['/api/reviews/coach', coachId, 'stats'],
    enabled: !!coachId,
  });

  // Get coach reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews/coach', coachId],
    enabled: !!coachId,
  });
  
  // Get coach packages (only active ones for public view)
  const { data: allCoachPackages = [], isLoading: isLoadingPackages } = useQuery<ClassPackage[]>({
    queryKey: ['/api/coaches', coachId, 'packages'],
    enabled: !!coachId,
  });
  
  const coachPackages = allCoachPackages.filter(pkg => pkg.isActive);
  
  // Get upcoming and past classes
  const now = new Date();
  const upcomingClasses = coachClasses?.filter(c => c.startTime && new Date(c.startTime) > now) || [];
  const pastClasses = coachClasses?.filter(c => c.startTime && new Date(c.startTime) <= now) || [];

  // Get expertise areas
  const expertiseAreas = coach?.areasOfExpertise || [];
  const expertiseCategories = expertiseAreas
    .map(id => categories.find(cat => cat.id === id))
    .filter(Boolean);
  
  return (
    <div className="flex flex-col min-h-screen">
      {coach && (
        <Helmet>
          <title>{coach.displayBusinessName && coach.businessName ? coach.businessName : `${coach.firstName} ${coach.lastName}`} - Trainn Fitness</title>
          <meta 
            name="description" 
            content={coach.bio || `Book fitness classes with ${coach.displayBusinessName && coach.businessName ? coach.businessName : `${coach.firstName} ${coach.lastName}`}. View upcoming classes, specialties, and more.`} 
          />
          <link rel="canonical" href={`https://trainn.pro/coaches/${coach.id}`} />
          <meta property="og:title" content={`${coach.displayBusinessName && coach.businessName ? coach.businessName : `${coach.firstName} ${coach.lastName}`} - Trainn Fitness`} />
          <meta property="og:description" content={coach.bio || `Book fitness classes with ${coach.displayBusinessName && coach.businessName ? coach.businessName : `${coach.firstName} ${coach.lastName}`}. View upcoming classes, specialties, and more.`} />
          <meta property="og:type" content="profile" />
          <meta property="og:url" content={`https://trainn.pro/coaches/${coach.id}`} />
          <meta property="og:image" content={coach.profileImage || "https://trainn.pro/default-coach-image.jpg"} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${coach.displayBusinessName && coach.businessName ? coach.businessName : `${coach.firstName} ${coach.lastName}`} - Trainn Fitness`} />
          <meta name="twitter:description" content={coach.bio || `Book fitness classes with ${coach.displayBusinessName && coach.businessName ? coach.businessName : `${coach.firstName} ${coach.lastName}`}. View upcoming classes, specialties, and more.`} />
          <meta name="twitter:image" content={coach.profileImage || "https://trainn.pro/default-coach-image.jpg"} />
        </Helmet>
      )}
      
      <Header />
      
      <main className="flex-grow">
        {isLoadingCoach ? (
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="flex-1 text-center md:text-left">
                <Skeleton className="h-8 w-64 mx-auto md:mx-0 mb-2" />
                <Skeleton className="h-4 w-40 mx-auto md:mx-0 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex gap-2 justify-center md:justify-start">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            </div>
          </div>
        ) : coachError ? (
          <div className="container mx-auto px-4 py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Provider Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The coach you're looking for doesn't exist or may have been removed.
            </p>
            <Button asChild>
              <Link href="/coaches">Browse Coaches</Link>
            </Button>
          </div>
        ) : coach ? (
          <>
            <section className="bg-[#F7F7F7] py-8">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {coach.profileImage ? (
                      <img 
                        src={coach.profileImage} 
                        alt={`${coach.firstName} ${coach.lastName}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle className="h-32 w-32 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-heading font-bold">
                      {coach.displayBusinessName && coach.businessName ? coach.businessName : `${coach.firstName} ${coach.lastName}`}
                    </h1>
                    
                    {ratingStats && ratingStats.totalReviews > 0 && (
                      <div className="flex items-center justify-center md:justify-start mt-1 mb-4">
                        <Star className="text-[#FFCC00] fill-[#FFCC00] h-5 w-5" />
                        <span className="ml-1 font-medium">
                          {ratingStats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          ({ratingStats.totalReviews} {ratingStats.totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    )}
                    
                    {coach.bio ? (
                      <div className="mb-6 max-w-3xl whitespace-pre-line">
                        {coach.bio.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
                          if (part.match(/^https?:\/\//)) {
                            return (
                              <a 
                                key={index}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline hover:text-primary/80"
                              >
                                {part}
                              </a>
                            );
                          }
                          return part;
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic mb-6">
                        This coach hasn't added a bio yet.
                      </p>
                    )}
                    
                    {/* Buttons removed as requested */}
                  </div>
                </div>
              </div>
            </section>
            
            <section className="py-8">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl font-heading font-bold mb-4">Areas of Expertise</h2>
                {expertiseCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {expertiseCategories.map(category => category && (
                      <Badge 
                        key={category.id} 
                        variant="secondary"
                        className="bg-primary/10 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/20"
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground mb-6">
                    This coach hasn't specified their areas of expertise yet.
                  </p>
                )}
                
                {coach.certifications && (
                  <>
                    <h2 className="text-2xl font-heading font-bold mb-4 mt-8">Certifications</h2>
                    <div className="bg-[#F7F7F7] p-4 rounded-xl mb-6">
                      <p className="text-gray-700 whitespace-pre-line">{coach.certifications}</p>
                    </div>
                  </>
                )}

                {/* Reviews Section */}
                <ReviewsSection reviewsData={reviewsData} coach={coach} />
                

                
                <Tabs defaultValue="upcoming" className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <TabsList>
                      <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
                      {coachPackages.length > 0 && (
                        <TabsTrigger value="packages">Packages</TabsTrigger>
                      )}
                      <TabsTrigger value="past">Past Classes</TabsTrigger>
                    </TabsList>
                    
                    <Link href="/classes" className="text-secondary hover:underline font-medium flex items-center">
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                  
                  <TabsContent value="upcoming">
                    {isLoadingClasses ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-80 w-full rounded-xl" />
                        ))}
                      </div>
                    ) : upcomingClasses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingClasses.map((classItem) => (
                          <ClassCard key={classItem.id} classItem={classItem} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-[#F7F7F7] rounded-xl">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Upcoming Classes</h3>
                        <p className="text-muted-foreground mb-4">
                          Coach {coach.firstName} doesn't have any scheduled classes right now.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="past">
                    {isLoadingClasses ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-80 w-full rounded-xl" />
                        ))}
                      </div>
                    ) : pastClasses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastClasses.map((classItem) => (
                          <ClassCard key={classItem.id} classItem={classItem} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-[#F7F7F7] rounded-xl">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Past Classes</h3>
                        <p className="text-muted-foreground mb-4">
                          Coach {coach.firstName} doesn't have any past classes yet.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {coachPackages.length > 0 && (
                    <TabsContent value="packages">
                      {isLoadingPackages ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-80 w-full rounded-xl" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {coachPackages.filter(pkg => pkg.isActive).map((pkg) => (
                            <PackageCard key={pkg.id} pkg={pkg} categories={categories} />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </section>
          </>
        ) : null}
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}

// Reviews Section Component
interface ReviewsSectionProps {
  reviewsData: any;
  coach: User;
}

function ReviewsSection({ reviewsData, coach }: ReviewsSectionProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  if (!reviewsData || reviewsData.reviews.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-heading font-bold mb-4">Reviews</h2>
        <div className="bg-[#F7F7F7] p-6 rounded-xl text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Reviews coming soon</p>
        </div>
      </div>
    );
  }

  const reviews = reviewsData.reviews || [];
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-heading font-bold mb-4">Reviews</h2>
      
      <div className="space-y-4">
        {displayedReviews.map((review: any, index: number) => (
          <div key={review.id || index} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col space-y-3">
              {/* Reviewer name and star rating on top line */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-lg text-gray-900">
                  {review.customerFirstName || 'Customer'}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating 
                          ? 'text-[#FFCC00] fill-[#FFCC00]' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Relative date */}
              <div className="text-sm text-gray-500">
                {review.updatedAt ? formatDistanceToNow(new Date(review.updatedAt), { addSuffix: true }) : ''}
              </div>
              
              {/* Review comment */}
              {review.comment && (
                <p className="text-gray-800 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 5 && (
        <div className="mt-4 text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="flex items-center gap-2"
          >
            {showAllReviews ? (
              <>
                Show Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show All Reviews ({reviews.length})
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Package Card Component
interface PackageCardProps {
  pkg: ClassPackage;
  categories: ClassCategory[];
}

function PackageCard({ pkg, categories }: PackageCardProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'No Category';
    const category = categories.find((cat: ClassCategory) => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const renderPackageDetails = (pkg: ClassPackage) => {
    if (pkg.packageType === 'set_pack') {
      const options = [];
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
      return 'Time-bound package';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {pkg.title}
          {pkg.isActive ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="w-3 h-3 mr-1" />
              Inactive
            </Badge>
          )}
        </CardTitle>
        {pkg.description && (
          <p className="text-gray-600 text-sm leading-relaxed">{pkg.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium">{getCategoryName(pkg.categoryId)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Age Group:</span>
            <span className="font-medium">{pkg.ageGroup}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Package Type:</span>
            <span className="font-medium">
              {pkg.packageType === 'set_pack' ? 'Set Pack' : 'Time-bound'}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm text-gray-600 mb-2">Package Options:</h4>
          <p className="text-sm font-medium">{renderPackageDetails(pkg)}</p>
        </div>

        {pkg.eligibleClasses && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm text-gray-600 mb-2">Eligible Classes:</h4>
            <p className="text-sm">{pkg.eligibleClasses}</p>
          </div>
        )}
        
        <div className="pt-2">
          <Button className="w-full" size="sm" asChild>
            <Link href={`/package/${pkg.id}/purchase`}>
              View Package Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
