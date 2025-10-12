
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard');
    }, [router]);

    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4">Cargando panel principal...</p>
      </div>
    );
}
