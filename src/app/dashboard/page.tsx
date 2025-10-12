
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page has been deprecated and its content moved to the main page.
// This component now just redirects to the main page.
export default function DeprecatedDashboard() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return null; // Render nothing while redirecting
}
