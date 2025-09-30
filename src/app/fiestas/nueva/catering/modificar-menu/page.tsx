
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page is obsolete and its functionality is now part of /empresa/menus/catalogo
// We redirect to the new central menu management page.
export default function ObsoleteModificarMenuPage() {
    const router = useRouter();
    React.useEffect(() => {
        router.replace('/empresa/menus');
    }, [router]);
    
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
}
