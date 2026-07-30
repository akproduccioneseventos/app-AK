'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Heart, Film, Award, Flame, Sun, Music, PartyPopper } from 'lucide-react';

export type FrameTemplateId =
  | 'default'
  | 'neon'
  | 'elegante'
  | 'cumple-infantil'
  | 'quince'
  | 'vintage'
  | 'glamour'
  | 'floral'
  | 'urbano'
  | 'minimalista';

export interface FrameOption {
  id: FrameTemplateId;
  label: string;
  description: string;
  badge: string;
}

export const FRAME_TEMPLATES: FrameOption[] = [
  { id: 'default', label: 'Sin Marco', description: 'Video limpio sin bordes ni overlays.', badge: 'Standard' },
  { id: 'neon', label: 'Neón Party', description: 'Efecto cyber neón fucsia y cian con resplandor.', badge: 'Popular' },
  { id: 'elegante', label: 'Boda Elegante', description: 'Borde dorado metálico con esquinas ornamentadas.', badge: 'Premium' },
  { id: 'quince', label: 'Mis 15', description: 'Corona brillante rosa glamour con filigranas.', badge: 'Fav' },
  { id: 'cumple-infantil', label: 'Cumple Infantil', description: 'Borde festivo multicolor con globos y estrellitas.', badge: 'Fun' },
  { id: 'vintage', label: 'Retro Vintage', description: 'Cinta de película 35mm con código VHS.', badge: 'Retro' },
  { id: 'glamour', label: 'VIP Glamour', description: 'Alfombra roja con luces de estudio de cine.', badge: 'VIP' },
  { id: 'floral', label: 'Romántico Floral', description: 'Marco botánico en tonos pasteles y esmeralda.', badge: 'Chic' },
  { id: 'urbano', label: 'Urbano Trap', description: 'Estilo callejero oscuro con bordes industriales.', badge: 'New' },
  { id: 'minimalista', label: 'Minimalista Blanco', description: 'Borde paspartú blanco tipo galería de arte.', badge: 'Clean' },
];

interface VideoFrameOverlayProps {
  template: string | undefined;
  customText?: string;
  eventName?: string;
  className?: string;
}

export function VideoFrameOverlay({ template, customText, eventName, className }: VideoFrameOverlayProps) {
  const currentId = (template || 'default') as FrameTemplateId;
  if (currentId === 'default') return null;

  const displayText = customText || eventName || 'AK PRODUCCIONES';

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10 flex flex-col justify-between overflow-hidden", className)}>
      {/* 🔮 NEON PARTY */}
      {currentId === 'neon' && (
        <div className="absolute inset-0 border-[10px] sm:border-[14px] border-fuchsia-500 rounded-3xl shadow-[inset_0_0_30px_rgba(217,70,239,0.8),0_0_20px_rgba(217,70,239,0.9)] flex flex-col justify-between p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-600/90 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(217,70,239,0.9)]">
              <Sparkles className="w-3 h-3 text-cyan-300 animate-spin-slow" /> NEON NIGHTS
            </span>
            <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]">
              LIVE ⚡
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-300 drop-shadow-[0_0_12px_rgba(217,70,239,1)]">
              ✨ {displayText} ✨
            </p>
          </div>
        </div>
      )}

      {/* 👑 BODA ELEGANTE */}
      {currentId === 'elegante' && (
        <div className="absolute inset-0 border-[12px] sm:border-[16px] border-amber-300/90 rounded-3xl shadow-[inset_0_0_25px_rgba(251,191,36,0.4)] flex flex-col justify-between p-4">
          <div className="flex items-center justify-between border-b border-amber-200/40 pb-2">
            <span className="text-[10px] font-serif font-black uppercase tracking-[0.25em] text-amber-200 drop-shadow">
              ✦ BODA ELEGANTE ✦
            </span>
            <Heart className="w-4 h-4 text-amber-300 fill-amber-300/40" />
          </div>
          <div className="text-center border-t border-amber-200/40 pt-2">
            <p className="text-xs sm:text-sm font-serif font-bold tracking-widest text-amber-100 uppercase drop-shadow">
              {displayText}
            </p>
          </div>
        </div>
      )}

      {/* 👑 MIS 15 */}
      {currentId === 'quince' && (
        <div className="absolute inset-0 border-[12px] sm:border-[16px] border-pink-400 border-double rounded-3xl shadow-[inset_0_0_30px_rgba(244,114,182,0.6)] flex flex-col justify-between p-4 bg-pink-950/10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500 text-white font-black text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(244,114,182,0.8)]">
              👑 MIS 15 AÑOS
            </span>
            <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-pink-200 drop-shadow-[0_0_10px_rgba(244,114,182,0.9)]">
              💖 {displayText} 💖
            </p>
          </div>
        </div>
      )}

      {/* 🎈 CUMPLE INFANTIL */}
      {currentId === 'cumple-infantil' && (
        <div className="absolute inset-0 border-[14px] border-dashed border-sky-400 rounded-3xl shadow-[inset_0_0_20px_rgba(56,189,248,0.5)] flex flex-col justify-between p-4 bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400 text-slate-900 font-black text-[10px] uppercase tracking-wider shadow-md">
              <PartyPopper className="w-3.5 h-3.5 text-slate-900" /> ¡FIESTA! 🎈
            </span>
            <span className="text-xl">🎉</span>
          </div>
          <div className="text-center bg-sky-500/80 backdrop-blur-sm py-1 rounded-xl">
            <p className="text-xs font-black uppercase tracking-wider text-white">
              🎈 {displayText} 🎂
            </p>
          </div>
        </div>
      )}

      {/* 📼 RETRO VINTAGE */}
      {currentId === 'vintage' && (
        <div className="absolute inset-0 border-[16px] border-zinc-900 rounded-3xl flex flex-col justify-between p-3 bg-amber-950/20">
          <div className="flex items-center justify-between font-mono text-[10px] text-amber-200/90 tracking-widest">
            <span className="flex items-center gap-1"><Film className="w-3.5 h-3.5" /> 35MM FILM</span>
            <span>VHS-SP 0:00:15</span>
          </div>
          <div className="flex justify-between items-center font-mono text-[10px] text-amber-200/90 tracking-widest border-t border-amber-500/30 pt-1">
            <span>{displayText.toUpperCase()}</span>
            <span>PLAY ▶</span>
          </div>
        </div>
      )}

      {/* 🌟 VIP GLAMOUR */}
      {currentId === 'glamour' && (
        <div className="absolute inset-0 border-[14px] border-yellow-500/90 rounded-3xl shadow-[inset_0_0_35px_rgba(234,179,8,0.5)] flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-widest shadow-lg">
              <Award className="w-3.5 h-3.5" /> VIP ACCESS
            </span>
            <span className="text-[10px] font-black text-yellow-300 tracking-widest">RED CARPET</span>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-yellow-200 drop-shadow-[0_2px_10px_rgba(234,179,8,0.8)]">
              ⭐ {displayText} ⭐
            </p>
          </div>
        </div>
      )}

      {/* 🌿 ROMÁNTICO FLORAL */}
      {currentId === 'floral' && (
        <div className="absolute inset-0 border-[14px] border-emerald-300/80 border-dotted rounded-3xl shadow-[inset_0_0_20px_rgba(16,185,129,0.3)] flex flex-col justify-between p-4 bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-serif font-black text-emerald-200 uppercase tracking-widest">
              🌿 RECUERDOS DULCES 🌿
            </span>
          </div>
          <div className="text-center border-t border-emerald-300/30 pt-1.5">
            <p className="text-xs font-serif font-bold text-emerald-100 uppercase tracking-widest">
              {displayText}
            </p>
          </div>
        </div>
      )}

      {/* 🛹 URBANO TRAP */}
      {currentId === 'urbano' && (
        <div className="absolute inset-0 border-[18px] border-zinc-900 rounded-3xl shadow-[inset_0_0_20px_#000] flex flex-col justify-between p-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-red-600 text-white font-mono font-black text-[10px] uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5" /> STREET MODE
            </span>
            <span className="font-mono text-[10px] text-zinc-400">#URBAN</span>
          </div>
          <div className="text-center bg-zinc-900/90 py-1 border-t border-zinc-700">
            <p className="font-mono text-xs font-black text-white uppercase tracking-widest">
              🔥 {displayText} 🔥
            </p>
          </div>
        </div>
      )}

      {/* 🏛️ MINIMALISTA BLANCO */}
      {currentId === 'minimalista' && (
        <div className="absolute inset-0 border-[12px] border-white rounded-3xl shadow-[inset_0_0_15px_rgba(0,0,0,0.3)] flex flex-col justify-between p-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">GALLERY SPEC</span>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              {displayText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
