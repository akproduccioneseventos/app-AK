
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { FiestaEnPlanificacion, EventWebPageSettings, ClientPortalSettings } from '@/types/fiesta';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual, updatePortalSettingsFiestaActual as updatePortalSettings } from '@/app/actions/fiesta-actual';
import { defaultWebPageSettings, defaultClientPortalSettings } from '@/lib/fiesta-defaults';
import { merge, cloneDeep } from 'lodash';

// This is a temporary redirect. Eventually this page will house the settings for the public-facing event page.
function PageRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    useEffect(() => {
        // Redirect to the new, consolidated page
        const destination = `/fiestas/nueva/reuniones${fiestaId ? `?fiestaId=${fiestaId}` : ''}`;
        router.replace(destination);
    }, [router, fiestaId]);

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Redirigiendo a la sección de Colaboración...</p>
             <Link href="/fiestas/nueva/reuniones" passHref className="mt-4">
              <Button variant="link">Si no eres redirigido, haz clic aquí.</Button>
            </Link>
        </div>
    );
}


export default function PaginaWebPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <PageRedirect />
        </Suspense>
    )
}
