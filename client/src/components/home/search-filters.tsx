import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Filter, X, RefreshCw, ChevronDown, Loader2 } from 'lucide-react';
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
  onSearch: (filters: SearchFilters, aiUsed?: boolean) => void;
  showOnlyFutureCategories?: boolean;
  hideFilters?: ('outdoors' | 'date' | 'city')[];
  currentFilters?: SearchFilters;
}

export interface SearchFilters {
  query: string;
  location?: string;
  date?: Date;
  classType?: string;
  ageGroup?: string;
  city?: string;
  outdoors?: string;
  latitude?: number | null;
  longitude?: number | null;
  targetAge?: number | null;
}

// Detect if a query looks like natural language (more than one word with conversational words).
// Uses word-boundary matching to avoid false positives on substrings (e.g. "in" inside "training").
// Exported so the mobile search path in classes.tsx can share the same detection logic.
export function isNaturalLanguageQuery(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed.includes(' ')) return false; // single word — skip AI
  const nlPhrases = [
    'for my', 'year old', 'show me', 'find me', 'looking for',
    'i want', 'i need', 'outdoor', 'indoor', 'classes', 'activities',
    'near me', 'in the', 'on the', 'for kids', 'for adults', 'for children',
    'beginner', 'advanced', 'morning', 'evening', 'weekend', 'weekday',
  ];
  const lower = trimmed.toLowerCase();
  // Check for exact word tokens for short words to avoid substring false positives
  const words = lower.split(/\s+/);
  const wordSet = new Set(words);
  const shortWordMatches = ['kids', 'adults', 'fitness', 'sport', 'sports', 'yoga', 'dance'];
  if (shortWordMatches.some(w => wordSet.has(w))) return true;
  return nlPhrases.some(phrase => lower.includes(phrase));
}

export default function SearchFilters({ onSearch, showOnlyFutureCategories = false, hideFilters = [], currentFilters }: SearchFiltersProps) {
  const initialFilters: SearchFilters = {
    query: '',
  };
  
  const [searchParams, setSearchParams] = useState<SearchFilters>(initialFilters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [isAiSearching, setIsAiSearching] = useState(false);

  // Sync internal state when filters are changed externally (e.g. removing a chip from classes.tsx)
  // NOTE: do NOT clear aiSearchUsed here — that state lives in the parent (classes.tsx)
  // and is cleared by explicit user actions (chip removal, dropdown change).
  useEffect(() => {
    if (!currentFilters) return;
    setSearchParams({
      query: currentFilters.query ?? '',
      classType: currentFilters.classType,
      ageGroup: currentFilters.ageGroup,
      city: currentFilters.city,
      outdoors: currentFilters.outdoors,
      date: currentFilters.date,
      latitude: currentFilters.latitude,
      longitude: currentFilters.longitude,
      targetAge: currentFilters.targetAge,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentFilters?.query,
    currentFilters?.classType,
    currentFilters?.ageGroup,
    currentFilters?.city,
    currentFilters?.outdoors,
    currentFilters?.date,
    currentFilters?.targetAge,
  ]);
  
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
  
  const handleSearch = async () => {
    const query = searchParams.query?.trim() || '';

    if (query && isNaturalLanguageQuery(query)) {
      setIsAiSearching(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
      try {
        const response = await fetch('/api/search/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            categories: categories?.map(c => ({ id: c.id, name: c.name })) ?? [],
            cities: cities ?? [],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const result = await response.json();

        if (!result.fallback) {
          // Build enriched filters from AI result
          const aiFilters: SearchFilters = {
            ...searchParams,
            query: result.keywords || '',
            classType: result.categoryId ? String(result.categoryId) : searchParams.classType,
            ageGroup: result.ageGroup || searchParams.ageGroup,
            city: result.city || searchParams.city,
            outdoors: result.outdoors === true ? 'Yes' : result.outdoors === false ? 'No' : searchParams.outdoors,
            latitude: null,
            longitude: null,
            targetAge: result.targetAge != null ? Number(result.targetAge) : null,
          };
          setSearchParams(aiFilters);
          onSearch(aiFilters, true); // pass aiUsed=true to parent
          setIsAiSearching(false);
          return;
        }
      } catch {
        // Timeout or error — fall through to regular keyword search
        clearTimeout(timeout);
      }
      setIsAiSearching(false);
    }

    // Plain keyword search (no AI, or fallback)
    onSearch({
      ...searchParams,
      latitude: null,
      longitude: null,
    }, false);
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
    }, false); // explicit user action — clear AI indicator
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
    }, false);
  };

  const handleTargetAgeSelect = (value: number | null) => {
    const newParams = {
      ...searchParams,
      targetAge: value,
    };
    setSearchParams(newParams);
    onSearch({
      ...newParams,
      latitude: null,
      longitude: null,
    }, false);
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
    }, false);
  };

  const handleOutdoorsSelect = (value: string) => {
    const newParams = {
      ...searchParams,
      outdoors: value
    };
    setSearchParams(newParams);
    onSearch({
      ...newParams,
      latitude: null,
      longitude: null
    }, false);
  };
  
  // Reset all filters to initial state
  const handleClearFilters = () => {
    setSearchParams(initialFilters);
    onSearch({
      ...initialFilters,
      latitude: null,
      longitude: null
    }, false);
  };
  
  // Count active filters (excluding hidden filters)
  useEffect(() => {
    let count = 0;
    if (searchParams.query) count++;
    if (searchParams.date && !hideFilters.includes('date')) count++;
    if (searchParams.classType) count++;
    if (searchParams.ageGroup) count++;
    if (searchParams.city && !hideFilters.includes('city')) count++;
    if (searchParams.outdoors && !hideFilters.includes('outdoors')) count++;
    if (searchParams.targetAge != null) count++;
    
    setActiveFiltersCount(count);
  }, [searchParams, hideFilters]);
  
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
              placeholder='Try "outdoor fitness in San Francisco" or "art classes for kids"' 
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
                <DropdownMenuItem onClick={() => handleAgeGroupSelect("Kids")}>
                  Kids
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAgeGroupSelect("Adults")}>
                  Adults
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAgeGroupSelect("Both")}>
                  Both
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={searchParams.targetAge != null ? "default" : "outline"}
                  className="min-w-fit flex items-center gap-1"
                >
                  <span>
                    {searchParams.targetAge != null
                      ? `Age: ${searchParams.targetAge >= 18 ? "18+" : searchParams.targetAge}`
                      : "Age"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 overflow-y-auto">
                <DropdownMenuItem onClick={() => handleTargetAgeSelect(null)}>
                  Any age
                </DropdownMenuItem>
                {Array.from({ length: 18 }, (_, i) => i).map((age) => (
                  <DropdownMenuItem key={age} onClick={() => handleTargetAgeSelect(age)}>
                    {age}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => handleTargetAgeSelect(18)}>
                  18+
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
            
            {!hideFilters.includes('outdoors') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={searchParams.outdoors ? "default" : "outline"} 
                    className="min-w-fit flex items-center gap-1"
                  >
                    <span>
                      {searchParams.outdoors 
                        ? searchParams.outdoors
                        : "Outdoors"
                      }
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleOutdoorsSelect("Yes")}>
                    Yes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOutdoorsSelect("No")}>
                    No
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {!hideFilters.includes('date') && (
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
            )}
            
            {!hideFilters.includes('city') && (
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
            )}
            
            <Button className="min-w-fit pl-[8px] pr-[8px]" onClick={handleSearch} disabled={isAiSearching}>
              {isAiSearching ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </span>
              ) : (
                'Search'
              )}
            </Button>

            
            {activeFiltersCount > 0 && (
              <Button 
                variant="outline" 
                className="md:hidden min-w-fit flex items-center gap-1 border-dashed"
                onClick={handleClearFilters}
              >
                <span>Clear Filters</span>
                <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
                <X className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
          
          {/* Active filters display — mobile only (desktop shows chips in classes.tsx) */}
          {activeFiltersCount > 0 && (
            <div className="md:hidden flex flex-wrap gap-2 mt-3">
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
              
              {searchParams.date && !hideFilters.includes('date') && (
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
              
              {searchParams.city && !hideFilters.includes('city') && (
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
              
              {searchParams.outdoors && !hideFilters.includes('outdoors') && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Outdoors: {searchParams.outdoors}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      const newParams = {...searchParams, outdoors: undefined};
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

              {searchParams.targetAge != null && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Age: {searchParams.targetAge >= 18 ? "18+" : searchParams.targetAge}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => {
                      const newParams = { ...searchParams, targetAge: null };
                      setSearchParams(newParams);
                      onSearch({ ...newParams, latitude: null, longitude: null });
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
