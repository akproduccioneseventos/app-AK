'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is obsolete. Its functionality has been moved to the event planner itself.
// We redirect to the new central page for this functionality.
export default function DeprecatedBebidasRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/planner-costo-fiesta');
    }, [router]);

    return null; // Or a loading spinner
}
