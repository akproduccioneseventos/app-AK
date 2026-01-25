

'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

// This is a redirect component to maintain old URLs working after refactoring.
export default function DeprecatedActivosFijosEditarPage({ params: paramsProp }: { params: { id: string } }) {
    const params = use(paramsProp);
    const router = useRouter();

    useEffect(() => {
        router.replace(`/empresa/activos-fijos/${params.id}/editar`);
    }, [router, params.id]);

    return null; // or a loading spinner
}

    