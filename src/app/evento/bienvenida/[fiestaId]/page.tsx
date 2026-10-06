'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ArrowDown, Camera, CameraOff, RefreshCw, Sparkles, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { obtenerVideoBienvenidaTotem } from '@/app/actions/videos-invitados';
import { usePantallaPrendida } from '@/hooks/use-pantalla-prendida';
import { AvisoDeDatos } from '@/components/legal/AvisoDeDatos';
import type { Html5QrcodeScanner, QrcodeSuccessCallback } from 'html5-qrcode';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

function ConfettiEffect() {
  const pieces = Array.from({ length: 60 });
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#f43f5e', '#a855f7'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" data-testid="confetti-container">
      {pieces.map((_, idx) => (
        <motion.div
          key={idx}
          className="absolute rounded-sm"
          style={{
            backgroundColor: colors[idx % colors.length],
            width: Math.random() * 8 + 6,
            height: Math.random() * 8 + 6,
          }}
          initial={{
            opacity: 1,
            x: `${Math.random() * 100}vw`,
            y: -20,
            scale: 1,
            rotate: 0,
          }}
          animate={{
            y: '105vh',
            rotate: Math.random() * 360 * 3,
            x: `${Math.random() * 100}vw`,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            ease: 'linear',
            delay: Math.random() * 0.3,
          }}
        />
      ))}
    </div>
  );
}

export default function TotemBienvenidaPage() {
  usePantallaPrendida();

  const params = useParams();
  const fiestaId = (params?.fiestaId as string) || '';

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [modo, setModo] = useState<'espera' | 'saludo' | 'video' | 'error'>('espera');
  const [nombreInvitado, setNombreInvitado] = useState<string>('');
  const [numeroMesa, setNumeroMesa] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string>('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [qrInput, setQrInput] = useState<string>('');

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!fiestaId) return;
    getFiestaById(fiestaId)
      .then((data) => {
        if (data) setFiesta(data);
      })
      // Sin la fiesta el tótem igual anda: sólo pierde el fondo y el nombre del agasajado.
      .catch((e) => console.warn('Tótem: no se pudo leer la fiesta para el fondo', e));
  }, [fiestaId]);

  const volverAEspera = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setModo('espera');
    setNombreInvitado('');
    setNumeroMesa(null);
    setVideoUrl(null);
    setMensajeError('');
    setQrInput('');
    isProcessingRef.current = false;
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch (_) {}
    }
  }, []);

  const procesarCodigo = useCallback(async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    if (scannerRef.current) {
      try {
        scannerRef.current.pause(true);
      } catch (_) {}
    }

    try {
      let scannedFiestaId: string | null = null;
      let guestId: string | null = null;
      let token: string | null = null;

      if (decodedText.startsWith('http') || decodedText.includes('?')) {
        try {
          const url = new URL(decodedText.startsWith('http') ? decodedText : `https://dummy.com/${decodedText}`);
          scannedFiestaId = url.searchParams.get('fiestaId');
          guestId = url.searchParams.get('guestId');
          token = url.searchParams.get('token') || url.searchParams.get('guestAccessToken');
        } catch (_) {}
      }

      if (!guestId || !token) {
        const matchFiesta = decodedText.match(/fiestaId=([^&]+)/);
        const matchGuest = decodedText.match(/guestId=([^&]+)/);
        const matchToken = decodedText.match(/(?:token|guestAccessToken)=([^&]+)/);
        if (matchFiesta) scannedFiestaId = decodeURIComponent(matchFiesta[1]);
        if (matchGuest) guestId = decodeURIComponent(matchGuest[1]);
        if (matchToken) token = decodeURIComponent(matchToken[1]);
      }

      if (scannedFiestaId && scannedFiestaId !== fiestaId) {
        setMensajeError('Este QR es de otra fiesta');
        setModo('error');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(volverAEspera, 4000);
        return;
      }

      if (!guestId || !token) {
        setMensajeError('No reconocimos este QR, probá de nuevo');
        setModo('error');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(volverAEspera, 4000);
        return;
      }

      const res = await obtenerVideoBienvenidaTotem(fiestaId, guestId, token);

      if (!res.success) {
        setMensajeError('No reconocimos este QR, probá de nuevo');
        setModo('error');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(volverAEspera, 4000);
        return;
      }

      setNombreInvitado(res.guestName || 'Invitado');
      setNumeroMesa(res.tableNumber || null);

      if (res.videoUrl) {
        setVideoUrl(res.videoUrl);
        setModo('video');
      } else {
        setModo('saludo');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(volverAEspera, 12000);
      }
    } catch (_) {
      setMensajeError('No reconocimos este QR, probá de nuevo');
      setModo('error');
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(volverAEspera, 4000);
    }
  }, [fiestaId, volverAEspera]);

  const startScanner = useCallback(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        stream.getTracks().forEach((track) => track.stop());
        setHasCameraPermission(true);

        if (!scannerRef.current) {
          const { Html5QrcodeScanner } = await import('html5-qrcode');
          if (scannerRef.current) return;
          const scanner = new Html5QrcodeScanner(
            'totem-camera-reader',
            {
              fps: 10,
              qrbox: { width: 260, height: 260 },
              rememberLastUsedCamera: true,
              aspectRatio: 1,
            },
            false
          );
          scanner.render(
            ((text: string) => {
              procesarCodigo(text);
            }) as QrcodeSuccessCallback,
            () => {}
          );
          scannerRef.current = scanner;
        }
      } catch (_) {
        setHasCameraPermission(false);
      }
    };
    init();
  }, [procesarCodigo]);

  useEffect(() => {
    startScanner();
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e) => console.warn('Tótem: no se pudo apagar la cámara', e));
        scannerRef.current = null;
      }
    };
  }, [startScanner]);

  useEffect(() => {
    if (modo === 'video' && videoRef.current) {
      const video = videoRef.current;
      // Muchas tablets no dejan arrancar un video con sonido sin un toque. Se prueba sin sonido;
      // y si tampoco arranca, el tótem no se queda trabado: vuelve solo a la espera.
      video.play().catch(() => {
        video.muted = true;
        return video.play();
      }).catch((e) => {
        console.warn('Tótem: el video no arrancó', e);
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(volverAEspera, 12000);
      });
    }
  }, [modo, volverAEspera]);

  const handleVideoEnded = () => {
    volverAEspera();
  };

  const nombreAgasajado =
    fiesta?.configuracion?.nombreAgasajado ||
    fiesta?.configuracion?.nombreEvento ||
    'Nuestra Fiesta';
  const portadaFondo = fiesta?.configuracion?.protagonistaFotoUrl;

  return (
    <main className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center p-4 select-none overflow-hidden font-sans">
      {portadaFondo && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none blur-sm"
          style={{ backgroundImage: `url(${portadaFondo})` }}
        />
      )}

      {/* PANTALLA DE ESPERA */}
      {modo === 'espera' && (
        <div className="relative z-10 w-full max-w-xl flex flex-col items-center text-center space-y-6 animate-in fade-in duration-300">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-black tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Tótem de Bienvenida
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-300 tracking-wide">
              {nombreAgasajado}
            </h2>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
              ¡Bienvenidos! Acercá el QR de tu invitación
            </h1>
          </div>

          {/* Flecha animada apuntando a la cámara */}
          <div className="flex flex-col items-center gap-1 text-rose-400">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ArrowDown className="w-8 h-8" />
            </motion.div>
            <span className="text-xs uppercase font-black tracking-widest text-rose-300">
              Ubicá el QR frente a la cámara
            </span>
          </div>

          {/* Visor de cámara html5-qrcode */}
          <div className="w-full max-w-xs aspect-square rounded-3xl overflow-hidden border-2 border-rose-500/40 bg-slate-900/80 shadow-[0_0_40px_rgba(244,63,94,0.25)] relative flex items-center justify-center">
            {hasCameraPermission === false ? (
              <div className="p-4 text-center space-y-3">
                <CameraOff className="w-10 h-10 text-rose-400 mx-auto" />
                <p className="text-xs text-rose-200 font-bold leading-relaxed">
                  Esta pantalla necesita la cámara. Tocá acá para darle permiso
                </p>
                <Button
                  onClick={startScanner}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reintentar cámara
                </Button>
              </div>
            ) : (
              <div id="totem-camera-reader" className="w-full h-full" />
            )}
          </div>

          {/* Campo de respaldo accesible para lector de código de barras / pruebas e2e */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              procesarCodigo(qrInput);
            }}
            className="w-full max-w-xs flex gap-2 pt-2 opacity-90 focus-within:opacity-100"
          >
            <Input
              id="respaldo-qr-input"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Acercá el QR o escribí el código..."
              className="bg-slate-900/80 border-white/20 text-white text-xs h-9 rounded-xl"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs h-9 px-3 rounded-xl"
            >
              Leer
            </Button>
          </form>
          <AvisoDeDatos para="invitado" className="mt-1 text-[10px] text-white/50" />
        </div>
      )}

      {/* MODO SALUDO / MENSAJE (SIN VIDEO) */}
      {modo === 'saludo' && (
        <div className="relative z-10 w-full max-w-xl text-center space-y-8 animate-in zoom-in-95 duration-500">
          <ConfettiEffect />
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-black tracking-widest uppercase">
              <Sparkles className="w-4 h-4" /> Invitado Especial
            </span>
            <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight drop-shadow-lg">
              ¡Hola, {nombreInvitado}!
            </h1>
            {numeroMesa ? (
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 inline-block px-8">
                <span className="text-xs uppercase tracking-widest text-slate-300 font-bold block mb-1">
                  Tu ubicación
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-300" data-testid="table-number">
                  Mesa {numeroMesa}
                </p>
              </div>
            ) : (
              <p className="text-slate-300 text-base sm:text-lg">
                ¡Gracias por acompañarnos esta noche! Que disfrutes al máximo la fiesta.
              </p>
            )}
          </div>

          <div className="pt-4">
            <p className="text-xs text-slate-400 font-medium">Volviendo a la pantalla principal en unos segundos...</p>
          </div>
        </div>
      )}

      {/* MODO VIDEO */}
      {modo === 'video' && videoUrl && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 animate-in fade-in">
          <ConfettiEffect />
          <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur px-5 py-2.5 rounded-full border border-white/20 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-rose-400" />
            <div>
              <p className="text-sm font-black text-white">¡Hola, {nombreInvitado}!</p>
              {numeroMesa && (
                <p className="text-xs font-bold text-amber-300" data-testid="table-number">
                  Mesa {numeroMesa}
                </p>
              )}
            </div>
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

      {/* MODO ERROR */}
      {modo === 'error' && (
        <div className="relative z-10 w-full max-w-md text-center space-y-6 animate-in shake duration-300">
          <div className="p-6 rounded-3xl bg-rose-950/70 border border-rose-800 text-rose-200 space-y-3">
            <CameraOff className="w-12 h-12 text-rose-400 mx-auto" />
            <h2 className="text-xl font-black text-white">{mensajeError}</h2>
            <p className="text-xs text-rose-300">Volviendo en unos segundos...</p>
          </div>
        </div>
      )}
    </main>
  );
}
