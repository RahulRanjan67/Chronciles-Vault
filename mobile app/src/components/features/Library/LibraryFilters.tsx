import * as React from 'react';
import { ArrowUpDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
import {
  Badge,
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@chronicles-vault/ui';
import { LibraryViewMode, LibraryViewToggle } from './LibraryViewToggle';

export interface LibraryFilterState {
  search: string;
  contentType: string;
  status: string;
  sortBy: string;
  viewMode: LibraryViewMode;
}

export interface LibraryFiltersProps {
  filters: LibraryFilterState;
  onFilterChange: (filters: LibraryFilterState) => void;
  onReset?: () => void;
  className?: string;
}

export function LibraryFilters({
  filters,
  onFilterChange,
  onReset,
  className,
}: LibraryFiltersProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  const update = (partial: Partial<LibraryFilterState>) => {
    onFilterChange({ ...filters, ...partial });
  };

  const activeFilterCount =
    (filters.contentType !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.sortBy !== 'lastRead' ? 1 : 0);

  const hasActiveFilters = Boolean(filters.search) || activeFilterCount > 0;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Search by title, author, or tag…"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            onClear={() => update({ search: '' })}
            shortcut="/"
          />
        </div>

        {/* View mode toggle + Mobile Filters Sheet Trigger */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileSheetOpen(true)}
            className="sm:hidden gap-1.5 text-cv-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />
            <span>Filters & Sort</span>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {hasActiveFilters && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-cv-xs text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}

          <LibraryViewToggle
            view={filters.viewMode}
            onViewChange={(viewMode) => update({ viewMode })}
          />
        </div>
      </div>

      {/* Desktop Second row: Type, Status, Sort selects */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 text-cv-xs">
        {/* Content Type Filter */}
        <div className="w-36">
          <Select
            value={filters.contentType}
            onValueChange={(contentType) => update({ contentType })}
          >
            <SelectTrigger className="h-8 text-cv-xs">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="manga">Manga</SelectItem>
              <SelectItem value="manhwa">Manhwa</SelectItem>
              <SelectItem value="manhua">Manhua</SelectItem>
              <SelectItem value="webtoon">Webtoon</SelectItem>
              <SelectItem value="light_novel">Light Novel</SelectItem>
              <SelectItem value="web_novel">Web Novel</SelectItem>
              <SelectItem value="anime">Anime</SelectItem>
              <SelectItem value="epub">EPUB / PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-36">
          <Select
            value={filters.status}
            onValueChange={(status) => update({ status })}
          >
            <SelectTrigger className="h-8 text-cv-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="waiting">Waiting for Updates</SelectItem>
              <SelectItem value="stalled">Stalled</SelectItem>
              <SelectItem value="caught_up">Caught Up</SelectItem>
              <SelectItem value="planned">Plan to Read</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By Filter */}
        <div className="w-40 ml-auto">
          <Select
            value={filters.sortBy}
            onValueChange={(sortBy) => update({ sortBy })}
          >
            <SelectTrigger className="h-8 text-cv-xs">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastRead">Last Read</SelectItem>
              <SelectItem value="updatedAt">Recently Updated</SelectItem>
              <SelectItem value="titleAsc">Title (A to Z)</SelectItem>
              <SelectItem value="titleDesc">Title (Z to A)</SelectItem>
              <SelectItem value="progress">Reading Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Bottom-Sheet Filter & Sort Drawer */}
      <Drawer open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <DrawerContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <DrawerHeader className="mb-4">
            <DrawerTitle>Filter & Sort Shelf</DrawerTitle>
            <DrawerDescription>
              Refine your library by medium, reading status, or sort order.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 text-cv-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--cv-text)]">Format</label>
              <Select
                value={filters.contentType}
                onValueChange={(contentType) => update({ contentType })}
              >
                <SelectTrigger className="h-9 text-cv-xs w-full">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="manga">Manga</SelectItem>
                  <SelectItem value="manhwa">Manhwa</SelectItem>
                  <SelectItem value="manhua">Manhua</SelectItem>
                  <SelectItem value="webtoon">Webtoon</SelectItem>
                  <SelectItem value="light_novel">Light Novel</SelectItem>
                  <SelectItem value="web_novel">Web Novel</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="epub">EPUB / PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--cv-text)]">Reading Status</label>
              <Select
                value={filters.status}
                onValueChange={(status) => update({ status })}
              >
                <SelectTrigger className="h-9 text-cv-xs w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="waiting">Waiting for Updates</SelectItem>
                  <SelectItem value="stalled">Stalled</SelectItem>
                  <SelectItem value="caught_up">Caught Up</SelectItem>
                  <SelectItem value="planned">Plan to Read</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--cv-text)]">Sort Order</label>
              <Select
                value={filters.sortBy}
                onValueChange={(sortBy) => update({ sortBy })}
              >
                <SelectTrigger className="h-9 text-cv-xs w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastRead">Last Read</SelectItem>
                  <SelectItem value="updatedAt">Recently Updated</SelectItem>
                  <SelectItem value="titleAsc">Title (A to Z)</SelectItem>
                  <SelectItem value="titleDesc">Title (Z to A)</SelectItem>
                  <SelectItem value="progress">Reading Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DrawerFooter className="mt-6 pt-3 border-t border-[var(--cv-border)]">
            {hasActiveFilters && onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onReset();
                  setMobileSheetOpen(false);
                }}
              >
                Reset All
              </Button>
            )}
            <Button size="sm" onClick={() => setMobileSheetOpen(false)}>
              Apply ({activeFilterCount > 0 ? `${activeFilterCount} active` : 'All'})
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
