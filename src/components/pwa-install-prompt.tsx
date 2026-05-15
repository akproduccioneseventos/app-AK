'use client';

import { useEffect, useState } from 'react';
import { Download, MonitorSmartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISSED_KEY = 'pwa_install_dismissed_at';
const DISMISS_TTL_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    try {
      const dismissedAt = localStorage.getItem(DISMISSED_KEY);
      if (dismissedAt) {
        const diffDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (diffDays < DISMISS_TTL_DAYS) return;
      }
    } catch {
      // Ignore storage errors.
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Ignore storage errors.
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500 sm:left-auto sm:right-6 sm:w-[380px]">
      <div className="overflow-hidden rounded-[1.5rem] border border-red-100 bg-white text-slate-950 shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
              <MonitorSmartphone className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-black leading-tight">Instalar AK Producciones</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Acceso directo en PC y Android.</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3">
          <p className="text-xs font-medium leading-5 text-slate-600">
            La app queda como icono, abre a pantalla completa y mantiene el mismo sistema online de Firebase.
          </p>
          <Button onClick={handleInstall} className="h-11 w-full rounded-2xl bg-red-600 text-sm font-black hover:bg-red-700">
            <Download className="mr-2 h-4 w-4" />
            Instalar ahora
          </Button>
        </div>
      </div>
    </div>
  );
}
