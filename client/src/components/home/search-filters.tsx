import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Filter, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useLocation as useGeoLocation } from "../../../../hooks/use-location";
import { useQuery } from "@tanstack/react-query";
import { ClassCategory } from "@shared/schema";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query: string;
  location?: string;
  date?: Date;
  classType?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function SearchFilters({ onSearch }: SearchFiltersProps) {
  const initialFilters: SearchFilters = {
    query: '',
  };
  
  const [searchParams, setSearchParams] = useState<SearchFilters>(initialFilters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  const { latitude, longitude, getUserLocation, loading } = useGeoLocation();
  
  // Fetch class categories from database
  const { data: categories, isLoading: isLoadingCategories } = useQuery<ClassCategory[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
  });
  

  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({
      ...searchParams,
      query: e.target.value
    });
  };
  
  const handleSearch = () => {
    onSearch({
      ...searchParams,
      latitude,
      longitude
    });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  

  
  const handleDateSelect = (date: Date | undefined) => {
    const newParams = {
      ...searchParams,
      date
    };
    setSearchParams(newParams);
    onSearch({
      ...newParams,
      latitude,
      longitude
    });
  };
  
  const handleClassTypeSelect = (value: string) => {
    const newParams = {
      ...searchParams,
      classType: value
    };
    setSearchParams(newParams);
    onSearch({
      ...newParams,
      latitude,
      longitude
    });
  };
  
  const handleLocationClick = () => {
    getUserLocation();
  };
  
  // Reset all filters to initial state
  const handleClearFilters = () => {
    setSearchParams(initialFilters);
    onSearch(initialFilters);
  };
  
  // Count active filters
  useEffect(() => {
    let count = 0;
    if (searchParams.query) count++;
    if (searchParams.date) count++;
    if (searchParams.classType) count++;
    if (latitude && longitude) count++;
    

    
    setActiveFiltersCount(count);
  }, [searchParams, latitude, longitude]);
  
  // Apply filters on initial mount and when search parameters change
  useEffect(() => {
    // Add a small delay to ensure initial render is complete
    const timer = setTimeout(() => {
      onSearch({
        ...searchParams,
        latitude,
        longitude
      });
    }, 100);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <section className="bg-white py-6 shadow-sm sticky top-[61px] z-30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input 
              type="text" 
              placeholder="Search for classes or coaches" 
              className="w-full pl-10 pr-4 py-3 border-gray-300"
              value={searchParams.query}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="min-w-fit flex items-center gap-1"
                  onClick={handleLocationClick}
                >
                  <span>City</span>
                  <MapPin className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Find classes near you</h4>
                  <Button 
                    className="w-full"
                    onClick={handleLocationClick}
                    disabled={loading}
                  >
                    {loading ? 'Getting location...' : 'Use current location'}
                  </Button>
                  {latitude && longitude && (
                    <p className="text-sm text-muted-foreground">
                      Location set! We'll show classes near you.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant={searchParams.date ? "default" : "outline"} 
                  className="min-w-fit flex items-center gap-1"
                >
                  <span>
                    {searchParams.date 
                      ? searchParams.date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : "Date"
                    }
                  </span>
                  <Calendar className="h-4 w-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={searchParams.date}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-fit flex items-center gap-1">
                  <span>Class Type</span>
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-4">
                  <h4 className="font-medium">Select class type</h4>
                  <Select 
                    onValueChange={handleClassTypeSelect}
                    value={searchParams.classType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <SelectItem value="" disabled>Loading categories...</SelectItem>
                      ) : categories && categories.length > 0 ? (
                        categories.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No categories available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
            

            
            <Button className="min-w-fit pl-[8px] pr-[8px]" onClick={handleSearch}>
              Search
            </Button>
            
            {activeFiltersCount > 0 && (
              <Button 
                variant="outline" 
                className="min-w-fit flex items-center gap-1 border-dashed"
                onClick={handleClearFilters}
              >
                <span>Clear Filters</span>
                <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
                <X className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
          
          {/* Active filters display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {searchParams.query && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {searchParams.query}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      const newParams = {...searchParams, query: ''};
                      setSearchParams(newParams);
                      onSearch({
                        ...newParams,
                        latitude,
                        longitude
                      });
                    }}
                  />
                </Badge>
              )}
              
              {searchParams.date && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Date: {searchParams.date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      const newParams = {...searchParams, date: undefined};
                      setSearchParams(newParams);
                      onSearch({
                        ...newParams,
                        latitude,
                        longitude
                      });
                    }}
                  />
                </Badge>
              )}
              
              {searchParams.classType && categories && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {categories.find(c => c.id.toString() === searchParams.classType)?.name || 'Unknown'}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      const newParams = {...searchParams, classType: undefined};
                      setSearchParams(newParams);
                      onSearch({
                        ...newParams,
                        latitude,
                        longitude
                      });
                    }}
                  />
                </Badge>
              )}
              
              {latitude && longitude && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Near Me
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      // We can't directly reset latitude/longitude as they're from another hook
                      // But we can trigger a search without location
                      onSearch({
                        ...searchParams,
                        latitude: null,
                        longitude: null
                      });
                    }}
                  />
                </Badge>
              )}
              

            </div>
          )}
        </div>
      </div>
    </section>
  );
}
