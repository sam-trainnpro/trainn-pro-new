import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { ClassCardDTO } from "@shared/schema";
import ClassCard from "@/components/class/class-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedClasses() {
  const { data: classes, isLoading, error } = useQuery<ClassCardDTO[]>({
    queryKey: ['/api/classes'],
  });
  
  // Filter for future classes and select specific class types
  const featuredClasses = classes ? (() => {
    const now = new Date();
    const futureClasses = classes.filter(c => c.startTime && new Date(c.startTime) > now);
    
    // Group classes by category
    const classesByCategory = futureClasses.reduce((acc, classItem) => {
      if (!acc[classItem.category.id]) {
        acc[classItem.category.id] = [];
      }
      acc[classItem.category.id].push(classItem);
      return acc;
    }, {} as Record<number, ClassCardDTO[]>);
    
    const selectedClasses: ClassCardDTO[] = [];
    
    // Priority 1: Strength & Conditioning class with price > $0 (categoryId: 3)
    const strengthClasses = classesByCategory[3]?.filter(c => c.price > 0);
    if (strengthClasses && strengthClasses.length > 0) {
      const sortedStrength = strengthClasses.sort((a, b) => 
        new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
      );
      selectedClasses.push(sortedStrength[0]);
    }
    
    // Priority 2: Music class (categoryId: 12) - prefer coaches other than Coach ID 1
    const musicClasses = classesByCategory[12];
    if (musicClasses && musicClasses.length > 0) {
      // First try to find music classes not taught by Coach ID 1
      const nonCoach1Music = musicClasses.filter(c => c.coach.id !== 1);
      
      if (nonCoach1Music.length > 0) {
        const sortedMusic = nonCoach1Music.sort((a, b) => 
          new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
        );
        selectedClasses.push(sortedMusic[0]);
      } else {
        // Fallback to any music class including Coach ID 1
        const sortedMusic = musicClasses.sort((a, b) => 
          new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
        );
        selectedClasses.push(sortedMusic[0]);
      }
    }
    
    // Priority 3: Soccer (categoryId: 6) or Basketball (categoryId: 5)
    const soccerClasses = classesByCategory[6];
    const basketballClasses = classesByCategory[5];
    
    if (soccerClasses && soccerClasses.length > 0) {
      const sortedSoccer = soccerClasses.sort((a, b) => 
        new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
      );
      selectedClasses.push(sortedSoccer[0]);
    } else if (basketballClasses && basketballClasses.length > 0) {
      const sortedBasketball = basketballClasses.sort((a, b) => 
        new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
      );
      selectedClasses.push(sortedBasketball[0]);
    }
    
    // If no music class available, try to fill with Basketball if Soccer was already selected
    if (selectedClasses.length < 3 && !musicClasses) {
      if (basketballClasses && basketballClasses.length > 0 && 
          !selectedClasses.some(c => c.category.id === 5)) {
        const sortedBasketball = basketballClasses.sort((a, b) => 
          new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
        );
        selectedClasses.push(sortedBasketball[0]);
      }
    }
    
    return selectedClasses;
  })() : [];
  
  return (
    <section className="py-8 md:py-12 bg-[#F7F7F7]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Featured Classes</h2>
          <Link href="/classes" className="text-secondary hover:underline font-medium flex items-center">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-4">
                <Skeleton className="h-48 w-full rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between mb-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>Error loading classes. Please try again later.</p>
          </div>
        ) : featuredClasses && featuredClasses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredClasses.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No classes available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
