'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, ArrowLeft, AlertCircle, Sparkles, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPublicSocialEvent } from '@/app/actions/social-gallery';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import * as THREE from 'three';

/**
 * Realidad Aumentada de Invitación Impresa con MindAR.
 * El invitado apunta a la invitación física y sobre ella se reproduce el video de la fiesta.
 * Requiere el archivo compilado `.mind` de la tarjeta.
 */
export default function EventoRealidadAumentadaPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;

  const [fiesta, setFiesta] = useState<PublicSocialEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [arTargetDetected, setArTargetDetected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mindArInstanceRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    getPublicSocialEvent(fiestaId).then((data) => {
      if (!active) return;
      setFiesta(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fiestaId]);

  // Busca el archivo compilado .mind para la invitación física
  const tieneMindConfigurado = Boolean(fiesta?.tieneRealidadAumentada || fiesta?.mindTargetUrl || (fiesta as any)?.invitacionMindUrl);
  const mindTargetUrl = fiesta?.mindTargetUrl || (fiesta as any)?.invitacionMindUrl || `/models/ar/${fiestaId}.mind`;

  const startAR = useCallback(async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Tu navegador no permite acceso a la cámara. Probá en Chrome o Safari.');
      }

      // Carga dinámica de mind-ar local vendor
      // @ts-ignore
      const mindarModule = await import('@/lib/vendor/mind-ar/mindar-image-three.prod.js').catch(() => null);
      const MindARThree = mindarModule?.MindARThree;

      if (!MindARThree) {
        setCameraError('No pudimos inicializar la realidad aumentada. Probá en otro navegador.');
        return;
      }

      if (containerRef.current) {
        const mindarThree: any = new (MindARThree as any)({
          container: containerRef.current,
          imageTargetSrc: mindTargetUrl,
          filterMinCF: 0.0001,
          filterBeta: 0.001,
        });
        mindArInstanceRef.current = mindarThree;

        // Configuración de anclaje y textura de video montada sobre el plano
        const anchor: any = mindarThree.addAnchor ? mindarThree.addAnchor(0) : null;
        if (anchor) {
          if (videoRef.current) {
            const texture = new THREE.VideoTexture(videoRef.current);
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            const plane = new THREE.Mesh(geometry, material);
            anchor.group?.add?.(plane);
          }

          anchor.onTargetFound = () => {
            setArTargetDetected(true);
            if (videoRef.current) {
              // no pasa nada si falla: el teléfono puede frenar el arranque solo; el video sigue a un toque.
              videoRef.current.play().catch(() => {});
            }
          };
          anchor.onTargetLost = () => {
            setArTargetDetected(false);
            if (videoRef.current) {
              videoRef.current.pause();
            }
          };
        }

        // Inicia el tracking de la cámara
        await mindarThree.start();
      }
    } catch (err: any) {
      setCameraError(err?.message || 'Para ver el video sobre la invitación, permití el acceso a la cámara tocando el candado de la barra del navegador.');
    }
  }, [mindTargetUrl]);

  useEffect(() => {
    if (!loading && fiesta && tieneMindConfigurado) {
      startAR();
    }
    return () => {
      if (mindArInstanceRef.current) {
        try {
          mindArInstanceRef.current.stop();
        } catch {
          // Limpieza silenciosa
        }
      }
    };
  }, [loading, fiesta, tieneMindConfigurado, startAR]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="w-10 h-10 text-amber-400 animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-zinc-300">Cargando Realidad Aumentada...</p>
      </div>
    );
  }

  // Sin .mind, el cartel dice claramente lo que pasa (no queda pantalla o cámara negra)
  if (!tieneMindConfigurado) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-black">Esta invitación todavía no tiene realidad aumentada</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Cuando se termine de diseñar la tarjeta impresa se activa la vista sobre el papel. Podés entrar a todas las fotos, barra y música desde acá:
          </p>
          <Button
            onClick={() => router.push(`/evento/hub/${fiestaId}`)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
          >
            Ir al Menú del Evento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white select-none">
      {/* Video de la fiesta reproducido sobre la tarjeta */}
      <video
        ref={videoRef}
        src={fiesta?.arVideoUrl}
        playsInline
        muted={isAudioMuted}
        loop
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />
      {/* Contenedor WebGL para MindAR */}
      <div ref={containerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Cabecera flotante */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => router.push(`/evento/hub/${fiestaId}`)}
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70 transition"
          aria-label="Volver al menú"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black/60 backdrop-blur-md border border-amber-500/40 text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Realidad Aumentada MindAR
        </span>

        <button
          onClick={() => setIsAudioMuted(!isAudioMuted)}
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70 transition"
          aria-label="Silenciar o activar sonido"
        >
          {isAudioMuted ? <VolumeX className="w-5 h-5 text-zinc-400" /> : <Volume2 className="w-5 h-5 text-amber-300" />}
        </button>
      </div>

      {/* Cartel de error o permisos de cámara */}
      {cameraError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm">
          <div className="max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center space-y-4">
            <Camera className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="font-bold text-base text-white">Acceso a la Cámara</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">{cameraError}</p>
            <Button
              onClick={startAR}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Reintentar Acceso
            </Button>
          </div>
        </div>
      )}

      {/* Guía en pantalla para apuntar a la tarjeta física */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center text-center px-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 max-w-xs shadow-2xl space-y-1"
        >
          <p className="text-xs font-black text-amber-300">
            {arTargetDetected ? '¡Tarjeta Detectada!' : 'Apuntá a la invitación física'}
          </p>
          <p className="text-[11px] text-zinc-300">
            {arTargetDetected
              ? 'Reproduciendo video interactivo sobre el papel'
              : 'Sostené la cámara apuntando a la tarjeta de la fiesta para verla cobrar vida.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
