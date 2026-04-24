import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { SearchFilters } from "@/components/home/search-filters";
import { ClassCategory } from "@shared/schema";

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: SearchFilters;
  onApplyFilters: (filters: SearchFilters) => void;
  categories: ClassCategory[] | undefined;
  cities: string[] | undefined;
  resultCount?: number;
}

export default function MobileFilterSheet({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
  categories,
  cities,
  resultCount,
}: MobileFilterSheetProps) {
  const [pending, setPending] = useState<SearchFilters>({ ...currentFilters });

  useEffect(() => {
    if (isOpen) {
      setPending({ ...currentFilters });
    }
  }, [isOpen, currentFilters]);

  const handleClearAll = () => {
    const cleared: SearchFilters = { query: currentFilters.query };
    setPending(cleared);
    onApplyFilters(cleared);
    onClose();
  };

  const handleViewActivities = () => {
    onApplyFilters(pending);
    onClose();
  };

  const activeCount = [
    pending.ageGroup,
    pending.classType,
    pending.city,
    pending.outdoors,
    pending.date,
  ].filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full max-w-sm flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-4 border-b">
          <SheetTitle className="text-lg font-semibold text-left">Filter Activities</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Age Group */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Age Group</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>{pending.ageGroup || "All ages"}</span>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[200px]">
                <DropdownMenuItem onClick={() => setPending({ ...pending, ageGroup: undefined })}>
                  All ages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPending({ ...pending, ageGroup: "Kids" })}>
                  Kids
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPending({ ...pending, ageGroup: "Adults" })}>
                  Adults
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPending({ ...pending, ageGroup: "Both" })}>
                  Both
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Class Type */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Class Type</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {pending.classType && categories
                      ? categories.find((c) => c.id.toString() === pending.classType)?.name || "Any type"
                      : "Any type"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[200px]">
                <DropdownMenuItem onClick={() => setPending({ ...pending, classType: undefined })}>
                  Any type
                </DropdownMenuItem>
                {categories?.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => setPending({ ...pending, classType: cat.id.toString() })}
                  >
                    {cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Outdoors */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Outdoors</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>{pending.outdoors || "Any"}</span>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[200px]">
                <DropdownMenuItem onClick={() => setPending({ ...pending, outdoors: undefined })}>
                  Any
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPending({ ...pending, outdoors: "Yes" })}>
                  Yes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPending({ ...pending, outdoors: "No" })}>
                  No
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* City */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">City</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>{pending.city || "Any city"}</span>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[200px]">
                <DropdownMenuItem onClick={() => setPending({ ...pending, city: undefined })}>
                  Any city
                </DropdownMenuItem>
                {cities?.map((city) => (
                  <DropdownMenuItem key={city} onClick={() => setPending({ ...pending, city })}>
                    {city}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Date */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Date</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {pending.date
                      ? pending.date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      : "Any date"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={pending.date}
                  onSelect={(date) => setPending({ ...pending, date })}
                  initialFocus
                />
                {pending.date && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setPending({ ...pending, date: undefined })}
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Bottom action buttons */}
        <div className="border-t p-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClearAll}
          >
            Clear All
          </Button>
          <Button
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            onClick={handleViewActivities}
          >
            View Activities{activeCount > 0 ? ` (${activeCount})` : ""}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
