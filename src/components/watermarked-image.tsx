
'use client';

import React from 'react';
import NextImage, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface WatermarkedImageProps extends Omit<ImageProps, 'src'> {
  src: string | null;
  alt: string;
}

export function WatermarkedImage({
  alt,
  src,
  ...props
}: WatermarkedImageProps) {
  
  if (!src) {
    return (
      <div className={cn("relative w-full h-full bg-muted/50 print:hidden")}>
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Imagen no disponible
        </div>
      </div>
    );
  }

  // Use a simple <img> tag for printing to better control background behavior
  return (
    <>
      <div className={cn("relative w-full h-full print:hidden")}>
        <NextImage src={src} alt={alt} fill style={{objectFit: 'contain'}} {...props} />
      </div>
       <div className="hidden print:block fixed inset-0 flex items-center justify-center -z-10">
        <img
          src={src}
          alt="Marca de agua"
          className="w-3/4 h-3/4 object-contain opacity-10 pointer-events-none"
        />
      </div>
    </>
  );
}
