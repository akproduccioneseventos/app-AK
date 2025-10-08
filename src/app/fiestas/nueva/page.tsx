
'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function PlanificarFiestaRedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    useEffect(() => {
        if (fiestaId) {
            // Redirect to the configuration page of the specific event planner
            router.replace(`/fiestas/nueva/configuracion?fiestaId=${fiestaId}`);
        } else {
            // Fallback to the main events manager if no ID is provided
            router.replace('/eventos');
        }
    }, [router, fiestaId]);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando planificador de evento...</p>
        </div>
    );
}


export default function PlanificarFiestaRedirectPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        }>
            <PlanificarFiestaRedirectContent />
        </Suspense>
    );
}
