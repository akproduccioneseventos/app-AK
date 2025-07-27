
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page is obsolete and now redirects to the conversational assistant.
export default function ArmadoRapidoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/asistente-ak');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirigiendo al Asistente AK...</p>
    </div>
  );
}
