import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Class, ClassCategory, ClassWithSchedules } from "@shared/schema";
import { useLocation } from "wouter";
import queryString from "query-string";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import SearchFilters, { SearchFilters as SearchFiltersType } from "@/components/home/search-filters";
import ClassCard from "@/components/class/class-card";
import MapView from "@/components/maps/map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";
import { ListFilter, Map, List } from "lucide-react";

export default function ClassesPage() {
  const [location, navigate] = useLocation();
  const searchParams = queryString.parse(location.search);
  const [filters, setFilters] = useState<SearchFiltersType>({
    query: searchParams.q as string || "",
    classType: searchParams.type as string || undefined,
    priceRange: [
      Number(searchParams.minPrice || 0),
      Number(searchParams.maxPrice || 100)
    ],
    latitude: searchParams.lat ? Number(searchParams.lat) : null,
    longitude: searchParams.lng ? Number(searchParams.lng) : null,
  });
  
  // State to track the current view (list or map)
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Parse date from URL if it exists
  useEffect(() => {
    if (searchParams.date) {
      try {
        const dateParam = searchParams.date as string;
        if (dateParam) {
          setFilters(prev => ({
            ...prev,
            date: new Date(dateParam)
          }));
        }
      } catch (error) {
        console.error("Invalid date format in URL", error);
      }
    }
  }, [searchParams]);

  // Fetch all classes with schedules
  const { 
    data: classes, 
    isLoading: isLoadingClasses, 
    error: classesError 
  } = useQuery<ClassWithSchedules[]>({
    queryKey: ['/api/classes'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`${queryKey[0]}?includeSchedules=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
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

  // Filter classes based on search criteria
  const filteredClasses = classes?.filter(classItem => {
    // Text search
    if (filters.query && 
        !classItem.title.toLowerCase().includes(filters.query.toLowerCase()) &&
        !classItem.description.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }

    // Class type filter
    if (filters.classType && Number(filters.classType) !== classItem.categoryId) {
      return false;
    }

    // Category filter from URL
    const categoryParam = searchParams.category as string;
    if (categoryParam && Number(categoryParam) !== classItem.categoryId) {
      return false;
    }

    // Price range filter
    if (filters.priceRange && 
        (classItem.price < filters.priceRange[0] || classItem.price > filters.priceRange[1])) {
      return false;
    }

    // Date filter
    if (filters.date && classItem.startTime) {
      // Only filter classes that have a start time (either one-time classes or specific instances)
      const filterDate = filters.date ? new Date(filters.date) : new Date();
      const classDate = classItem.startTime ? new Date(classItem.startTime) : new Date();
      
      if (filterDate.getFullYear() !== classDate.getFullYear() ||
          filterDate.getMonth() !== classDate.getMonth() ||
          filterDate.getDate() !== classDate.getDate()) {
        return false;
      }
    } else if (filters.date && !classItem.startTime && classItem.isRecurring) {
      // For recurring parent classes without a specific start time
      // Filter them out as we want to show only specific instances when a date is selected
      return false;
    }

    // We could add distance-based filtering here if we had the user's coordinates
    // and if the backend provided geospatial queries

    return true;
  });

  const handleSearch = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    
    const queryParams = new URLSearchParams();
    
    if (newFilters.query) {
      queryParams.set('q', newFilters.query);
    }
    
    if (newFilters.classType) {
      queryParams.set('type', newFilters.classType);
    }
    
    if (newFilters.date) {
      queryParams.set('date', newFilters.date.toISOString());
    }
    
    if (newFilters.priceRange) {
      queryParams.set('minPrice', newFilters.priceRange[0].toString());
      queryParams.set('maxPrice', newFilters.priceRange[1].toString());
    }
    
    if (newFilters.latitude && newFilters.longitude) {
      queryParams.set('lat', newFilters.latitude.toString());
      queryParams.set('lng', newFilters.longitude.toString());
    }
    
    const url = `/classes?${queryParams.toString()}`;
    navigate(url, { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Browse Fitness Classes - Elevate</title>
        <meta name="description" content="Discover and book fitness classes from top coaches. Filter by class type, location, price, and date to find the perfect workout for your needs." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow">
        <SearchFilters onSearch={handleSearch} />
        
        <section className="py-8 bg-[#F7F7F7]">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-6">
              {searchParams.q 
                ? `Search Results for "${searchParams.q}"`
                : "Browse All Classes"}
            </h1>
            
            {/* Filters summary */}
            {(filters.classType || filters.date || searchParams.category) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.classType && categories && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    Type: {categories.find(c => c.id === Number(filters.classType))?.name || filters.classType}
                  </div>
                )}
                
                {searchParams.category && categories && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    Category: {categories.find(c => c.id === Number(searchParams.category))?.name || 'Selected category'}
                  </div>
                )}
                
                {filters.date && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    Date: {filters.date.toLocaleDateString()}
                  </div>
                )}
                
                {filters.priceRange && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    Price: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  </div>
                )}
              </div>
            )}
            
            {isLoadingClasses ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
            ) : classesError ? (
              <div className="p-8 text-center text-red-500">
                <p>Error loading classes. Please try again later.</p>
              </div>
            ) : filteredClasses && filteredClasses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((classItem) => (
                  <ClassCard key={classItem.id} classItem={classItem} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl text-center shadow-sm">
                <h3 className="text-xl font-medium mb-2">No classes found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search filters or check back later for new classes.
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
