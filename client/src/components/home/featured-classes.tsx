import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { Class } from "@shared/schema";
import ClassCard from "@/components/class/class-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedClasses() {
  const { data: classes, isLoading, error } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });
  
  // Filter for future classes and select diverse class types
  const featuredClasses = classes ? (() => {
    const now = new Date();
    const futureClasses = classes.filter(c => new Date(c.dateTime) > now);
    
    // Group classes by category to ensure diversity
    const classesByCategory = futureClasses.reduce((acc, classItem) => {
      if (!acc[classItem.categoryId]) {
        acc[classItem.categoryId] = [];
      }
      acc[classItem.categoryId].push(classItem);
      return acc;
    }, {} as Record<number, Class[]>);
    
    // Select one class from each category, up to 3 different categories
    const selectedClasses: Class[] = [];
    const categories = Object.keys(classesByCategory);
    
    for (const categoryId of categories) {
      if (selectedClasses.length >= 3) break;
      const categoryClasses = classesByCategory[Number(categoryId)];
      // Sort by date and take the earliest one from this category
      const sortedClasses = categoryClasses.sort((a, b) => 
        new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      );
      selectedClasses.push(sortedClasses[0]);
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
