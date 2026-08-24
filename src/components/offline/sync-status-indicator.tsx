'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import {
  getPendingOfflineMediaCount,
} from '@/lib/offline/offline-db';
import { processOfflineMediaQueue, setupGlobalOfflineSync } from '@/lib/offline/offline-sync-manager';

interface SyncStatusIndicatorProps {
  fiestaId?: string;
  moduleId?: string;
  accessToken?: string;
  guestId?: string;
  guestAccessToken?: string;
}

export function SyncStatusIndicator({
  fiestaId,
  moduleId,
  accessToken,
  guestId,
  guestAccessToken,
}: SyncStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const updateCounts = async () => {
      const count = await getPendingOfflineMediaCount(fiestaId, moduleId);
      setPendingCount(count);
    };

    updateCounts();

    const syncScope = { fiestaId, moduleId, accessToken, guestId, guestAccessToken };
    const cleanupSync = setupGlobalOfflineSync(syncScope);

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      const res = await processOfflineMediaQueue(syncScope);
      setIsSyncing(false);
      await updateCounts();
      if (res.processed > 0) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateCounts();
    };

    const handleMediaUpdated = () => {
      updateCounts();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('ak-offline-media-updated', handleMediaUpdated);

    const interval = setInterval(updateCounts, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ak-offline-media-updated', handleMediaUpdated);
      clearInterval(interval);
      if (cleanupSync) cleanupSync();
    };
  }, [accessToken, fiestaId, guestAccessToken, guestId, moduleId]);

  const handleManualSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    const res = await processOfflineMediaQueue({ fiestaId, moduleId, accessToken, guestId, guestAccessToken });
    setIsSyncing(false);
    const count = await getPendingOfflineMediaCount(fiestaId, moduleId);
    setPendingCount(count);
    if (res.processed > 0) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9998] pointer-events-auto print:hidden font-sans">
      <AnimatePresence>
        {/* Banner 1: Sin conexion */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg backdrop-blur-md border border-amber-400"
          >
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <span>
              {pendingCount > 0
                ? `Sin internet — se guarda y se manda después (${pendingCount} esperando)`
                : 'Sin internet — se guarda y se manda después'}
            </span>
          </motion.div>
        )}

        {/* Banner 2: Sincronizando al recuperar senal */}
        {isOnline && isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg backdrop-blur-md border border-indigo-500"
          >
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span>Sincronizando fotos pendientes ({pendingCount})...</span>
          </motion.div>
        )}

        {/* Banner 3: Confirmacion de subida completa */}
        {isOnline && !isSyncing && showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg backdrop-blur-md border border-emerald-500"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Listo, se subió todo</span>
          </motion.div>
        )}

        {/* Boton de rescate si hay pendientes retenidos */}
        {isOnline && !isSyncing && pendingCount > 0 && !showSuccessToast && (
          <motion.button
            type="button"
            onClick={handleManualSync}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 text-amber-300 hover:text-white hover:bg-slate-800 border border-amber-500/30 text-xs font-semibold shadow-md transition-all"
            title="Toca para forzar sincronización"
          >
            <CloudUpload className="w-3.5 h-3.5 text-amber-400" />
            <span>{pendingCount} esperando subida</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
