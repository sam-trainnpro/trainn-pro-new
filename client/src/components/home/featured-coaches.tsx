import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CoachCard from "@/components/coach/coach-card";

export default function FeaturedCoaches() {
  const { data: coaches, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/coaches'],
  });
  
  // Take only first 4 coaches for featured section
  const featuredCoaches = coaches?.slice(0, 4);
  
  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Top Coaches</h2>
          <Link href="/coaches" className="text-secondary hover:underline font-medium flex items-center">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#F7F7F7] rounded-xl p-4 text-center">
                <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-40 mx-auto mb-3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>Error loading coaches. Please try again later.</p>
          </div>
        ) : featuredCoaches && featuredCoaches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredCoaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No coaches available yet. Check back soon!</p>
            <Link href="/auth?register=true&role=coach">
              <Button className="mt-4 bg-primary text-white">Become a Coach</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
