import { useState } from 'react';
import { Search, MapPin, Calendar, Filter, DollarSign } from 'lucide-react';
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
import { useLocation } from "@/hooks/use-location";

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
  const [searchParams, setSearchParams] = useState<SearchFilters>({
    query: '',
    priceRange: [0, 100],
  });
  
  const { latitude, longitude, getUserLocation, loading } = useLocation();
  
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
    setSearchParams({
      ...searchParams,
      priceRange: [value[0], value[1]]
    });
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    setSearchParams({
      ...searchParams,
      date
    });
  };
  
  const handleClassTypeSelect = (value: string) => {
    setSearchParams({
      ...searchParams,
      classType: value
    });
  };
  
  const handleLocationClick = () => {
    getUserLocation();
  };
  
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
                      <SelectItem value="hiit">HIIT</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="pilates">Pilates</SelectItem>
                      <SelectItem value="crossfit">CrossFit</SelectItem>
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
                      defaultValue={[0, 100]} 
                      max={100} 
                      step={5}
                      onValueChange={handlePriceChange}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>${searchParams.priceRange?.[0]}</span>
                    <span>${searchParams.priceRange?.[1]}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button className="min-w-fit" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
