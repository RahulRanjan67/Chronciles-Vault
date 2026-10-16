import * as React from 'react';
import {
  EmptyState,
  ProgressAnchor,
  SkeletonCard,
  SourceHealthType,
  WorkCard,
  WorkRow,
  cn,
  usePerformanceProfile,
} from '@chronicles-vault/ui';
import { LibraryViewMode } from './LibraryViewToggle';

export interface WorkItemData {
  id: string;
  title: string;
  coverSrc?: string | null;
  contentType?: string;
  personalState?: string;
  progressAnchor?: ProgressAnchor | null;
  progressPercentage?: number;
  newMaterialCount?: number;
  sourceHealth?: SourceHealthType;
  updatedAt?: string | Date;
  genres?: readonly string[];
}

export interface VirtualWorkGridProps {
  items: WorkItemData[];
  viewMode: LibraryViewMode;
  loading?: boolean;
  onWorkClick?: (id: string) => void;
  onContinue?: (id: string) => void;
  emptyStateSlot?: React.ReactNode;
  className?: string;
}

import {
  VIRTUALIZATION_THRESHOLD,
  computeVirtualWindow,
} from './virtual-work-grid-utils';


function getResponsiveColumns(viewMode: LibraryViewMode, width: number): number {
  if (viewMode === 'list' || viewMode === 'table') return 1;
  if (viewMode === 'compact') {
    if (width >= 1024) return 8;
    if (width >= 768) return 6;
    if (width >= 640) return 4;
    return 3;
  }
  // standard grid
  if (width >= 1280) return 6;
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  if (width >= 640) return 3;
  return 2;
}

function getRowHeightEstimate(viewMode: LibraryViewMode): number {
  if (viewMode === 'list' || viewMode === 'table') return 64;
  if (viewMode === 'compact') return 220;
  return 340;
}

export function VirtualWorkGrid({
  items,
  viewMode,
  loading = false,
  onWorkClick,
  onContinue,
  emptyStateSlot,
  className,
}: VirtualWorkGridProps) {
  const { virtualBufferItems } = usePerformanceProfile();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = React.useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    scrollTop: 0,
  }));

  React.useEffect(() => {
    if (typeof window === 'undefined' || items.length <= VIRTUALIZATION_THRESHOLD) return;

    const updateMetrics = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const relativeScrollTop = rect ? Math.max(0, -rect.top) : window.scrollY;
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        scrollTop: relativeScrollTop,
      });
    };

    updateMetrics();
    window.addEventListener('scroll', updateMetrics, { passive: true });
    window.addEventListener('resize', updateMetrics, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateMetrics);
      window.removeEventListener('resize', updateMetrics);
    };
  }, [items.length, viewMode]);

  if (loading) {
    return (
      <div
        className={cn(
          'grid gap-4',
          viewMode === 'compact'
            ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'
            : viewMode === 'list' || viewMode === 'table'
            ? 'grid-cols-1'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
          className,
        )}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      emptyStateSlot ?? (
        <EmptyState
          variant="library"
          title="No works match your current filters"
          description="Try broadening your search query or resetting filters."
        />
      )
    );
  }

  const columns = getResponsiveColumns(viewMode, viewport.width);
  const rowHeight = getRowHeightEstimate(viewMode);
  const windowSlice = computeVirtualWindow({
    totalItems: items.length,
    columns,
    rowHeight,
    scrollTop: viewport.scrollTop,
    viewportHeight: viewport.height,
    bufferItems: virtualBufferItems,
  });

  const visibleItems = windowSlice.isVirtualized
    ? items.slice(windowSlice.startIndex, windowSlice.endIndex)
    : items;

  // LIST OR TABLE VIEW
  if (viewMode === 'list' || viewMode === 'table') {
    return (
      <div
        ref={containerRef}
        data-virtualized={windowSlice.isVirtualized ? 'true' : 'false'}
        className={cn(
          'flex flex-col divide-y divide-[var(--cv-border)] rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] overflow-hidden',
          className,
        )}
      >
        {viewMode === 'table' && (
          <div className="flex items-center justify-between gap-4 px-3 py-2 text-[11px] font-semibold text-[var(--cv-text-subtle)] uppercase tracking-wider bg-[var(--cv-surface)]/40 border-b border-[var(--cv-border)]">
            <span className="flex-1">Title & Format</span>
            <span className="hidden sm:inline w-36">Progress</span>
            <span className="hidden md:inline w-28">Status</span>
            <span className="hidden lg:inline w-24">Health</span>
            <span className="hidden xl:inline w-24">Updated</span>
            <span className="w-16 text-right">Actions</span>
          </div>
        )}
        {windowSlice.paddingTop > 0 && (
          <div style={{ height: windowSlice.paddingTop }} aria-hidden="true" />
        )}
        {visibleItems.map((item) => (
          <WorkRow
            key={item.id}
            id={item.id}
            title={item.title}
            coverSrc={item.coverSrc}
            contentType={item.contentType}
            personalState={item.personalState}
            progressAnchor={item.progressAnchor}
            sourceHealth={item.sourceHealth}
            updatedAt={item.updatedAt}
            onRowClick={() => onWorkClick?.(item.id)}
            onContinue={onContinue ? () => onContinue(item.id) : undefined}
          />
        ))}
        {windowSlice.paddingBottom > 0 && (
          <div style={{ height: windowSlice.paddingBottom }} aria-hidden="true" />
        )}
      </div>
    );
  }

  // COMPACT GRID
  if (viewMode === 'compact') {
    return (
      <div
        ref={containerRef}
        data-virtualized={windowSlice.isVirtualized ? 'true' : 'false'}
        style={{
          paddingTop: windowSlice.paddingTop > 0 ? windowSlice.paddingTop : undefined,
          paddingBottom: windowSlice.paddingBottom > 0 ? windowSlice.paddingBottom : undefined,
        }}
      >
        <div
          className={cn(
            'grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
            className,
          )}
        >
          {visibleItems.map((item) => (
            <WorkCard
              key={item.id}
              id={item.id}
              title={item.title}
              coverSrc={item.coverSrc}
              variant="compact"
              contentType={item.contentType}
              personalState={item.personalState}
              progressAnchor={item.progressAnchor}
              sourceHealth={item.sourceHealth}
              onCardClick={() => onWorkClick?.(item.id)}
              onContinue={onContinue ? () => onContinue(item.id) : undefined}
            />
          ))}
        </div>
      </div>
    );
  }

  // STANDARD GRID
  return (
    <div
      ref={containerRef}
      data-virtualized={windowSlice.isVirtualized ? 'true' : 'false'}
      style={{
        paddingTop: windowSlice.paddingTop > 0 ? windowSlice.paddingTop : undefined,
        paddingBottom: windowSlice.paddingBottom > 0 ? windowSlice.paddingBottom : undefined,
      }}
    >
      <div
        className={cn(
          'grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
          className,
        )}
      >
        {visibleItems.map((item) => (
          <WorkCard
            key={item.id}
            id={item.id}
            title={item.title}
            coverSrc={item.coverSrc}
            variant="standard"
            contentType={item.contentType}
            personalState={item.personalState}
            progressAnchor={item.progressAnchor}
            progressPercentage={item.progressPercentage}
            newMaterialCount={item.newMaterialCount}
            sourceHealth={item.sourceHealth}
            genres={item.genres}
            onCardClick={() => onWorkClick?.(item.id)}
            onContinue={onContinue ? () => onContinue(item.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
