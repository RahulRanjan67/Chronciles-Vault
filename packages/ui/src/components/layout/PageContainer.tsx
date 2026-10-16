import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const pageContainerVariants = cva(
  'mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8 transition-all',
  {
    variants: {
      maxWidth: {
        narrow: 'max-w-4xl',
        default: 'max-w-6xl',
        wide: 'max-w-7xl',
        full: 'max-w-none',
      },
      padding: {
        none: 'px-0 py-0 pb-0 md:pb-0',
        compact: 'px-3 sm:px-4 py-4 pb-16 md:pb-6',
        default: 'px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8',
        spacious: 'px-6 sm:px-10 lg:px-12 py-10 pb-24 md:pb-12',
      },
    },
    defaultVariants: {
      maxWidth: 'default',
      padding: 'default',
    },
  },
);

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageContainerVariants> {}

export function PageContainer({
  maxWidth,
  padding,
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(pageContainerVariants({ maxWidth, padding, className }))}
      {...props}
    >
      {children}
    </div>
  );
}
