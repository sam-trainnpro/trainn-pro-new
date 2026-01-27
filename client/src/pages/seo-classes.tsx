import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClassCardDTO } from "@shared/schema";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ClassCard from "@/components/class/class-card";
import ClassListItem from "@/components/class/class-list-item";
import MapView from "@/components/maps/map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";
import { Map as MapIcon, List } from "lucide-react";
import { 
  cities, 
  ageGroups, 
  categories, 
  generatePageTitle, 
  generatePageHeader,
  generateMetaDescription 
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

  const city = cities[citySlug];
  const ageGroup = ageGroups[ageGroupSlug];
  const category = categorySlug ? categories[categorySlug] : null;

  if (!city || !ageGroup) {
    navigate("/classes");
    return null;
  }

  const pageTitle = generatePageTitle(citySlug, ageGroupSlug, categorySlug);
  const pageHeader = generatePageHeader(citySlug, ageGroupSlug, categorySlug);
  const metaDescription = generateMetaDescription(citySlug, ageGroupSlug, categorySlug);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set('city', city.filterValue);
    params.set('ageGroup', ageGroup.filterValue);
    
    if (category) {
      params.set('categories', category.categoryIds.join(','));
    }
    
    return params.toString();
  };

  const { 
    data: classes, 
    isLoading: isLoadingClasses, 
    error: classesError 
  } = useQuery<ClassCardDTO[]>({
    queryKey: ['/api/classes', citySlug, ageGroupSlug, categorySlug],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const response = await fetch(`/api/classes?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    }
  });

  const { data: allCategories } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/categories'],
  });

  const sortedClasses = classes ? [...classes].sort((a, b) => {
    const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return dateA - dateB;
  }) : [];

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <div className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );

  const getCategoryName = (categoryId: number | null | undefined): string => {
    if (!categoryId || !allCategories) return "";
    const cat = allCategories.find(c => c.id === categoryId);
    return cat?.name || "";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Helmet>
        <title>{pageTitle} | Trainn</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${pageTitle} | Trainn`} />
        <meta property="og:description" content={metaDescription} />
        <link rel="canonical" href={`https://trainn.pro/classes/${citySlug}/${ageGroupSlug}${categorySlug ? `/${categorySlug}` : ''}`} />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {pageHeader}
          </h1>
          <p className="text-gray-600">
            {metaDescription}
          </p>
          <div className="mt-4">
            <a 
              href="/classes" 
              className="text-primary hover:underline text-sm"
            >
              View all classes
            </a>
          </div>
        </div>

        <div className="flex justify-end mb-4">
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
              <span className="hidden sm:inline">List</span>
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
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div>
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
              <div className="space-y-4">
                {sortedClasses.map((classItem) => (
                  <ClassListItem
                    key={classItem.id}
                    classItem={classItem}
                    categoryName={getCategoryName(classItem.categoryId)}
                    onLike={() => {}}
                    isLiked={false}
                    isLoggedIn={!!user}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
            <MapView 
              classes={sortedClasses} 
              selectedClassId={null}
              onClassSelect={(id) => navigate(`/classes/${id}`)}
            />
          </div>
        )}
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}
