'use client';

import React from 'react';
import { Camera, Film, Repeat, Wand2, Image as ImageIcon } from 'lucide-react';

export type FormatoCaptura = 'foto' | 'gif' | 'video' | 'boomerang' | 'avatar_ia';

export interface SelectorFormatoCapturaProps {
  formatosDisponibles?: FormatoCaptura[];
  formatoSeleccionado: FormatoCaptura;
  onSelectFormato: (formato: FormatoCaptura) => void;
  disabled?: boolean;
}

const FORMATOS_CONFIG: Record<
  FormatoCaptura,
  { label: string; icon: React.ElementType; color: string }
> = {
  foto: { label: 'Foto', icon: Camera, color: 'text-amber-400' },
  gif: { label: 'GIF', icon: ImageIcon, color: 'text-sky-400' },
  video: { label: 'Video', icon: Film, color: 'text-emerald-400' },
  boomerang: { label: 'Boomerang', icon: Repeat, color: 'text-pink-400' },
  avatar_ia: { label: 'Avatar IA', icon: Wand2, color: 'text-purple-400' },
};

export function SelectorFormatoCaptura({
  formatosDisponibles = ['foto', 'gif', 'video', 'boomerang'],
  formatoSeleccionado,
  onSelectFormato,
  disabled = false,
}: SelectorFormatoCapturaProps) {
  if (formatosDisponibles.length <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/60 p-1.5 backdrop-blur-md">
      {formatosDisponibles.map((f) => {
        const config = FORMATOS_CONFIG[f];
        const isSelected = formatoSeleccionado === f;
        const Icon = config.icon;

        return (
          <button
            key={f}
            type="button"
            disabled={disabled}
            onClick={() => onSelectFormato(f)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              isSelected
                ? 'bg-white/20 text-white shadow-md border border-white/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            } disabled:pointer-events-none disabled:opacity-50`}
          >
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
