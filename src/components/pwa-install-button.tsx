'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Download, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const updateInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      setIsInstalled(standalone || iosStandalone);
    };

    updateInstalled();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  if (isInstalled) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <span>AK Producciones ya esta instalada en este dispositivo.</span>
      </div>
    );
  }

  if (!promptEvent) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
        <div className="flex items-start gap-3">
          <MonitorSmartphone className="mt-1 h-5 w-5 shrink-0 text-red-600" />
          <p>
            Si el boton automatico no aparece, abri el menu de Chrome o Edge y elegi <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={handleInstall} className="h-11 w-full rounded-2xl bg-red-600 font-black hover:bg-red-700 sm:w-auto">
      <Download className="mr-2 h-4 w-4" />
      Instalar AK Producciones
    </Button>
  );
}
