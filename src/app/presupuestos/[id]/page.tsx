
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedPresupuestoIdPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    useEffect(() => {
        router.replace(`/presupuestos/${params.id}/ver`);
    }, [router, params.id]);
    
    // You can return a loading spinner or null while redirecting
    return null; 
}

    