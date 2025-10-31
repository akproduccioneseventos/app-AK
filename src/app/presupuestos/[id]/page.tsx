
'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ViewPresupuestoRedirectPage({ params: paramsProp }: { params: { id: string } }) {
  const params = use(paramsProp);
  const router = useRouter();
  const presupuestoId = params.id;

  useEffect(() => {
    if (presupuestoId) {
      router.replace(`/presupuestos/${presupuestoId}/ver`);
    } else {
      router.replace('/presupuestos/nuevo');
    }
  }, [router, presupuestoId]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-16 h-16 animate-spin text-primary" />
      <p className="ml-4 text-xl">Redirigiendo a la vista del presupuesto...</p>
    </div>
  );
}
