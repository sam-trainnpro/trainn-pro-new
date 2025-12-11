import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Class, ClassCategory, ClassWithSchedules, ClassCardDTO } from "@shared/schema";
import { useLocation } from "wouter";
import queryString from "query-string";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import SearchFilters, { SearchFilters as SearchFiltersType } from "@/components/home/search-filters";
import ClassCard from "@/components/class/class-card";
import ClassListItem from "@/components/class/class-list-item";
import MapView from "@/components/maps/map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";
import { ListFilter, Map as MapIcon, List, Calendar, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSafeAuth } from "../../../hooks/use-auth-safe";

export default function ClassesPage() {
  const { user } = useSafeAuth();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [locationPath, navigate] = useLocation();
  // Get search params from URL and ensure it's a string for queryString.parse
  const searchQuery: string = typeof window.location.search === 'string' ? window.location.search : '';
  const searchParams = queryString.parse(searchQuery);
  // Initialize filters from URL params, but don't set a default date
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

  
  // State to track the current view (list or map)
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Check if any filters are actively applied
  const hasActiveFilters = Boolean(
    filters.query || 
    filters.classType || 
    filters.ageGroup || 
    filters.city || 
    filters.outdoors || 
    filters.date ||
    searchParams.category ||
    searchParams.coachId
  );

  // Build query parameters for server-side filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    // Remove includeSchedules - use consolidated data endpoint
    
    if (filters.query) params.set('q', filters.query);
    if (filters.classType) params.set('type', filters.classType);
    if (filters.ageGroup) params.set('ageGroup', filters.ageGroup);
    if (filters.city) params.set('city', filters.city);
    if (filters.outdoors) params.set('outdoors', filters.outdoors);
    if (filters.date) params.set('date', filters.date.toISOString());
    if (filters.latitude && filters.longitude) {
      params.set('lat', filters.latitude.toString());
      params.set('lng', filters.longitude.toString());
    }
    
    // Handle URL-based filters
    const categoryParam = searchParams.category as string;
    if (categoryParam) params.set('category', categoryParam);
    
    const coachIdParam = searchParams.coachId as string;
    if (coachIdParam) params.set('coachId', coachIdParam);
    
    const packageClassesParam = searchParams.packageClasses as string;
    if (packageClassesParam) params.set('packageClasses', packageClassesParam);
    
    return params.toString();
  };

  // Fetch filtered classes with consolidated data (eliminates N+1 queries)
  const { 
    data: classes, 
    isLoading: isLoadingClasses, 
    error: classesError 
  } = useQuery<ClassCardDTO[]>({
    queryKey: ['/api/classes', filters, searchParams.category, searchParams.coachId, searchParams.packageClasses],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      console.log("Fetching consolidated classes with params:", queryParams);
      const response = await fetch(`/api/classes?${queryParams}`);
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


  // Sort classes by start time (server already handles filtering)
  const sortedClasses = classes?.slice().sort((a, b) => {
    // Classes without start times go to the end
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    
    const aTime = new Date(a.startTime).getTime();
    const bTime = new Date(b.startTime).getTime();
    return aTime - bTime;
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
    
    if (newFilters.ageGroup) {
      queryParams.set('ageGroup', newFilters.ageGroup);
    }
    
    if (newFilters.city) {
      queryParams.set('city', newFilters.city);
    }
    
    if (newFilters.outdoors) {
      queryParams.set('outdoors', newFilters.outdoors);
    }
    
    if (newFilters.date) {
      queryParams.set('date', newFilters.date.toISOString());
    }
    
    if (newFilters.latitude && newFilters.longitude) {
      queryParams.set('lat', newFilters.latitude.toString());
      queryParams.set('lng', newFilters.longitude.toString());
    }
    
    // Preserve category if it's in the URL
    if (searchParams.category) {
      queryParams.set('category', searchParams.category as string);
    }
    
    const queryString = queryParams.toString();
    navigate(`/classes${queryString ? `?${queryString}` : ''}`);
  };

  // Handler for selecting a class on the map
  const handleClassSelect = (classId: number) => {
    navigate(`/classes/${classId}`);
  };
  
  // This function has been removed as we now default to today's date
  // in the search filter component

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Browse Classes - Trainn</title>
        <meta name="description" content="Discover and book outdoor sports, fitness, music and art classes for adults and kids in the San Francisco Bay Area, Los Angeles and beyond. Filter by class type, location, age group, and date to find the perfect class for your needs." />
        <link rel="canonical" href="https://trainn.pro/classes" />
        <meta property="og:title" content="Browse Classes - Trainn" />
        <meta property="og:description" content="Discover and book outdoor sports, fitness, music and art classes for adults and kids in the San Francisco Bay Area, Los Angeles and beyond. Filter by class type, location, age group, and date to find the perfect class for your needs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trainn.pro/classes" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Browse Classes - Trainn" />
        <meta name="twitter:description" content="Discover and book outdoor sports, fitness, music and art classes for adults and kids in the San Francisco Bay Area, Los Angeles and beyond." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow">
        <SearchFilters onSearch={handleSearch} showOnlyFutureCategories={true} />
        
        <section className="py-8 bg-[#F7F7F7]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold">
                  {searchParams.q 
                    ? `Search Results for "${searchParams.q}"`
                    : "Browse All Classes"}
                </h1>
                {filters.date && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 text-primary mr-1" />
                      Showing classes for {filters.date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center bg-white rounded-md shadow-sm p-1">
                <Button 
                  variant={viewMode === "list" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="flex items-center gap-1"
                >
                  <List className="h-4 w-4" />
                  List
                </Button>
                <Button 
                  variant={viewMode === "map" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="flex items-center gap-1"
                >
                  <MapIcon className="h-4 w-4" />
                  Map
                </Button>
              </div>
            </div>
            
            {/* Filters summary */}
            {(filters.classType || filters.ageGroup || filters.city || filters.outdoors || filters.date || searchParams.category) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.classType && categories && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    Type: {categories.find(c => c.id === Number(filters.classType))?.name || filters.classType}
                  </div>
                )}
                
                {filters.ageGroup && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    Age: {filters.ageGroup}
                  </div>
                )}
                
                {filters.city && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    City: {filters.city}
                  </div>
                )}
                
                {filters.outdoors && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    Outdoors: {filters.outdoors}
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
              </div>
            )}
            
            {isLoadingClasses ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Class list skeleton - 2/3 columns */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm">
                    <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 border-b">
                      <Skeleton className="h-6 w-48" />
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-4 flex flex-col md:flex-row gap-2 md:items-center">
                          {/* Time and duration column */}
                          <div className="w-32 mr-4">
                            <Skeleton className="h-5 w-20 mb-2" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                          
                          {/* Class title and coach info */}
                          <div className="flex-1">
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <div className="flex items-center">
                              <Skeleton className="h-4 w-32 mr-2" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                          
                          {/* Category */}
                          <div className="flex flex-col items-end">
                            <Skeleton className="h-6 w-20 mb-2" />
                            <Skeleton className="h-5 w-12" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Map skeleton - 1/3 column */}
                <div className="hidden lg:block">
                  <div className="bg-white rounded-xl shadow-sm h-[600px]">
                    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
                      <MapIcon className="h-12 w-12 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            ) : classesError ? (
              <div className="p-8 text-center text-red-500">
                <p>Error loading classes. Please try again later.</p>
              </div>
            ) : sortedClasses && sortedClasses.length > 0 ? (
              viewMode === "list" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Class List - Takes 2/3 of the space on large screens */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm h-full">
                      
                      
                      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {sortedClasses.map((classItem) => (
                          <ClassListItem key={classItem.id} classItem={classItem} />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Map View - Takes 1/3 of the space on large screens */}
                  <div className="hidden lg:block">
                    <div className="bg-white rounded-xl shadow-sm sticky top-20">
                      <MapView 
                        classes={sortedClasses} 
                        onClassSelect={handleClassSelect}
                        userPrimaryCity={user?.primaryCity}
                        hasActiveFilters={hasActiveFilters}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <MapView 
                    classes={sortedClasses} 
                    onClassSelect={handleClassSelect}
                    userPrimaryCity={user?.primaryCity}
                    hasActiveFilters={hasActiveFilters}
                  />
                </div>
              )
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