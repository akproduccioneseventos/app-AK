
'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Skeleton } from '@/components/ui/skeleton';

const AppLogo = () => {
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const settings = await getInvoiceTemplateSettings();
        setLogoUrl(settings.logoUrl);
      } catch (error) {
        console.error("Failed to fetch company logo", error);
        setLogoUrl(null); // Set to null on error to stop loading state
      }
    };
    fetchLogo();
  }, []);
  
  if (logoUrl === undefined) {
    // Loading state to prevent layout shift
    return <Skeleton className="h-8 w-24 rounded-md" />;
  }

  if (logoUrl) {
    return (
        <NextImage 
            src={logoUrl} 
            alt="Logo de la Empresa"
            width={120}
            height={40}
            className="object-contain h-8 w-auto"
            priority
            data-ai-hint="company logo"
        />
    );
  }

  // Fallback to static logo file
  return (
    <NextImage
      src="/logo_ak_producciones.png"
      alt="AK Producciones"
      width={120}
      height={40}
      className="object-contain h-8 w-auto"
      priority
      data-ai-hint="company logo"
    />
  );
};

export default AppLogo;
