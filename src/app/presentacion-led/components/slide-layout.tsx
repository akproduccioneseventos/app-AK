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
        'absolute inset-0 px-6 md:px-12 pt-20 pb-28',
        centered && 'flex flex-col items-center justify-center',
        overflowScroll ? 'overflow-y-auto' : 'overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}
