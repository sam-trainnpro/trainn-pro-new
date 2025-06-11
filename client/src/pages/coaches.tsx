import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import CoachCard from "@/components/coach/coach-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Helmet } from "react-helmet";

export default function CoachesPage() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: coaches, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/coaches'],
  });
  
  // Filter coaches based on search query
  const filteredCoaches = coaches?.filter(coach => {
    if (!searchQuery) return true;
    
    const fullName = `${coach.firstName} ${coach.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           (coach.bio && coach.bio.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Top Fitness Coaches - Trainn</title>
        <meta name="description" content="Find and connect with the best fitness coaches in your area. View profiles, specialties, and book personalized training sessions." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow">
        <section className="bg-primary py-12">
          <div className="container mx-auto px-4 text-center text-white">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">Find Your Perfect Coach</h1>
            <p className="max-w-2xl mx-auto mb-8">
              Connect with experienced fitness professionals who will help you achieve your fitness goals
            </p>
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input 
                type="text" 
                placeholder="Search for coaches by name or specialty..." 
                className="w-full pl-10 pr-4 py-3 text-foreground border-gray-300 bg-white"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </section>
        
        <section className="py-10 bg-[#F7F7F7]">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl font-heading font-bold">Our Coaches</h2>
              {filteredCoaches && (
                <p className="text-muted-foreground">
                  Showing {filteredCoaches.length} {filteredCoaches.length === 1 ? 'coach' : 'coaches'}
                </p>
              )}
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 text-center">
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
            ) : filteredCoaches && filteredCoaches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredCoaches.map((coach) => (
                  <CoachCard key={coach.id} coach={coach} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl text-center shadow-sm">
                <h3 className="text-xl font-medium mb-2">No coaches found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Try a different search term or check back later for new coaches." 
                    : "Check back later as we onboard more fitness professionals."}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}
