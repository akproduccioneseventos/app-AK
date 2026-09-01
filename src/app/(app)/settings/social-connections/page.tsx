'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight } from 'lucide-react';

/**
 * Redirección canónica al Panel Unificado de Conexiones (Orden 29, Bloque 4).
 *
 * Todas las integraciones y conexiones sociales (Facebook, Instagram, Pinterest,
 * WhatsApp, YouTube, Spotify, etc.) se gestionan en una única pantalla central:
 * /settings/sincronizaciones.
 */
export default function SocialConnectionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/sincronizaciones');
  }, [router]);

  return (
    <div className="container max-w-2xl mx-auto p-6 text-center space-y-4 py-16">
      <Zap className="h-10 w-10 text-indigo-600 mx-auto animate-pulse" />
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        Panel Unificado de Conexiones
      </h1>
      <p className="text-slate-600 text-sm">
        Todas las conexiones, redes sociales e integraciones externas ahora se gestionan en un solo lugar centralizado.
      </p>
      <div className="pt-2">
        <Link href="/settings/sincronizaciones">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            Ir a Sincronizaciones y Conexiones <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
