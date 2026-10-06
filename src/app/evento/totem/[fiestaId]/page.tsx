'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { QrCode, Sparkles, Loader2, Volume2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { obtenerVideoBienvenidaTotem } from '@/app/actions/videos-invitados';
import { AvisoDeDatos } from '@/components/legal/AvisoDeDatos';

export default function TotemBienvenidaPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;

  const [modo, setModo] = useState<'espera' | 'cargando' | 'video' | 'mensaje'>('espera');
  const [nombreInvitado, setNombreInvitado] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [qrInput, setQrInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const volverAEspera = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setModo('espera');
    setNombreInvitado('');
    setVideoUrl(null);
    setQrInput('');
    setError(null);
  };

  const procesarCodigo = async (codigoOUrl: string) => {
    if (!codigoOUrl.trim()) return;
    setModo('cargando');
    setError(null);

    try {
      // Extraer guestId y token de la URL del QR o parámetros
      let guestId = '';
      let token = '';

      if (codigoOUrl.includes('?') || codigoOUrl.startsWith('http')) {
        try {
          const url = new URL(codigoOUrl.startsWith('http') ? codigoOUrl : `https://dummy.com/${codigoOUrl}`);
          guestId = url.searchParams.get('guestId') || '';
          token = url.searchParams.get('token') || url.searchParams.get('guestAccessToken') || '';
        } catch {
          // Fallback manual
        }
      }

      if (!guestId || !token) {
        // Parsear formato key=value o json si fue escaneado directo
        const matchGuest = codigoOUrl.match(/guestId=([^&]+)/);
        const matchToken = codigoOUrl.match(/(?:token|guestAccessToken)=([^&]+)/);
        if (matchGuest) guestId = decodeURIComponent(matchGuest[1]);
        if (matchToken) token = decodeURIComponent(matchToken[1]);
      }

      if (!guestId || !token) {
        throw new Error('Código QR no reconocido. Asegurate de escanear el pase oficial.');
      }

      const res = await obtenerVideoBienvenidaTotem(fiestaId, guestId, token);

      if (!res.success) {
        throw new Error(res.error || 'No se pudo verificar el acceso.');
      }

      setNombreInvitado(res.guestName || 'Invitado');

      if (res.videoUrl) {
        setVideoUrl(res.videoUrl);
        setModo('video');
      } else {
        setModo('mensaje');
        // El tótem muestra ¡Bienvenido, {nombre}! y vuelve solo a esperar a los 8 segundos (Orden 117)
        resetTimerRef.current = setTimeout(() => {
          volverAEspera();
        }, 8000);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el código.');
      setModo('espera');
    }
  };

  // Reproducir video cuando se monta
  useEffect(() => {
    if (modo === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [modo]);

  const handleVideoEnded = () => {
    resetTimerRef.current = setTimeout(() => {
      volverAEspera();
    }, 2000);
  };

  return (
    <main className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden font-sans">
      {/* MODO ESPERA */}
      {modo === 'espera' && (
        <div className="text-center max-w-lg space-y-8 animate-in fade-in duration-500">
          <div className="relative mx-auto w-32 h-32 rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-500 p-1 flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.3)]">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <QrCode className="w-16 h-16 text-rose-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-black tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Tótem de Bienvenida
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
              ¡Te estábamos esperando!
            </h1>
            <p className="text-slate-400 text-base sm:text-lg">
              Acercá tu pase de invitación o código QR para ver tu bienvenida personalizada.
            </p>
          </div>

          {/* Input oculto / accesible para lectores de QR de hardware */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              procesarCodigo(qrInput);
            }}
            className="flex gap-2 max-w-md mx-auto pt-4"
          >
            <Input
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Escaneá tu código acá..."
              className="bg-slate-900 border-white/20 text-white text-sm"
              autoFocus
            />
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="pt-2">
            <AvisoDeDatos para="invitado" />
          </div>

          {error && (
            <p className="text-rose-400 text-sm font-semibold bg-rose-950/50 border border-rose-800/60 p-3 rounded-xl max-w-sm mx-auto">
              {error}
            </p>
          )}
        </div>
      )}

      {/* MODO CARGANDO */}
      {modo === 'cargando' && (
        <div className="text-center space-y-4 animate-in fade-in">
          <Loader2 className="w-16 h-16 text-rose-500 animate-spin mx-auto" />
          <h2 className="text-2xl font-bold">Buscando tu bienvenida...</h2>
        </div>
      )}

      {/* MODO MENSAJE (SIN VIDEO) - Dura 8 segundos */}
      {modo === 'mensaje' && (
        <div className="text-center max-w-xl space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <Sparkles className="w-12 h-12" />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Invitado Especial
            </span>
            <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight">
              ¡Bienvenido, {nombreInvitado}!
            </h1>
            <p className="text-slate-300 text-lg">
              Gracias por acompañarnos en esta noche inolvidable. ¡Que disfrutes la fiesta!
            </p>
          </div>

          <div className="pt-8">
            <p className="text-xs text-slate-500 font-medium">Volviendo a la pantalla principal en unos segundos...</p>
          </div>
        </div>
      )}

      {/* MODO VIDEO - Pantalla completa con video */}
      {modo === 'video' && videoUrl && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 animate-in fade-in">
          <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-bold text-white">Un mensaje para {nombreInvitado}</span>
          </div>

          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            playsInline
            onEnded={handleVideoEnded}
            className="w-full h-full object-contain max-h-screen"
          />

          <button
            onClick={volverAEspera}
            className="absolute bottom-6 right-6 z-10 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-lg border border-white/20 transition-colors"
          >
            Finalizar
          </button>
        </div>
      )}
    </main>
  );
}
