'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedEditPage() {
    const router = useRouter();
    React.useEffect(() => {
        const pathSegments = window.location.pathname.split('/');
        const id = pathSegments[pathSegments.length - 2];
        if (id) {
            router.replace(`/empresa/todos-los-servicios/${id}/editar`);
        } else {
            router.replace('/empresa/todos-los-servicios');
        }
    }, [router]);
    return <div>Redirigiendo...</div>;
}
