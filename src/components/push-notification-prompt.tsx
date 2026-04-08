'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestAndSaveFcmToken } from '@/lib/firebase/messaging';

const DISMISSED_KEY = 'push_prompt_dismissed_at';
const DISMISS_TTL_DAYS = 7;

export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only show if browser supports notifications
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Already granted — no need to ask
    if (Notification.permission === 'granted') return;

    // Explicitly denied — respect the user's browser choice
    if (Notification.permission === 'denied') return;

    // Check local dismiss flag
    try {
      const dismissedAt = localStorage.getItem(DISMISSED_KEY);
      if (dismissedAt) {
        const diffDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (diffDays < DISMISS_TTL_DAYS) return;
      }
    } catch {
      // ignore
    }

    // Show after a short delay so the page loads first
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      await requestAndSaveFcmToken();
    } finally {
      setLoading(false);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-[360px] z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 rounded-2xl shadow-2xl overflow-hidden text-white">
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm leading-tight">Activar notificaciones</p>
              <p className="text-xs text-white/70 font-medium">AK Producciones</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 mt-0.5"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-white/80 leading-relaxed">
            Recibí alertas de pagos, eventos próximos y más, directamente en tu dispositivo.
          </p>
          <Button
            onClick={handleEnable}
            disabled={loading}
            className="w-full bg-white text-indigo-700 hover:bg-white/90 font-black rounded-xl h-10 text-sm shadow-lg"
          >
            {loading ? '🔔 Activando…' : '🔔 Activar notificaciones'}
          </Button>
        </div>
      </div>
    </div>
  );
}
