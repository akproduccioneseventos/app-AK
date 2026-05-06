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
      className={cn(
        'absolute inset-0 min-h-[100svh] px-5 pb-28 pt-24 sm:px-8 md:px-12 lg:px-16 2xl:px-24',
        'selection:bg-red-500/30 selection:text-white',
        centered && 'flex flex-col items-center justify-center',
        overflowScroll ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}
