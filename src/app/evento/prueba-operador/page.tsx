'use client';

import React, { useState, useRef } from 'react';
import { Camera, Printer, Tv, CheckCircle2, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function PruebaOperadorPage() {
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [printerStatus, setPrinterStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [wallStatus, setWallStatus] = useState<'idle' | 'ok'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startCameraTest = async () => {
    setCameraStatus('testing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus('ok');
    } catch {
      setCameraStatus('error');
    }
  };

  const stopCameraTest = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const printTestPage = () => {
    setPrinterStatus('ok');
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin-slow" />
              Prueba Pre-Evento del Operador
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Verificá el estado de la cámara, el muro en vivo y la impresora antes de iniciar el evento.
            </p>
          </div>
          <Link href="/evento">
            <Button variant="outline" size="sm" className="gap-2 border-zinc-800 text-zinc-300">
              <ArrowLeft className="w-4 h-4" /> Volver al Hub
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Test 1: Cámara Web */}
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-rose-400" /> Cámara Web
                </span>
                {cameraStatus === 'ok' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {cameraStatus === 'error' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Probá el encuadre e iluminación de la estación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-40 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {cameraStatus === 'idle' && <span className="text-xs text-zinc-500">Cámara apagada</span>}
              </div>
              {cameraStatus === 'testing' || cameraStatus === 'ok' ? (
                <Button variant="secondary" size="sm" onClick={stopCameraTest} className="w-full text-xs">
                  Detener cámara
                </Button>
              ) : (
                <Button size="sm" onClick={startCameraTest} className="w-full bg-rose-600 hover:bg-rose-700 text-xs font-bold">
                  Probar Cámara
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Test 2: Muro Social */}
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-indigo-400" /> Muro Social en Vivo
                </span>
                {wallStatus === 'ok' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Verificá la conexión y proyección en pantallas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-40 bg-zinc-950 rounded-lg p-3 border border-zinc-800 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-indigo-300">Vista Muro OK</span>
                <span className="text-[10px] text-zinc-500 mt-1">Simulación de diapositiva en pantalla LED</span>
              </div>
              <Button
                size="sm"
                onClick={() => setWallStatus('ok')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
              >
                Confirmar Pantalla
              </Button>
            </CardContent>
          </Card>

          {/* Test 3: Impresora */}
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-400" /> Impresora de Recuerdos
                </span>
                {printerStatus === 'ok' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Imprimí una hoja de prueba física real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-40 bg-zinc-950 rounded-lg p-3 border border-zinc-800 flex flex-col items-center justify-center text-center">
                <Printer className="w-8 h-8 text-amber-400/50 mb-2" />
                <span className="text-xs text-zinc-400">Hoja de prueba A4</span>
              </div>
              <Button size="sm" onClick={printTestPage} className="w-full bg-amber-600 hover:bg-amber-700 text-xs font-bold">
                Imprimir Hoja de Prueba
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
