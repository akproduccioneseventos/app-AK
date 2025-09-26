
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// This page is obsolete. Creating a new menu is now handled at /empresa/menus/nuevo
// We redirect to the new central menu management page.
export default function ObsoleteNuevoMenuPage() {
    const router = useRouter();
    React.useEffect(() => {
        router.replace('/empresa/menus/nuevo');
    }, [router]);
    
    return null; // Render nothing while redirecting
}
