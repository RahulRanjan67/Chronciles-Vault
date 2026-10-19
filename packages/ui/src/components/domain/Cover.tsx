import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useTheme } from '../../hooks/useTheme';
import { generateCoverFallback } from '../../utils/cover-fallback';
import { cn } from '../../utils/cn';

const coverVariants = cva(
  'relative overflow-hidden rounded-cv select-none bg-[var(--gm-surface)] shadow-sm shrink-0 aspect-[3/4]',
  {
    variants: {
      size: {
        xs: 'w-8',
        sm: 'w-12',
        md: 'w-20',
        lg: 'w-32',
        hero: 'w-56 sm:w-64',
        fill: 'w-full',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface CoverProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof coverVariants> {
  title: string;
  src?: string | null | undefined;
  author?: string | undefined;
  alt?: string | undefined;
  lazy?: boolean | undefined;
}

export function Cover({
  title,
  src,
  author,
  alt,
  size = 'md',
  lazy = true,
  className,
  ...props
}: CoverProps) {
  const { themeId } = useTheme();
  const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>({
    once: true,
    rootMargin: '200px',
  });

  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const fallback = React.useMemo(
    () => generateCoverFallback(title, author, themeId),
    [title, author, themeId],
  );

  const shouldLoad = !lazy || isVisible;
  const showFallback = !src || hasError;

  return (
    <div
      ref={containerRef as unknown as React.RefObject<HTMLDivElement>}
      className={cn(coverVariants({ size }), className)}
      style={{
        background: showFallback ? fallback.gradient : undefined,
      }}
      aria-label={alt ?? `${title} cover`}
      {...props}
    >
      {showFallback ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center select-none">
          <span
            className="font-bold tracking-tight font-sans drop-shadow-sm"
            style={{
              color: fallback.textColor,
              fontSize:
                size === 'xs'
                  ? '0.65rem'
                  : size === 'sm'
                  ? '0.85rem'
                  : size === 'md'
                  ? '1.25rem'
                  : size === 'lg'
                  ? '1.75rem'
                  : '2.5rem',
            }}
          >
            {fallback.initials}
          </span>
          {size !== 'xs' && size !== 'sm' && (
            <span
              className="mt-1 line-clamp-2 px-1 text-[10px] font-medium leading-tight opacity-75 drop-shadow-xs"
              style={{ color: fallback.textColor }}
            >
              {title}
            </span>
          )}
        </div>
      ) : (
        <>
          {/* Subtle gradient backdrop while loading */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: fallback.gradient,
              opacity: imageLoaded ? 0 : 0.6,
            }}
          />

          {shouldLoad && (
            <img
              src={src}
              alt={alt ?? `${title} cover`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setHasError(true)}
              className={cn(
                'h-full w-full object-cover transition-all duration-300 ease-out',
                imageLoaded
                  ? 'opacity-100 scale-100 blur-0'
                  : 'opacity-0 scale-105 blur-xs',
              )}
            />
          )}
        </>
      )}

      {/* Subtle border highlight for depth */}
      <div className="pointer-events-none absolute inset-0 rounded-cv border border-white/5" />
    </div>
  );
}
