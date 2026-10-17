'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Radio, Zap, Volume2, X } from 'lucide-react';
import { getCrowdSyncStateAction, type CrowdSyncState } from '@/app/actions/crowd-sync';

interface CrowdSyncShowProps {
  fiestaId: string;
}

export function CrowdSyncShow({ fiestaId }: CrowdSyncShowProps) {
  const [syncState, setSyncState] = useState<CrowdSyncState | null>(null);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const fetchSync = useCallback(async () => {
    const res = await getCrowdSyncStateAction(fiestaId);
    if (res.success && res.state) {
      setSyncState(res.state);
      if (res.state.active && dismissed) {
        setDismissed(false);
      }
    }
  }, [fiestaId, dismissed]);

  useEffect(() => {
    fetchSync();
    const timer = setInterval(fetchSync, 4000);
    return () => clearInterval(timer);
  }, [fetchSync]);

  // Efecto de pulso y vibración háptica sincronizada al ritmo de BPM
  useEffect(() => {
    if (!syncState?.active || dismissed) return;

    // Vibración háptica en celulares si está soportado
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {
        // Silencioso
      }
    }

    const intervalMs = Math.max(300, Math.round(60000 / (syncState.bpm || 120)));
    const pulseTimer = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 2);
    }, intervalMs);

    return () => clearInterval(pulseTimer);
  }, [syncState, dismissed]);

  if (!syncState?.active || dismissed) return null;

  const bgStyle =
    pulseIndex === 0
      ? syncState.primaryColor || '#eab308'
      : syncState.secondaryColor || '#000000';

  return (
    <div
      style={{
        backgroundColor: bgStyle,
        transition: 'background-color 0.25s ease-in-out',
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 text-white text-center select-none"
    >
      <div className="w-full flex justify-between items-center pt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/20 text-white">
          <Radio className="w-3.5 h-3.5 animate-pulse text-amber-300" />
          Modo Show Sincronizado
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 transition"
          aria-label="Cerrar show"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 my-auto max-w-sm px-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center animate-bounce shadow-2xl">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-black tracking-tight drop-shadow-lg text-white">
          {syncState.title}
        </h2>
        <p className="text-sm font-semibold text-white/90 drop-shadow">
          {syncState.subtitle}
        </p>
      </div>

      <div className="pb-6 text-xs font-bold text-white/80 uppercase tracking-widest bg-black/30 px-4 py-2 rounded-xl backdrop-blur-sm">
        ✨ AK Producciones • Pista Sincronizada
      </div>
    </div>
  );
}
