'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const SIZE_MAP = {
  xs: { container: 'w-6 h-6', text: 'text-[8px]', pixels: 24 },
  sm: { container: 'w-9 h-9', text: 'text-xs', pixels: 36 },
  md: { container: 'w-14 h-14', text: 'text-base', pixels: 56 },
  lg: { container: 'w-20 h-20', text: 'text-xl', pixels: 80 },
  xl: { container: 'w-28 h-28', text: 'text-3xl', pixels: 112 },
};

interface CompanyLogoProps {
  size?: keyof typeof SIZE_MAP;
  className?: string;
  src?: string;
}

export function CompanyLogo({ size = 'md', className, src }: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  const { container, text, pixels } = SIZE_MAP[size];
  const imgSrc = src || '/logo_ak_producciones.png';

  if (hasError) {
    return (
      <div
        className={cn(
          container,
          'rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black shrink-0',
          text,
          className
        )}
      >
        AK
      </div>
    );
  }

  return (
    <div className={cn('relative shrink-0', container, className)}>
      <Image
        src={imgSrc}
        alt="AK Producciones"
        fill
        className="object-contain"
        sizes={`${pixels}px`}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
