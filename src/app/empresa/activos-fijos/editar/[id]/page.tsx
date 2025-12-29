
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedActivosFijosEditarPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    useEffect(() => {
        router.replace(`/empresa/activos-fijos/${params.id}/editar`);
    }, [router, params.id]);

    return null; // or a loading spinner
}
