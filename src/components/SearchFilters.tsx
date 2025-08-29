import { useState } from "react";
import { Search, Filter, Clock, Star, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  filters: {
    minRating: number;
    maxDeliveryTime: number;
    priceRange: [number, number];
    sortBy: string;
  };
  onFiltersChange: (filters: any) => void;
}

const cuisineTypes = [
  "All", "Italian", "Chinese", "Mexican", "Indian", "American", 
  "Japanese", "Thai", "Mediterranean", "French", "Korean"
];

export function SearchFilters({ 
  searchQuery, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange,
  filters,
  onFiltersChange 
}: SearchFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      minRating: 0,
      maxDeliveryTime: 60,
      priceRange: [0, 50],
      sortBy: "featured"
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "minRating") return (value as number) > 0;
    if (key === "maxDeliveryTime") return (value as number) < 60;
    if (key === "priceRange") return (value as [number, number])[0] > 0 || (value as [number, number])[1] < 50;
    if (key === "sortBy") return value !== "featured";
    return false;
  }).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search restaurants, cuisines, or dishes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Cuisine" />
          </SelectTrigger>
          <SelectContent>
            {cuisineTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Restaurants</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="delivery_time">Fastest Delivery</SelectItem>
                    <SelectItem value="delivery_fee">Lowest Delivery Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Minimum Rating: {filters.minRating}+
                </label>
                <Slider
                  value={[filters.minRating]}
                  onValueChange={(value) => updateFilter("minRating", value[0])}
                  max={5}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Delivery Time Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Max Delivery Time: {filters.maxDeliveryTime} min
                </label>
                <Slider
                  value={[filters.maxDeliveryTime]}
                  onValueChange={(value) => updateFilter("maxDeliveryTime", value[0])}
                  max={60}
                  min={15}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Delivery Fee: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                </label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter("priceRange", value)}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Clear Filters */}
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full"
                disabled={activeFiltersCount === 0}
              >
                Clear All Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filter Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.minRating > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {filters.minRating}+ rating
            </Badge>
          )}
          {filters.maxDeliveryTime < 60 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Under {filters.maxDeliveryTime} min
            </Badge>
          )}
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 50) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}