import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { User, Class, ClassCategory } from "@shared/schema";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ClassCard from "@/components/class/class-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Mail, 
  Star, 
  ChevronRight,
  UserCircle, 
  Award,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import { useState } from "react";
import { format } from "date-fns";
import certificationIcon from '@assets/Certification Icon_1752030067957.png';

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
    queryKey: [`/api/coaches/${coachId}`],
  });
  
  // Fetch coach's classes
  const { 
    data: coachClasses, 
    isLoading: isLoadingClasses 
  } = useQuery<Class[]>({
    queryKey: [`/api/coaches/${coachId}/classes`],
    enabled: !!coach,
  });

  // Get categories for expertise display
  const { data: categories = [] } = useQuery<ClassCategory[]>({
    queryKey: ['/api/categories'],
  });

  // Get coach rating stats
  const { data: ratingStats } = useQuery({
    queryKey: ['/api/reviews/coach', coachId, 'stats'],
    enabled: !!coach,
  });

  // Get coach reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews/coach', coachId],
    enabled: !!coach,
  });
  
  // Get upcoming and past classes
  const now = new Date();
  const upcomingClasses = coachClasses?.filter(c => new Date(c.startTime) > now) || [];
  const pastClasses = coachClasses?.filter(c => new Date(c.startTime) <= now) || [];

  // Get expertise areas
  const expertiseAreas = coach?.areasOfExpertise || [];
  const expertiseCategories = expertiseAreas
    .map(id => categories.find(cat => cat.id === id))
    .filter(Boolean);
  
  return (
    <div className="flex flex-col min-h-screen">
      {coach && (
        <Helmet>
          <title>Coach {coach.firstName} {coach.lastName} - Trainn Fitness</title>
          <meta 
            name="description" 
            content={coach.bio || `Book fitness classes with Coach ${coach.firstName} ${coach.lastName}. View upcoming classes, specialties, and more.`} 
          />
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
            <h2 className="text-2xl font-bold mb-2">Coach Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The coach you're looking for doesn't exist or may have been removed.
            </p>
            <Button asChild>
              <Link href="/coaches">Browse Coaches</Link>
            </Button>
          </div>
        ) : coach ? (
          <>
            {/* Reviews Section - Positioned at Top */}
            <section className="py-8">
              <div className="container mx-auto px-4">
                <ReviewsSection reviewsData={reviewsData} coach={coach} />
              </div>
            </section>

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
                      Coach {coach.firstName} {coach.lastName}
                    </h1>
                    
                    <div className="flex items-center justify-center md:justify-start mt-1 mb-4">
                      <Star className="text-[#FFCC00] fill-[#FFCC00] h-5 w-5" />
                      <span className="ml-1 font-medium">
                        {reviewsData?.totalReviews > 0 ? reviewsData.averageRating.toFixed(1) : '4.9'}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        ({reviewsData?.totalReviews > 0 ? reviewsData.totalReviews : 0} reviews)
                      </span>
                    </div>
                    
                    {coach.bio ? (
                      <p className="mb-6 max-w-3xl">{coach.bio}</p>
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
                    {expertiseCategories.map(category => (
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#F7F7F7] p-4 rounded-xl flex items-center">
                    <img src={certificationIcon} alt="Certification" className="h-10 w-10 mr-4" />
                    <div>
                      <h3 className="font-medium">Certified Trainer</h3>
                      <p className="text-sm text-muted-foreground">NASM CPT</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#F7F7F7] p-4 rounded-xl flex items-center">
                    <Clock className="h-10 w-10 text-primary mr-4" />
                    <div>
                      <h3 className="font-medium">Experience</h3>
                      <p className="text-sm text-muted-foreground">5+ years</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#F7F7F7] p-4 rounded-xl flex items-center">
                    <Star className="h-10 w-10 text-primary mr-4" />
                    <div>
                      <h3 className="font-medium">Classes</h3>
                      <p className="text-sm text-muted-foreground">
                        {isLoadingClasses ? 'Loading...' : `${coachClasses?.length || 0} total`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Tabs defaultValue="upcoming" className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <TabsList>
                      <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
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
      <div>
        <h2 className="text-3xl font-heading font-bold mb-6">What Students Are Saying</h2>
        <div className="bg-[#F7F7F7] p-8 rounded-xl text-center">
          <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Reviews coming soon</p>
        </div>
      </div>
    );
  }

  const reviews = reviewsData.reviews || [];
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading font-bold mb-2">What Students Are Saying</h2>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`h-6 w-6 ${
                  i < Math.round(reviewsData.averageRating) 
                    ? 'text-[#FFCC00] fill-[#FFCC00]' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xl font-bold">
            {reviewsData.averageRating.toFixed(1)}
          </span>
          <span className="text-muted-foreground">
            ({reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {displayedReviews.map((review: any, index: number) => (
          <div key={review.id || index} className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">
                  {review.customerFirstName || 'Customer'} {review.customerLastName || ''}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {review.createdAt ? format(new Date(review.createdAt), 'MMM d, yyyy') : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center mb-3">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={`h-5 w-5 ${
                    i < review.rating 
                      ? 'text-[#FFCC00] fill-[#FFCC00]' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            
            {review.comment && (
              <p className="text-gray-700 leading-relaxed mb-3">
                {review.comment}
              </p>
            )}
            
            {review.className && (
              <p className="text-xs text-muted-foreground bg-gray-50 px-3 py-1 rounded-full inline-block">
                Class: {review.className}
              </p>
            )}
          </div>
        ))}
      </div>

      {reviews.length > 5 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="flex items-center gap-2 mx-auto"
          >
            {showAllReviews ? (
              <>
                Show Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show More Reviews ({reviews.length - 5} more) <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
