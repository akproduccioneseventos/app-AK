
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// This is a redirect component to maintain old URLs working after refactoring.
export default function DeprecatedActivosFijosEditarPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    useEffect(() => {
        router.replace(`/empresa/activos-fijos/${params.id}/editar`);
    }, [router, params.id]);

    return null; // or a loading spinner
}
