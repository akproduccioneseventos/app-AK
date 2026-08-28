'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, Camera, Loader2, CheckCircle2 } from 'lucide-react';

export interface GuiaPosicionamientoProps {
  nombreInvitado?: string;
  estado: 'idle' | 'countdown' | 'recording' | 'processing' | 'done';
  countdown: number | null;
  mensajeGuia?: string;
  mostrarSilueta?: boolean;
}

export function GuiaPosicionamiento({
  nombreInvitado,
  estado,
  countdown,
  mensajeGuia,
  mostrarSilueta = true,
}: GuiaPosicionamientoProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-6">
      {/* 1. Saludo personalizado con nombre (Bloque 1) */}
      <div className="w-full max-w-xl text-center">
        {nombreInvitado ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-black/60 px-5 py-2 backdrop-blur-md"
          >
            <Sparkles className="h-5 w-5 text-amber-400" />
            <span className="text-base font-bold text-white">
              ¡Hola, {nombreInvitado}! Ponete cómodo/a
            </span>
          </motion.div>
        ) : null}
      </div>

      {/* 2. Silueta / Dónde pararse (Bloque 3) */}
      {mostrarSilueta && (estado === 'idle' || estado === 'countdown') && (
        <div className="relative flex flex-col items-center justify-center opacity-60">
          <div className="h-64 w-64 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center">
            <User className="h-40 w-40 text-white/30" />
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/70 drop-shadow">
            Ubicá tu rostro en el centro
          </p>
        </div>
      )}

      {/* 3. Cuenta regresiva gigante o estados activos */}
      <div className="flex flex-col items-center justify-center">
        <AnimatePresence>
          {estado === 'countdown' && countdown !== null && (
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-amber-400 bg-black/70 text-7xl font-black text-amber-400 shadow-2xl backdrop-blur-md"
            >
              {countdown}
            </motion.div>
          )}

          {estado === 'recording' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 rounded-full border border-red-500 bg-red-600/80 px-6 py-3 text-white shadow-xl backdrop-blur-md"
            >
              <div className="h-4 w-4 animate-ping rounded-full bg-white" />
              <span className="text-xl font-black tracking-wide">¡GRABANDO!</span>
            </motion.div>
          )}

          {estado === 'processing' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 rounded-full border border-amber-400/40 bg-zinc-900/90 px-6 py-3 text-white shadow-xl backdrop-blur-md"
            >
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
              <span className="text-lg font-bold">Armando tu recuerdo...</span>
            </motion.div>
          )}

          {estado === 'done' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-5 py-2.5 text-emerald-300 backdrop-blur-md"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-bold">¡Tu recuerdo quedó listo!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Mensaje de guía inferior */}
      <div className="min-h-10 text-center">
        {mensajeGuia && estado !== 'done' && (
          <div className="rounded-xl border border-white/10 bg-black/70 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-md">
            {mensajeGuia}
          </div>
        )}
      </div>
    </div>
  );
}
