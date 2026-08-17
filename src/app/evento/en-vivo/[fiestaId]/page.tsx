'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFiestaLiveStreamStatus } from '@/app/actions/fiesta/streaming.actions';
import {
  Radio,
  Share2,
  Tv,
  Sparkles,
  Heart,
  Clock,
  Volume2,
  Loader2,
  Play,
} from 'lucide-react';

function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  // Format: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID or embed
  try {
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1`;
    }
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1`;
    }
    return url;
  } catch {
    return url;
  }
}

export default function FiestaEnVivoPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;

  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState('La Fiesta');
  const [isLive, setIsLive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tituloMomento, setTituloMomento] = useState('Transmisión Especial');

  const checkStatus = useCallback(async () => {
    try {
      const res = await getFiestaLiveStreamStatus(fiestaId);
      if (res.success) {
        setEventName(res.eventName || 'La Fiesta');
        setIsLive(res.activa);
        setYoutubeUrl(res.youtubeUrl || '');
        setTituloMomento(res.tituloMomento || 'Transmisión Especial');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    void checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleShare = () => {
    const text = `¡Mirá los momentos más emocionantes de ${eventName} en vivo por streaming privado! 🎉 ${window.location.href}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      void navigator.share({
        title: `Transmisión en vivo de ${eventName}`,
        text,
        url: window.location.href,
      });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const embedUrl = getYoutubeEmbedUrl(youtubeUrl);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-sm font-bold text-slate-400">Conectando con la fiesta...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Header con marca AK */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-black text-xs text-white shadow-lg shadow-rose-600/20">
            AK
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black leading-tight text-white">{eventName}</h1>
            <p className="text-[11px] text-slate-400">Transmisión privada para familiares y amigos</p>
          </div>
        </div>

        {isLive ? (
          <Badge className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-3 py-1 animate-pulse flex items-center gap-1.5 shadow-lg shadow-red-600/30">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            EN VIVO
          </Badge>
        ) : (
          <Badge variant="outline" className="border-slate-700 bg-slate-900 text-slate-400 text-xs px-3 py-1">
            En Pausa
          </Badge>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full my-auto py-6">
        {isLive && embedUrl ? (
          <div className="space-y-4">
            <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
              <iframe
                src={embedUrl}
                title={`Transmisión en vivo de ${eventName}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Transmitiendo ahora
                </span>
                <h2 className="text-xl font-black text-white">{tituloMomento}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Disfrutá este momento especial en directo.</p>
              </div>

              <Button
                onClick={handleShare}
                variant="outline"
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold h-11 px-5 rounded-xl shrink-0"
              >
                <Share2 className="w-4 h-4 mr-2 text-amber-400" />
                Compartir por WhatsApp
              </Button>
            </div>
          </div>
        ) : (
          <Card className="bg-slate-900/60 border-slate-800 rounded-3xl text-center p-8 sm:p-12 backdrop-blur-md shadow-2xl">
            <CardContent className="max-w-md mx-auto space-y-5 p-0">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 text-amber-400 border border-slate-700/80 flex items-center justify-center mx-auto shadow-inner">
                <Radio className="w-8 h-8 opacity-80" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/20 mb-2">
                  Transmisión Momentos Clave
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Todavía no empezó el momento</h2>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed font-medium">
                  Para no cansar a la familia transmitimos los momentos más lindos: la entrada, el vals y el brindis.
                  Dejá esta pantalla abierta; el video arrancará solo ni bien empiece.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleShare}
                  className="h-12 px-6 rounded-2xl font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:opacity-95 shadow-lg active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Mandar enlace a la familia
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
        <p>AK Producciones • Salto, Uruguay • Solución integral y tecnología para eventos</p>
      </footer>
    </div>
  );
}
