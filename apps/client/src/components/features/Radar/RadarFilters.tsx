import * as React from "react";
import { ArrowUpDown, Filter, RotateCcw, SlidersHorizontal, Layers } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@grimoire/ui";
import type {
  CaptureState,
  BrowserSource,
  RadarSortBy,
  RadarSortOrder,
} from "@grimoire/state";

function isCaptureStateFilter(value: string): value is CaptureState | "all" {
  return ["all", "pending", "matched", "created", "merged", "discarded", "temporary"].includes(
    value,
  );
}

function isBrowserSourceFilter(value: string): value is BrowserSource | "all" {
  return ["all", "chromium", "firefox", "edge", "safari", "unknown"].includes(value);
}

function isRadarSortBy(value: string): value is RadarSortBy {
  return ["capturedAt", "matchConfidence", "title"].includes(value);
}

export interface RadarFilterState {
  state: CaptureState | "all";
  browserSource: BrowserSource | "all";
  sortBy: RadarSortBy;
  sortOrder: RadarSortOrder;
  groupByWork: boolean;
}

export interface RadarFiltersProps {
  filters: RadarFilterState;
  onFilterChange: (filters: RadarFilterState) => void;
  onReset?: () => void;
  className?: string;
}

export function RadarFilters({ filters, onFilterChange, onReset, className }: RadarFiltersProps) {
  const update = (partial: Partial<RadarFilterState>) => {
    onFilterChange({ ...filters, ...partial });
  };

  const hasActiveFilters =
    filters.state !== "all" ||
    filters.browserSource !== "all" ||
    filters.sortBy !== "capturedAt" ||
    filters.sortOrder !== "desc" ||
    filters.groupByWork !== true;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Header with filter icon */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[var(--gm-text-muted)]" />
          <span className="text-gm-sm font-medium text-[var(--gm-text)]">Filters</span>
        </div>

        {/* Reset button */}
        <div className="flex items-center justify-end gap-2">
          {hasActiveFilters && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-gm-xs text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 text-gm-xs">
        {/* State Filter */}
        <div className="w-36">
          <Select
            value={filters.state}
            onValueChange={(state) => {
              if (isCaptureStateFilter(state)) update({ state });
            }}
          >
            <SelectTrigger className="h-8 text-gm-xs">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
              <SelectItem value="discarded">Discarded</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Browser Source Filter */}
        <div className="w-36">
          <Select
            value={filters.browserSource}
            onValueChange={(browserSource) => {
              if (isBrowserSourceFilter(browserSource)) update({ browserSource });
            }}
          >
            <SelectTrigger className="h-8 text-gm-xs">
              <SelectValue placeholder="Browser" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Browsers</SelectItem>
              <SelectItem value="chromium">Chromium</SelectItem>
              <SelectItem value="firefox">Firefox</SelectItem>
              <SelectItem value="edge">Edge</SelectItem>
              <SelectItem value="safari">Safari</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By Filter */}
        <div className="w-40">
          <Select
            value={filters.sortBy}
            onValueChange={(sortBy) => {
              if (isRadarSortBy(sortBy)) update({ sortBy });
            }}
          >
            <SelectTrigger className="h-8 text-gm-xs">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="capturedAt">Capture Time</SelectItem>
              <SelectItem value="matchConfidence">Match Confidence</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => update({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })}
          className="h-8 px-2 text-gm-xs"
        >
          {filters.sortOrder === "asc" ? "↑" : "↓"}
        </Button>

        {/* Group by Work Toggle */}
        <Button
          variant={filters.groupByWork ? "secondary" : "outline"}
          size="sm"
          onClick={() => update({ groupByWork: !filters.groupByWork })}
          className="h-8 px-2 text-gm-xs gap-1.5"
        >
          <Layers className="h-3 w-3" />
          <span>Group by Work</span>
        </Button>
      </div>
    </div>
  );
}
