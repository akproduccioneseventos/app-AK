
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import type { InvoiceTemplateSettings } from '@/types/settings';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';

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

  if (logoUrl) {
    return (
      <Link href="/" className="flex items-center group text-foreground no-underline hover:opacity-80 transition-opacity">
        <NextImage 
            src={logoUrl} 
            alt="Logo de la Empresa"
            width={120} // Adjust width as needed
            height={40} // Adjust height as needed
            className="object-contain"
            priority // Prioritize loading the logo in the header
            data-ai-hint="company logo"
        />
      </Link>
    );
  }

  // Fallback to text if no logo URL or still loading
  return (
    <Link
      href="/"
      className="flex flex-col items-start group text-foreground no-underline hover:opacity-80 transition-opacity"
    >
      <span className="text-lg font-bold">AK Producciones</span>
      <span className="text-sm text-muted-foreground">Gestión de Eventos</span>
    </Link>
  );
};

export default AppLogo;
