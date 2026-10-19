import * as React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-cv bg-[var(--gm-surface)]/70',
        className,
      )}
      {...props}
    />
  );
}

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  lastLineWidth?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = '70%',
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <div className={cn('flex flex-col gap-2 w-full', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5 w-full"
          style={i === lines - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
}

export interface SkeletonCoverProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: string;
}

export function SkeletonCover({
  className,
  aspectRatio = '3/4',
  style,
  ...props
}: SkeletonCoverProps) {
  return (
    <Skeleton
      className={cn('w-full rounded-cv shadow-xs', className)}
      style={{ aspectRatio, ...style }}
      {...props}
    />
  );
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-3 shadow-xs',
        className,
      )}
      {...props}
    >
      <SkeletonCover />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-1.5 w-full mt-1" />
      </div>
    </div>
  );
}
