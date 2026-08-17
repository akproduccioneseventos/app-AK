import { getDigitalPresenceDashboard } from '@/app/actions/presencia-digital';
import { getSocialPosts } from '@/app/actions/social-media';
import { PresenciaDigitalClient } from './presencia-digital-client';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Centro de Presencia Digital | AK Producciones',
  description: 'Tablero centralizado de redes sociales, publicidad Meta vs fiestas reales y revisión diaria.',
};

export default async function PresenciaDigitalPage() {
  const [dashboardRes, posts] = await Promise.all([
    getDigitalPresenceDashboard(),
    getSocialPosts(),
  ]);

  const data = dashboardRes.data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/empresa/redes-sociales"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Planificador
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Centro de Presencia Digital
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Todo el estado de tus redes, publicidad y qué campañas traen fiestas de verdad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/empresa/redes-sociales"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition"
          >
            Planificador Clásico
          </Link>
          <Link
            href="/ajustes/redes-sociales"
            className="px-4 py-2 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-sm font-semibold rounded-xl border border-amber-500/30 transition"
          >
            Conexiones
          </Link>
        </div>
      </div>

      {dashboardRes.error ? (
        <div className="p-6 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-200 text-center">
          <p className="font-semibold">Ocurrió un inconveniente al cargar las métricas:</p>
          <p className="text-sm text-red-300 mt-1">{dashboardRes.error}</p>
        </div>
      ) : data ? (
        <PresenciaDigitalClient initialData={data} initialPosts={posts} />
      ) : (
        <div className="text-center py-12 text-slate-500">Cargando métricas...</div>
      )}
    </div>
  );
}
