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
import ClassListItem from "@/components/class/class-list-item";
import MapView from "@/components/maps/map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";
import { ListFilter, Map as MapIcon, List, Calendar, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ClassesPage() {
  const [locationPath, navigate] = useLocation();
  // Get search params from URL and ensure it's a string for queryString.parse
  const searchQuery: string = typeof window.location.search === 'string' ? window.location.search : '';
  const searchParams = queryString.parse(searchQuery);
  // Initialize with today's date if not specified in URL
  const [filters, setFilters] = useState<SearchFiltersType>({
    query: typeof searchParams.q === 'string' ? searchParams.q : "",
    classType: typeof searchParams.type === 'string' ? searchParams.type : undefined,
    date: searchParams.date ? new Date(searchParams.date as string) : new Date(),
    priceRange: [
      Number(searchParams.minPrice || 0),
      Number(searchParams.maxPrice || 100)
    ],
    latitude: typeof searchParams.lat === 'string' ? Number(searchParams.lat) : null,
    longitude: typeof searchParams.lng === 'string' ? Number(searchParams.lng) : null,
  });
  
  // State to track the current view (list or map)
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Apply default date filter on initial load
  useEffect(() => {
    // Add the date to URL if not already present
    if (!searchParams.date) {
      const today = new Date();
      const queryParams = new URLSearchParams(window.location.search);
      queryParams.set('date', today.toISOString());
      
      // Update the URL without triggering a page reload
      // This ensures the date filter is persisted in the URL
      const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, []);

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

    // Class type filter (by category ID from database)
    if (filters.classType && classItem.categoryId !== undefined) {
      const classTypeId = Number(filters.classType);
      if (!isNaN(classTypeId) && classTypeId !== classItem.categoryId) {
        return false;
      }
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

    // Date filter - improved to handle null/undefined startTime
    if (filters.date) {
      // Class must have a start time to be filtered by date
      if (!classItem.startTime) {
        return false;
      }
      
      // Normalize dates by setting hours to 0 to compare just the day
      const filterDate = new Date(filters.date);
      filterDate.setHours(0, 0, 0, 0);
      
      const classDate = new Date(classItem.startTime);
      classDate.setHours(0, 0, 0, 0);
      
      // Compare dates with time component removed
      if (filterDate.getTime() !== classDate.getTime()) {
        return false;
      }
    }

    // Location filter (within X miles)
    if (filters.latitude && filters.longitude && classItem.latitude && classItem.longitude) {
      // TODO: Add calculation to filter by distance once we have that data
      // For now, we'll skip this filter
    }

    return true;
  });
  
  // Default - use today's date if not specified
  const currentFilterDate = filters.date || new Date();
  
  // Sort classes by start time
  const sortedClasses = filteredClasses?.slice().sort((a, b) => {
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
        <title>Browse Fitness Classes - Elevate</title>
        <meta name="description" content="Discover and book fitness classes from top coaches. Filter by class type, location, price, and date to find the perfect workout for your needs." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow">
        <SearchFilters onSearch={handleSearch} />
        
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
                      {/* Header has been removed as requested */}
                      
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
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <MapView 
                    classes={sortedClasses} 
                    onClassSelect={handleClassSelect} 
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