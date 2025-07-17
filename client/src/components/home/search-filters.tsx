import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Filter, X, RefreshCw, ChevronDown } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useQuery } from "@tanstack/react-query";
import { ClassCategory } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void;
  showOnlyFutureCategories?: boolean;
}

export interface SearchFilters {
  query: string;
  location?: string;
  date?: Date;
  classType?: string;
  ageGroup?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function SearchFilters({ onSearch, showOnlyFutureCategories = false }: SearchFiltersProps) {
  const initialFilters: SearchFilters = {
    query: '',
  };
  
  const [searchParams, setSearchParams] = useState<SearchFilters>(initialFilters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Fetch class categories from database - use filtered categories if requested
  const categoriesEndpoint = showOnlyFutureCategories ? '/api/categories/with-future-classes' : '/api/categories';
  const { data: categories, isLoading: isLoadingCategories } = useQuery<ClassCategory[]>({
    queryKey: [categoriesEndpoint],
    queryFn: async () => {
      const response = await fetch(categoriesEndpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
  });

  // Fetch cities from database
  const { data: cities, isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ['/api/cities'],
    queryFn: async () => {
      const response = await fetch('/api/cities');
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
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
      latitude: null,
      longitude: null
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
      latitude: null,
      longitude: null
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
      latitude: null,
      longitude: null
    });
  };
  
  const handleAgeGroupSelect = (value: string) => {
    const newParams = {
      ...searchParams,
      ageGroup: value
    };
    setSearchParams(newParams);
    onSearch({
      ...newParams,
      latitude: null,
      longitude: null
    });
  };

  const handleCitySelect = (value: string) => {
    const newParams = {
      ...searchParams,
      city: value
    };
    setSearchParams(newParams);
    onSearch({
      ...newParams,
      latitude: null,
      longitude: null
    });
  };
  
  // Reset all filters to initial state
  const handleClearFilters = () => {
    setSearchParams(initialFilters);
    onSearch({
      ...initialFilters,
      latitude: null,
      longitude: null
    });
  };
  
  // Count active filters
  useEffect(() => {
    let count = 0;
    if (searchParams.query) count++;
    if (searchParams.date) count++;
    if (searchParams.classType) count++;
    if (searchParams.ageGroup) count++;
    if (searchParams.city) count++;
    
    setActiveFiltersCount(count);
  }, [searchParams]);
  
  // Apply filters on initial mount and when search parameters change
  // DISABLED: This was causing automatic redirect to /classes on home page load
  // useEffect(() => {
  //   // Add a small delay to ensure initial render is complete
  //   const timer = setTimeout(() => {
  //     onSearch({
  //       ...searchParams,
  //       latitude: null,
  //       longitude: null
  //     });
  //   }, 100);
  //   
  //   return () => clearTimeout(timer);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);
  
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={searchParams.city ? "default" : "outline"} 
                  className="min-w-fit flex items-center gap-1"
                >
                  <span>
                    {searchParams.city 
                      ? searchParams.city
                      : "City"
                    }
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {isLoadingCities ? (
                  <DropdownMenuItem disabled>Loading cities...</DropdownMenuItem>
                ) : cities && cities.length > 0 ? (
                  cities.map(city => (
                    <DropdownMenuItem 
                      key={city} 
                      onClick={() => handleCitySelect(city)}
                    >
                      {city}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No cities available</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={searchParams.classType ? "default" : "outline"} 
                  className="min-w-fit flex items-center gap-1"
                >
                  <span>
                    {searchParams.classType && categories 
                      ? categories.find(c => c.id.toString() === searchParams.classType)?.name || 'Class Type'
                      : "Class Type"
                    }
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {isLoadingCategories ? (
                  <DropdownMenuItem disabled>Loading categories...</DropdownMenuItem>
                ) : categories && categories.length > 0 ? (
                  categories.map(category => (
                    <DropdownMenuItem 
                      key={category.id} 
                      onClick={() => handleClassTypeSelect(category.id.toString())}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No categories available</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={searchParams.ageGroup ? "default" : "outline"} 
                  className="min-w-fit flex items-center gap-1"
                >
                  <span>
                    {searchParams.ageGroup 
                      ? searchParams.ageGroup
                      : "Age Group"
                    }
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleAgeGroupSelect("Adults")}>
                  Adults
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAgeGroupSelect("Kids")}>
                  Kids
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            

            
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
                        latitude: null,
                        longitude: null
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
                        latitude: null,
                        longitude: null
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
                        latitude: null,
                        longitude: null
                      });
                    }}
                  />
                </Badge>
              )}
              
              {searchParams.ageGroup && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Age: {searchParams.ageGroup}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      const newParams = {...searchParams, ageGroup: undefined};
                      setSearchParams(newParams);
                      onSearch({
                        ...newParams,
                        latitude: null,
                        longitude: null
                      });
                    }}
                  />
                </Badge>
              )}
              
              {searchParams.city && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  City: {searchParams.city}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      const newParams = {...searchParams, city: undefined};
                      setSearchParams(newParams);
                      onSearch({
                        ...newParams,
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
