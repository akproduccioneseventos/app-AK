'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, MonitorSmartphone, Share2, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const promptEventRef = useRef<BeforeInstallPromptEvent | null>(null);
  const pendingRef = useRef(false);
  const installedRef = useRef(false);
  const mountedRef = useRef(false);
  const attemptRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    const updateInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      if (standalone || iosStandalone) {
        installedRef.current = true;
        setIsInstalled(true);
      }
    };

    updateInstalled();

    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      const isAppleMobile = /iphone|ipad|ipod/.test(ua) ||
        (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
      setIsIos(isAppleMobile);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const nextEvent = event as BeforeInstallPromptEvent;
      promptEventRef.current = nextEvent;
      setPromptEvent(nextEvent);
      setInstallError(null);
    };

    const handleInstalled = () => {
      installedRef.current = true;
      promptEventRef.current = null;
      setIsInstalled(true);
      setPromptEvent(null);
      setInstallError(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      mountedRef.current = false;
      attemptRef.current += 1;
      pendingRef.current = false;
      promptEventRef.current = null;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const event = promptEventRef.current;
    if (!event || pendingRef.current || installedRef.current) return;

    pendingRef.current = true;
    const attempt = ++attemptRef.current;
    promptEventRef.current = null;
    setPromptEvent(null);
    setIsPending(true);
    setInstallError(null);

    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      if (!mountedRef.current || attempt !== attemptRef.current || installedRef.current) return;
      setInstallError('No se pudo iniciar la instalación. Espera e intenta de nuevo cuando el navegador vuelva a ofrecerla.');
    } finally {
      if (mountedRef.current && attempt === attemptRef.current) {
        pendingRef.current = false;
        setIsPending(false);
      }
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <span>AK Producciones ya esta instalada en este dispositivo.</span>
      </div>
    );
  }

  // Guía para iPhone / iPad en Safari (sin beforeinstallprompt)
  if (isIos) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-950">
        <p className="font-bold text-amber-900 mb-2">Instalá la app en tu iPhone en 2 pasos:</p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-black text-amber-900">1</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span>Tocá Compartir</span>
              <Share2 className="h-4 w-4 text-amber-700" />
              <span className="text-xs text-amber-800">(en la barra inferior de Safari)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-black text-amber-900">2</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span>Elegí</span>
              <strong className="text-amber-950">Agregar a inicio</strong>
              <PlusSquare className="h-4 w-4 text-amber-700" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!promptEvent) {
    return (
      <div>
        {installError && <p role="alert" className="mb-3 text-sm text-red-700">{installError}</p>}
        {isPending && <p role="status" className="mb-3 text-sm text-slate-600">Esperando respuesta del navegador...</p>}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          <div className="flex items-start gap-3">
            <MonitorSmartphone className="mt-1 h-5 w-5 shrink-0 text-red-600" />
            <p>
              Si el botón automático no aparece, abrí el menú de Chrome o Edge y elegí <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {installError && <p role="alert" className="mb-3 text-sm text-red-700">{installError}</p>}
      <Button onClick={handleInstall} disabled={isPending} className="h-11 w-full rounded-2xl bg-red-600 font-black hover:bg-red-700 sm:w-auto">
        <Download className="mr-2 h-4 w-4" />
        {isPending ? 'Abriendo instalación...' : 'Instalar AK Producciones'}
      </Button>
    </div>
  );
}
