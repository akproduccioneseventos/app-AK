
'use client';

import React from 'react';
import NextImage, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface WatermarkedImageProps extends Omit<ImageProps, 'src' | 'width' | 'height'> {
  src: string | null;
  watermarkSrc?: string | null;
  alt: string;
  containerClassName?: string;
}

export function WatermarkedImage({
  alt,
  src,
  watermarkSrc,
  containerClassName,
  ...props
}: WatermarkedImageProps) {
  
  // For standard print media (which might not render watermarks well on top of images)
  const PrintWatermark = () => {
    if (!watermarkSrc) {
      return null;
    }
    return (
      <div className="hidden print:block fixed inset-0 flex items-center justify-center -z-10">
        <img
          src={watermarkSrc}
          alt="Marca de agua"
          className="w-3/4 h-3/4 object-contain opacity-10 pointer-events-none"
        />
      </div>
    );
  };
  
  if (!src) {
    return (
      <>
        <PrintWatermark />
        <div className={cn("relative w-full h-full bg-muted/50 print:hidden", containerClassName)}>
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Imagen no disponible
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PrintWatermark />
      <div className={cn("relative w-full h-full print:hidden", containerClassName)}>
        <NextImage src={src} alt={alt} layout="fill" style={{objectFit: 'contain'}} {...props} />
        {watermarkSrc && (
          <NextImage
            src={watermarkSrc}
            alt="Marca de agua"
            layout="fill"
            className="object-contain opacity-10 pointer-events-none p-4"
          />
        )}
      </div>
    </>
  );
}
