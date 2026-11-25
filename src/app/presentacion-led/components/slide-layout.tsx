'use client';

import { cn } from '@/lib/utils';

interface SlideLayoutProps {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
  overflowScroll?: boolean;
}

export function SlideLayout({ children, className, centered = true, overflowScroll = false }: SlideLayoutProps) {
  return (
    <div
      data-testid="presentacion-slide-scroll"
      className={cn(
        'h-full w-full overflow-y-auto overscroll-contain px-5 py-4 sm:px-8 md:px-12 lg:px-16 2xl:px-24',
        'selection:bg-red-500/30 selection:text-white',
        centered && 'flex flex-col items-center',
        centered && !overflowScroll && 'justify-center',
        centered && overflowScroll && 'justify-start pt-3 sm:pt-4',
        className,
      )}
    >
      {children}
      <div className="h-6 w-full shrink-0" aria-hidden="true" />
    </div>
  );
}
