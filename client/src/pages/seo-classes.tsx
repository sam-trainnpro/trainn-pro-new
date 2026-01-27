import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClassCardDTO, ClassCategory, ClassWithSchedules } from "@shared/schema";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import SearchFilters, { SearchFilters as SearchFiltersType } from "@/components/home/search-filters";
import ClassListItem from "@/components/class/class-list-item";
import MapView from "@/components/maps/map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import { Map as MapIcon, List } from "lucide-react";
import { 
  cities, 
  ageGroups, 
  categories as seoCategories, 
  generatePageTitle, 
  generatePageHeader,
  generateMetaDescription,
  generateFAQSchema,
  generateBreadcrumbSchema
} from "@/lib/seo-config";
import { useSafeAuth } from "../../../hooks/use-auth-safe";

interface SEOClassesPageProps {
  citySlug: string;
  ageGroupSlug: string;
  categorySlug?: string;
}

export default function SEOClassesPage({ citySlug, ageGroupSlug, categorySlug }: SEOClassesPageProps) {
  const { user } = useSafeAuth();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [additionalFilters, setAdditionalFilters] = useState<SearchFiltersType>({
    query: "",
  });

  const city = cities[citySlug];
  const ageGroup = ageGroups[ageGroupSlug];
  const category = categorySlug ? seoCategories[categorySlug] : null;

  if (!city || !ageGroup) {
    navigate("/classes");
    return null;
  }

  const pageTitle = generatePageTitle(citySlug, ageGroupSlug, categorySlug);
  const pageHeader = generatePageHeader(citySlug, ageGroupSlug, categorySlug);
  const metaDescription = generateMetaDescription(citySlug, ageGroupSlug, categorySlug);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (additionalFilters.query) params.set('q', additionalFilters.query);
    params.set('city', city.filterValue);
    params.set('ageGroup', ageGroup.filterValue);
    if (additionalFilters.outdoors) params.set('outdoors', additionalFilters.outdoors);
    if (additionalFilters.date) params.set('date', additionalFilters.date.toISOString());
    
    if (category && category.categoryIds.length > 1) {
      params.set('categories', category.categoryIds.join(','));
    } else if (additionalFilters.classType) {
      params.set('category', additionalFilters.classType);
    } else if (category && category.categoryIds.length === 1) {
      params.set('category', String(category.categoryIds[0]));
    }
    
    return params.toString();
  };

  const { 
    data: classes, 
    isLoading: isLoadingClasses, 
    error: classesError 
  } = useQuery<ClassCardDTO[]>({
    queryKey: ['/api/classes', citySlug, ageGroupSlug, categorySlug, additionalFilters],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const response = await fetch(`/api/classes?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    }
  });

  const sortedClasses = classes ? [...classes].sort((a, b) => {
    const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return dateA - dateB;
  }) : [];

  const handleSearch = (newFilters: SearchFiltersType) => {
    setAdditionalFilters(newFilters);
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-4">
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Helmet>
        <title>{pageTitle} | Trainn</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${pageTitle} | Trainn`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://trainn.pro/classes/${citySlug}/${ageGroupSlug}${categorySlug ? `/${categorySlug}` : ''}`} />
        <link rel="canonical" href={`https://trainn.pro/classes/${citySlug}/${ageGroupSlug}${categorySlug ? `/${categorySlug}` : ''}`} />
        <script type="application/ld+json">
          {JSON.stringify(generateFAQSchema(citySlug, ageGroupSlug, categorySlug))}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(generateBreadcrumbSchema(citySlug, ageGroupSlug, categorySlug))}
        </script>
      </Helmet>
      
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {pageHeader}
          </h1>
          <p className="text-gray-600 mb-4">
            {metaDescription}
          </p>
          <a 
            href="/classes" 
            className="text-primary hover:underline text-sm"
          >
            View all classes
          </a>
        </div>

        <div className="mb-6">
          <SearchFilters 
            onSearch={handleSearch} 
          />
        </div>

        <div className="md:hidden flex justify-end mb-4">
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded ${
                viewMode === "list" 
                  ? "bg-primary text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded ${
                viewMode === "map" 
                  ? "bg-primary text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MapIcon className="h-4 w-4" />
              <span>Map</span>
            </button>
          </div>
        </div>

        <div className="hidden md:grid md:grid-cols-2 gap-6">
          <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {isLoadingClasses ? (
              renderLoadingSkeleton()
            ) : classesError ? (
              <div className="text-center py-12">
                <p className="text-red-500">Error loading classes. Please try again.</p>
              </div>
            ) : sortedClasses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
                <p className="text-gray-600 mb-4">
                  We don't have any classes matching these criteria right now.
                </p>
                <a 
                  href="/classes" 
                  className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
                >
                  Browse All Classes
                </a>
              </div>
            ) : (
              sortedClasses.map((classItem) => (
                <div 
                  key={classItem.id}
                  onMouseEnter={() => setSelectedClassId(classItem.id)}
                  onMouseLeave={() => setSelectedClassId(null)}
                >
                  <ClassListItem classItem={classItem} />
                </div>
              ))
            )}
          </div>

          <div className="h-[calc(100vh-300px)] rounded-lg overflow-hidden shadow-lg sticky top-4">
            <MapView 
              classes={sortedClasses as unknown as ClassWithSchedules[]} 
              selectedClassId={selectedClassId}
              onClassSelect={(id) => navigate(`/classes/${id}`)}
            />
          </div>
        </div>

        <div className="md:hidden">
          {viewMode === "list" ? (
            <div className="space-y-4">
              {isLoadingClasses ? (
                renderLoadingSkeleton()
              ) : classesError ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading classes. Please try again.</p>
                </div>
              ) : sortedClasses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
                  <p className="text-gray-600 mb-4">
                    We don't have any classes matching these criteria right now.
                  </p>
                  <a 
                    href="/classes" 
                    className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
                  >
                    Browse All Classes
                  </a>
                </div>
              ) : (
                sortedClasses.map((classItem) => (
                  <ClassListItem key={classItem.id} classItem={classItem} />
                ))
              )}
            </div>
          ) : (
            <div className="h-[500px] rounded-lg overflow-hidden shadow-lg">
              <MapView 
                classes={sortedClasses as unknown as ClassWithSchedules[]} 
                selectedClassId={null}
                onClassSelect={(id) => navigate(`/classes/${id}`)}
              />
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}
