'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PortalClienteDecoracionRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      router.replace(`/portal/${params.id}/decoracion`);
    }
  }, [params.id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
      <p className="text-sm tracking-wide uppercase opacity-70">Abriendo propuesta de decoración...</p>
    </div>
  );
}
