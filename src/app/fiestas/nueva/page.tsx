

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PlanificarFiestaRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/eventos');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirigiendo al Gestor de Eventos...</p>
        </div>
    );
}
