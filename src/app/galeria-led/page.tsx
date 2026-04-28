'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, Loader2, X } from 'lucide-react';
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
  const [slideRegreso, setSlideRegreso] = useState<string | null>(null);

  useEffect(() => {
    // Detect if coming from LED presentation
    try {
      const desde = sessionStorage.getItem('desde_presentacion_led');
      const slide = sessionStorage.getItem('presentacion_slide_regreso');
      if (desde === 'true') {
        setDesdePresLed(true);
        setSlideRegreso(slide);
      }
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
    // Clear LED flags
    try {
      sessionStorage.removeItem('desde_presentacion_led');
    } catch {
      // ignore
    }
    window.location.href = '/presentacion-led';
  };

  const titulo = subCategoria
    ? `${categoria} — ${subCategoria}`
    : categoria || 'Galería';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center gap-4">
        {desdePresLed && (
          <button
            onClick={handleVolver}
            className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 font-bold rounded-xl px-4 py-2 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            ← Volver a la presentación
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-black text-xl truncate">{titulo}</h1>
          <p className="text-white/40 text-sm">{fotosFiltradas.length} foto{fotosFiltradas.length !== 1 ? 's' : ''}</p>
        </div>
        <Camera className="h-6 w-6 text-white/30" />
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
          </div>
        ) : fotosFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Camera className="h-16 w-16 text-white/20 mb-4" />
            <p className="text-white/50 text-xl font-semibold">No hay fotos en esta categoría aún.</p>
            <p className="text-white/30 text-sm mt-2">Las fotos aparecerán aquí cuando se agreguen en la galería.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
            {fotosFiltradas.map(foto => (
              <button
                key={foto.id}
                type="button"
                onClick={() => setLightboxUrl(foto.url)}
                className="block w-full break-inside-avoid rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={foto.titulo || titulo}
                  className="w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Foto ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          {desdePresLed && (
            <button
              onClick={handleVolver}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-indigo-500/80 hover:bg-indigo-500 border border-indigo-400 text-white font-bold rounded-xl px-6 py-3 transition-colors shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver a la presentación
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
      </div>
    }>
      <GaleriaLedContent />
    </Suspense>
  );
}
