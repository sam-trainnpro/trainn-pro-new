import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { User, Class } from "@shared/schema";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ClassCard from "@/components/class/class-card";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Mail, 
  Star, 
  ChevronRight,
  UserCircle, 
  Award,
  Clock,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";

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
                      <span className="ml-1 font-medium">4.9</span>
                      <span className="text-muted-foreground ml-1">(124 reviews)</span>
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
                

                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#F7F7F7] p-4 rounded-xl flex items-center">
                    <Award className="h-10 w-10 text-primary mr-4" />
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
