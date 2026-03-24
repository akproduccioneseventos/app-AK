
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RedirectToNumerosMesa() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    useEffect(() => {
        if (fiestaId) {
            router.replace(`/fiestas/nueva/invitados/numeros-mesa?fiestaId=${fiestaId}`);
        } else {
            router.replace('/eventos');
        }
    }, [router, fiestaId]);

    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
}
