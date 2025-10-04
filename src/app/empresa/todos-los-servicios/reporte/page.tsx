
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// This page is obsolete and its logic is now part of `/empresa/insumos/reporte`.
// We redirect to keep any old bookmarks working.
export default function DeprecatedReporteActivosPage() {
    const router = useRouter();

    React.useEffect(() => {
        router.replace('/empresa/insumos/reporte');
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Redirigiendo...</p>
        </div>
    );
}
