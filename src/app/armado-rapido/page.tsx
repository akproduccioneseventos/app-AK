
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page now redirects to the more powerful conversational assistant.
export default function ArmadoRapidoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/asistente-ak');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-lg text-muted-foreground">Redirigiendo al Asistente Inteligente...</p>
        </div>
    </div>
  );
}
