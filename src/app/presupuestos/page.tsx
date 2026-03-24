
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PresupuestosRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/presupuestos/nuevo');
    }, [router]);
    
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <p className="ml-4 text-xl">Redirigiendo a la Central de Presupuestos...</p>
        </div>
    );
}
