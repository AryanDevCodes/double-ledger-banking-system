import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Filter, X, CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "date" | "dateRange";
  options?: FilterOption[];
}

interface DataTableToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterConfig[];
  activeFilters?: Record<string, string | Date | undefined>;
  onFilterChange?: (key: string, value: string | Date | undefined) => void;
  onClearFilters?: () => void;
  onExport?: () => void;
  className?: string;
}

const ALL_FILTER_VALUE = "__all__";

export default function DataTableToolbar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  onExport,
  className,
}: DataTableToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 rounded-xl border-border/70 bg-card/70 pl-9 shadow-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Filter Toggle */}
          {filters.length > 0 && (
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 rounded-xl"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Export */}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2.5 rounded-xl border border-border/60 bg-card/75 p-3 shadow-sm backdrop-blur-xl">
          {filters.map((filter) => (
            <div key={filter.key} className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">{filter.label}</label>
              {filter.type === "select" && filter.options && (
                <Select
                  value={(activeFilters[filter.key] as string) || ALL_FILTER_VALUE}
                  onValueChange={(value) => onFilterChange?.(filter.key, value === ALL_FILTER_VALUE ? undefined : value)}
                >
                  <SelectTrigger className="h-9 w-[160px] rounded-xl bg-card/75">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER_VALUE}>All</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {filter.type === "date" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 w-[160px] justify-start rounded-xl text-left font-normal",
                        !activeFilters[filter.key] && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {activeFilters[filter.key]
                        ? format(activeFilters[filter.key] as Date, "PPP")
                        : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border-border/70 bg-popover/95 p-0 backdrop-blur-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={activeFilters[filter.key] as Date | undefined}
                      onSelect={(date) => onFilterChange?.(filter.key, date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          ))}

          {activeFilterCount > 0 && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
