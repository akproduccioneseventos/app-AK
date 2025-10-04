'use client';

import React, { useState, useEffect } from 'react';
import NextImage, { type ImageProps } from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface WatermarkedImageProps extends ImageProps {
  containerClassName?: string;
}

export function WatermarkedImage({
  containerClassName,
  alt,
  ...props
}: WatermarkedImageProps) {
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    async function fetchLogo() {
      try {
        const settings = await getInvoiceTemplateSettings();
        setLogoUrl(settings.logoUrl);
      } catch (error) {
        console.error("Failed to fetch company logo for watermark", error);
        setLogoUrl(null); // Set to null on error to stop loading state
      }
    }
    fetchLogo();
  }, []);

  return (
    <div className={cn("relative w-full h-full", containerClassName)}>
      <NextImage alt={alt} {...props} />
      {logoUrl && (
        <div className="absolute top-2 left-2 w-10 h-10 md:w-12 md:h-12 pointer-events-none">
          <NextImage
            src={logoUrl}
            alt="Logo Watermark"
            layout="fill"
            objectFit="contain"
            className="opacity-70"
            data-ai-hint="company logo"
          />
        </div>
      )}
    </div>
  );
}
