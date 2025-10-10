
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

function PageRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    useEffect(() => {
        // Redirect to the new, consolidated page
        const destination = `/fiestas/nueva/invitados/invitacion${fiestaId ? `?fiestaId=${fiestaId}` : ''}`;
        router.replace(destination);
    }, [router, fiestaId]);

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Redirigiendo al nuevo diseñador de invitaciones...</p>
             <Link href="/fiestas/nueva/invitados/invitacion" passHref className="mt-4">
              <Button variant="link">Si no eres redirigido, haz clic aquí.</Button>
            </Link>
        </div>
    );
}

export default function DeprecatedPaginaWebPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <PageRedirect />
        </Suspense>
    )
}
