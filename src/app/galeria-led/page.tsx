'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, Loader2, MonitorPlay, X } from 'lucide-react';
import { getGaleriaItems } from '@/app/actions/galeria';
import type { GaleriaFoto } from '@/types/galeria';

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function GaleriaLedContent() {
  const searchParams = useSearchParams();
  const categoria = searchParams.get('categoria') || '';
  const subCategoria = searchParams.get('subCategoria') || '';

  const [fotos, setFotos] = useState<GaleriaFoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [desdePresLed, setDesdePresLed] = useState(false);

  useEffect(() => {
    try {
      const desde = sessionStorage.getItem('desde_presentacion_led');
      if (desde === 'true') setDesdePresLed(true);
    } catch {
      // sessionStorage not available
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const data = await getGaleriaItems();
        setFotos(data.fotos);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fotosFiltradas = useMemo(() => {
    return fotos.filter(f => {
      if (!isSafeUrl(f.url)) return false;
      if (categoria && f.categoria.toLowerCase() !== categoria.toLowerCase()) return false;
      if (subCategoria && (!f.subCategoria || f.subCategoria.toLowerCase() !== subCategoria.toLowerCase())) return false;
      return true;
    });
  }, [fotos, categoria, subCategoria]);

  const handleVolver = () => {
    try {
      sessionStorage.removeItem('desde_presentacion_led');
    } catch {
      // ignore
    }
    window.location.assign('/presentacion-led');
  };

  const titulo = subCategoria
    ? `${categoria} - ${subCategoria}`
    : categoria || 'Experiencia visual';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/10 bg-slate-950/92 px-6 py-4 backdrop-blur-sm">
        {desdePresLed && (
          <button
            onClick={handleVolver}
            className="flex items-center gap-2 rounded-xl border border-red-300/35 bg-red-500/18 px-4 py-2 font-black text-red-100 transition-colors hover:bg-red-500/28"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a la presentacion comercial
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-200/80">
            <MonitorPlay className="h-4 w-4" /> Pantalla LED
          </div>
          <h1 className="truncate text-2xl font-black text-white md:text-4xl">{titulo}</h1>
          <p className="text-sm font-medium text-white/45">{fotosFiltradas.length} visual{fotosFiltradas.length !== 1 ? 'es' : ''} disponibles</p>
        </div>
        <Camera className="h-7 w-7 text-white/32" />
      </div>

      <div className="px-6 py-8 md:px-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-red-300" />
          </div>
        ) : fotosFiltradas.length === 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-8 py-24 text-center">
            <Camera className="mb-4 h-16 w-16 text-white/20" />
            <p className="text-xl font-black text-white/62">Todavia no hay visuales cargados para esta parte.</p>
            <p className="mt-2 text-sm text-white/36">Cuando agregues fotos a la galeria, aparecen aca para usarlas en la pantalla de venta.</p>
          </div>
        ) : (
          <div className="columns-2 gap-4 space-y-4 sm:columns-3 lg:columns-4 2xl:columns-5">
            {fotosFiltradas.map(foto => (
              <button
                key={foto.id}
                type="button"
                onClick={() => { if (isSafeUrl(foto.url)) setLightboxUrl(foto.url); }}
                className="block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl transition-transform duration-200 hover:-translate-y-1"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isSafeUrl(foto.url) ? foto.url : ''}
                  alt={foto.titulo || titulo}
                  className="w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/80 hover:text-white"
            onClick={() => setLightboxUrl(null)}
            aria-label="Cerrar visual"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl && isSafeUrl(lightboxUrl) ? lightboxUrl : ''}
            alt="Visual ampliado"
            className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          {desdePresLed && (
            <button
              onClick={handleVolver}
              className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-red-300/40 bg-red-600 px-6 py-3 font-black text-white shadow-lg transition-colors hover:bg-red-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver a la presentacion comercial
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function GaleriaLedPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-red-300" />
      </div>
    }>
      <GaleriaLedContent />
    </Suspense>
  );
}
