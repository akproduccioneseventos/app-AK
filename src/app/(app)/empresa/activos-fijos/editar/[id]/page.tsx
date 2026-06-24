
'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

// This is a redirect component to maintain old URLs working after refactoring.
export default function DeprecatedActivosFijosEditarPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();

    useEffect(() => {
        router.replace(`/empresa/activos-fijos/${params.id}/editar`);
    }, [router, params.id]);

    return null; // or a loading spinner
}
