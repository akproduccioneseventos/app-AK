
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now obsolete as its content is on the main page.
// This component now just redirects to the main page.
export default function DeprecatedContabilidadPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return null; // Render nothing while redirecting
}
