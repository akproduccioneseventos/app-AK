'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle, CheckCircle2, XCircle, AlertCircle, CameraOff, ScanLine, RefreshCw } from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { checkInGuest } from '@/app/actions/fiesta/invitados.actions';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';
import { Html5QrcodeScanner, type QrcodeSuccessCallback } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type ScanResult =
  | { status: 'idle' }
  | { status: 'processing' }
  | { status: 'granted'; guest: Invitado }
  | { status: 'already_entered'; guest: Invitado }
  | { status: 'invalid'; message: string };

const DIETARY_LABELS: Record<string, string> = {
  Ninguna: '',
  Celiaco: '🌾 Menú sin gluten',
  Vegetariano: '🥗 Menú vegetariano',
  Vegano: '🌱 Menú vegano',
  Otro: '⚠️ Menú especial',
};

function AccessControlContent() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult>({ status: 'idle' });

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isProcessingRef = useRef(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFiesta = useCallback(async () => {
    if (!fiestaId) {
      setLoadError('No se especificó un ID de evento.');
      setIsLoading(false);
      return;
    }
    try {
      const data = await getFiestaById(fiestaId);
      if (!data) throw new Error('Evento no encontrado.');
      setFiesta(data);
    } catch (e: any) {
      setLoadError(e.message || 'No se pudo cargar el evento.');
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadFiesta();
  }, [loadFiesta]);

  const scheduleReset = useCallback((delay = 5000) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setScanResult({ status: 'idle' });
      isProcessingRef.current = false;
      if (scannerRef.current) {
        try { scannerRef.current.resume(); } catch (_) {}
      }
    }, delay);
  }, []);

  const onScanSuccess: QrcodeSuccessCallback = useCallback(async (decodedText) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    if (scannerRef.current) {
      try { scannerRef.current.pause(true); } catch (_) {}
    }

    setScanResult({ status: 'processing' });

    try {
      const url = new URL(decodedText);
      const scannedFiestaId = url.searchParams.get('fiestaId');
      const guestId = url.searchParams.get('guestId');

      if (!scannedFiestaId || scannedFiestaId !== fiestaId) {
        setScanResult({ status: 'invalid', message: 'Este QR no pertenece a este evento.' });
        scheduleReset();
        return;
      }

      if (!guestId) {
        setScanResult({ status: 'invalid', message: 'El QR no contiene un ID de invitado.' });
        scheduleReset();
        return;
      }

      const result = await checkInGuest(fiestaId, guestId);

      if (!result.success) {
        setScanResult({ status: 'invalid', message: result.error || 'Invitado no encontrado.' });
        scheduleReset();
        return;
      }

      if (result.invitado?.checkedIn && result.invitado.checkInTimestamp) {
        const isExistingCheckIn = new Date(result.invitado.checkInTimestamp).getTime() < Date.now() - 2000;
        if (isExistingCheckIn) {
          setScanResult({ status: 'already_entered', guest: result.invitado });
          scheduleReset(6000);
          return;
        }
      }

      setScanResult({ status: 'granted', guest: result.invitado! });
      scheduleReset(6000);
    } catch (_) {
      setScanResult({ status: 'invalid', message: 'Código QR inválido o ilegible.' });
      scheduleReset();
    }
  }, [fiestaId, scheduleReset]);

  const startScanner = useCallback(() => {
    const init = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (!scannerRef.current) {
          const scanner = new Html5QrcodeScanner(
            'qr-acceso-reader',
            { fps: 15, qrbox: { width: 260, height: 260 }, rememberLastUsedCamera: true },
            false
          );
          scanner.render(onScanSuccess, () => {});
          scannerRef.current = scanner;
        }
      } catch {
        setHasCameraPermission(false);
      }
    };
    init();
  }, [onScanSuccess]);

  useEffect(() => {
    if (!isLoading && fiesta) {
      startScanner();
    }
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isLoading, fiesta, startScanner]);

  const handleManualReset = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setScanResult({ status: 'idle' });
    isProcessingRef.current = false;
    if (scannerRef.current) {
      try { scannerRef.current.resume(); } catch (_) {}
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-slate-400">Cargando sistema de acceso…</p>
      </div>
    );
  }

  if (loadError || !fiesta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-center p-6">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-white text-xl font-semibold">{loadError || 'Evento no encontrado.'}</p>
      </div>
    );
  }

  const eventName = fiesta.configuracion?.nombreEvento || 'Evento';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">Control de Acceso</span>
        </div>
        <span className="text-xs text-slate-400 truncate max-w-[160px]">{eventName}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-4 gap-4">
        {/* Feedback overlay */}
        <AnimatePresence mode="wait">
          {scanResult.status !== 'idle' && scanResult.status !== 'processing' && (
            <motion.div
              key={scanResult.status}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, type: 'spring', damping: 20 }}
              className={cn(
                'w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl border-2',
                scanResult.status === 'granted'
                  ? 'bg-green-950 border-green-500'
                  : scanResult.status === 'already_entered'
                  ? 'bg-yellow-950 border-yellow-500'
                  : 'bg-red-950 border-red-500'
              )}
            >
              {scanResult.status === 'granted' && (
                <>
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-400 mb-4" />
                  <p className="text-2xl font-black text-green-300 mb-2">✅ ACCESO PERMITIDO</p>
                  <p className="text-xl font-bold text-white mb-3">{scanResult.guest.nombre}</p>
                  {scanResult.guest.dietaryRestriction && scanResult.guest.dietaryRestriction !== 'Ninguna' && (
                    <div className="bg-green-900/50 rounded-xl px-4 py-2 mb-2">
                      <p className="text-sm font-semibold text-green-300">
                        {DIETARY_LABELS[scanResult.guest.dietaryRestriction] || scanResult.guest.dietaryRestriction}
                      </p>
                    </div>
                  )}
                  {scanResult.guest.tableNumber && (
                    <p className="text-sm text-green-400">Mesa: <strong>{scanResult.guest.tableNumber}</strong></p>
                  )}
                </>
              )}
              {scanResult.status === 'already_entered' && (
                <>
                  <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                  <p className="text-2xl font-black text-yellow-300 mb-2">⚠️ YA INGRESÓ</p>
                  <p className="text-xl font-bold text-white mb-2">{scanResult.guest.nombre}</p>
                  <p className="text-sm text-yellow-400">Este QR ya fue utilizado anteriormente.</p>
                </>
              )}
              {scanResult.status === 'invalid' && (
                <>
                  <XCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
                  <p className="text-2xl font-black text-red-300 mb-2">❌ QR INVÁLIDO</p>
                  <p className="text-sm text-red-400">{scanResult.message}</p>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualReset}
                className="mt-4 text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Escanear otro
              </Button>
            </motion.div>
          )}

          {scanResult.status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6 text-center bg-slate-800 border-2 border-slate-600"
            >
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-3" />
              <p className="text-slate-300 font-semibold">Verificando invitado…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner */}
        <div className="w-full max-w-sm">
          {hasCameraPermission === false && (
            <div className="flex flex-col items-center gap-4 p-6 bg-slate-800 rounded-2xl text-center">
              <CameraOff className="w-12 h-12 text-red-400" />
              <p className="text-slate-300 font-medium">Se requiere acceso a la cámara</p>
              <p className="text-sm text-slate-500">Habilita los permisos de cámara en tu navegador.</p>
              <Button onClick={startScanner} variant="outline">Reintentar</Button>
            </div>
          )}
          <div
            id="qr-acceso-reader"
            className={cn(
              'w-full rounded-2xl overflow-hidden',
              scanResult.status !== 'idle' && scanResult.status !== 'processing' ? 'opacity-30 pointer-events-none' : ''
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default function AccesosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
        </div>
      }
    >
      <AccessControlContent />
    </Suspense>
  );
}
