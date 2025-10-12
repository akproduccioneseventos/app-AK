
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page is now obsolete as its content is on the main page.
// This component now just redirects to the main page.
export default function DeprecatedContabilidadPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4">Redirigiendo al panel principal...</p>
      </div>
    );
}
