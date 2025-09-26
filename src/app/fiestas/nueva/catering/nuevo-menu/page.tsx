// This file has been moved to /app/empresa/menus/nuevo/page.tsx
// The new component will handle the general menu creation.
// This redirect is to ensure old bookmarks don't break.

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeprecatedNewMenuPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/empresa/menus/nuevo');
    }, [router]);

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
             <div className="flex justify-center items-center h-64">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Redirigiendo al nuevo creador de menús...</p>
            </div>
        </div>
    );
}
