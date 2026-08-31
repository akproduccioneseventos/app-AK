import React from 'react';
import Link from 'next/link';
import { MessageCircle, Clock, ShieldCheck } from 'lucide-react';

export default function MantenimientoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="max-w-md w-full space-y-8 p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Estamos haciendo mejoras
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Estamos poniendo a punto la plataforma para que tu experiencia sea perfecta. Volvemos en unos minutos.
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-800/60 space-y-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            ¿Tenés una consulta urgente sobre tu fiesta?
          </p>

          <a
            href="https://wa.me/59898355530?text=Hola%20AK%20Producciones,%20les%20escribo%20desde%20la%20p%C3%A1gina%20de%20mantenimiento."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Escribinos directo por WhatsApp</span>
          </a>
        </div>

        <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs font-bold pt-2">
          <ShieldCheck className="w-4 h-4 text-zinc-500" />
          <span>AK Producciones Eventos • Salto, Uruguay</span>
        </div>
      </div>
    </div>
  );
}
