
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// This page is obsolete and its functionality is now part of /empresa/menus/catalogo
// We redirect to the new central menu management page.
export default function ObsoleteModificarMenuPage() {
    const router = useRouter();
    React.useEffect(() => {
        router.replace('/empresa/menus/catalogo');
    }, [router]);
    
    return null; // Render nothing while redirecting
}
