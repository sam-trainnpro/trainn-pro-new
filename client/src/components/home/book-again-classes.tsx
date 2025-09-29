import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { ClassCardDTO } from "@shared/schema";
import ClassCard from "@/components/class/class-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSafeAuth } from "../../../../hooks/use-auth-safe";

export default function BookAgainClasses() {
  const { user } = useSafeAuth();
  
  // Only fetch recommendations if user is logged in as a customer
  const { data: recommendations, isLoading, error } = useQuery<ClassCardDTO[]>({
    queryKey: ['/api/classes/book-again'],
    enabled: !!user && user.role === 'customer', // Only fetch for logged-in customers
  });
  
  // Don't render anything if:
  // - User is not logged in
  // - User is not a customer  
  // - No recommendations available
  if (!user || user.role !== 'customer' || (!isLoading && (!recommendations || recommendations.length === 0))) {
    return null;
  }
  
  return (
    <section className="py-8 md:py-12 bg-[#F7F7F7]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Book It Again</h2>
          <Link href="/classes" className="text-secondary hover:underline font-medium flex items-center">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-4 flex-shrink-0 w-80" style={{ scrollSnapAlign: 'start' }}>
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
            <p>Error loading recommendations. Please try again later.</p>
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
            {recommendations.map((classItem) => (
              <div key={classItem.id} className="flex-shrink-0 w-80" style={{ scrollSnapAlign: 'start' }}>
                <ClassCard classItem={classItem} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}