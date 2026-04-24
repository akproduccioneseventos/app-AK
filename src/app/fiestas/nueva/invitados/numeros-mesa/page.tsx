
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  useEffect(() => {
    if (fiestaId) {
      router.replace(`/fiestas/nueva/numeros-mesa?fiestaId=${fiestaId}`);
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

export default function NumerosMesaRedirect() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <RedirectContent />
    </Suspense>
  );
}
