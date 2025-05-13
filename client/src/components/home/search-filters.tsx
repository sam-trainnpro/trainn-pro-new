import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Filter, DollarSign, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useLocation as useGeoLocation } from "@/hooks/use-location";
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
  priceRange?: [number, number];
  latitude?: number | null;
  longitude?: number | null;
}

export default function SearchFilters({ onSearch }: SearchFiltersProps) {
  const initialFilters: SearchFilters = {
    query: '',
    priceRange: [0, 100],
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
  
  // Fetch price range data from classes
  const { data: classes } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await fetch('/api/classes');
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      return response.json();
    },
    select: (data) => {
      if (data && data.length > 0) {
        // Calculate min and max price from all classes
        const prices = data.map((classItem: any) => classItem.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return { minPrice, maxPrice, classes: data };
      }
      return { minPrice: 0, maxPrice: 100, classes: data };
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
  
  const handlePriceChange = (value: number[]) => {
    const newParams = {
      ...searchParams,
      priceRange: [value[0], value[1]]
    };
    setSearchParams(newParams);
    // Only trigger search after a short delay to avoid too many requests while sliding
    const delayDebounceFn = setTimeout(() => {
      onSearch({
        ...newParams,
        latitude,
        longitude
      });
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
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
    
    // Only count price if it's different from initial values
    if (searchParams.priceRange && 
        (searchParams.priceRange[0] !== initialFilters.priceRange?.[0] || 
         searchParams.priceRange[1] !== initialFilters.priceRange?.[1])) {
      count++;
    }
    
    setActiveFiltersCount(count);
  }, [searchParams, latitude, longitude]);
  
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
                  <span>Location</span>
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
                <Button variant="outline" className="min-w-fit flex items-center gap-1">
                  <span>Date</span>
                  <Calendar className="h-4 w-4" />
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
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-fit flex items-center gap-1">
                  <span>Price</span>
                  <DollarSign className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Price range</h4>
                  <div className="px-2">
                    <Slider 
                      defaultValue={searchParams.priceRange} 
                      max={classes?.maxPrice || 100} 
                      min={classes?.minPrice || 0}
                      step={5}
                      onValueChange={handlePriceChange}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>${searchParams.priceRange?.[0]}</span>
                    <span>${searchParams.priceRange?.[1] || (classes?.maxPrice || 100)}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button className="min-w-fit" onClick={handleSearch}>
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
                  Date: {searchParams.date.toLocaleDateString()}
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
              
              {searchParams.priceRange && 
               (searchParams.priceRange[0] !== initialFilters.priceRange?.[0] || 
                searchParams.priceRange[1] !== initialFilters.priceRange?.[1]) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Price: ${searchParams.priceRange[0]} - ${searchParams.priceRange[1]}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      setSearchParams({
                        ...searchParams, 
                        priceRange: initialFilters.priceRange
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
