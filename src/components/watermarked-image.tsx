
'use client';

import React, { useState, useEffect } from 'react';
import NextImage, { type ImageProps } from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface WatermarkedImageProps extends Omit<ImageProps, 'src' | 'width' | 'height' | 'fill'> {
  src: string | null;
  containerClassName?: string;
}

export function WatermarkedImage({
  containerClassName,
  alt,
  src,
  ...props
}: WatermarkedImageProps) {
  
  if (!src) {
    return (
      <div className={cn("relative w-full h-full bg-muted/50", containerClassName)}>
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Imagen no disponible
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", containerClassName)}>
      <NextImage src={src} alt={alt} fill {...props} />
    </div>
  );
}
