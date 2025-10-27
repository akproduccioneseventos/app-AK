
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now exclusively for "Carta de Tragos".
// The "Menu de Mesa" functionality might be implemented differently or not at all.
// For now, redirecting to a safe place like the planner.
export default function DeprecatedMenuMesaPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/fiestas/nueva/carta-tragos');
    }, [router]);

    return (
        <div className="flex justify-center items-center h-screen">
            <p>Redirigiendo...</p>
        </div>
    );
}
