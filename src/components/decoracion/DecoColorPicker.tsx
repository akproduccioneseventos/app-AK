'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#FF6B6B','#FF8E53','#FFDD57','#6BCB77','#4D96FF','#C77DFF',
  '#FF69B4','#FF9ECA','#FFC3A0','#FFD700','#98FB98','#87CEEB',
  '#DDA0DD','#F0E68C','#FFA07A','#20B2AA','#9370DB','#FF4500',
  '#2E8B57','#4169E1','#DC143C','#FF1493','#00CED1','#FF6347',
  '#7B68EE','#3CB371','#FF8C00','#8A2BE2','#00FA9A','#FF007F',
  '#C9A96E','#F5F0E8','#2C2C2C','#8B6A3E','#D4C5A9','#5C7A4E',
  '#1A1A2E','#E8E8E8','#4A90D9','#E91E8C','#FCE4EC','#9C27B0',
  '#FFFFFF','#F5F5F5','#E0E0E0','#BDBDBD','#9E9E9E','#616161',
  '#424242','#212121','#000000',
];

const RECENT_KEY = 'deco-recent-colors';
const MAX_RECENT = 8;

function getRecentColors(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem(RECENT_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function addRecentColor(color: string) {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentColors().filter(c => c !== color);
    recent.unshift(color);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {}
}

interface DecoColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  paletteColors?: string[];
  label?: string;
}

export default function DecoColorPicker({ value, onChange, paletteColors = [], label }: DecoColorPickerProps) {
  const [hexInput, setHexInput] = useState(value || '#FF6B6B');
  const [recentColors, setRecentColors] = useState<string[]>([]);

  useEffect(() => {
    setRecentColors(getRecentColors());
  }, []);

  useEffect(() => {
    setHexInput(value || '#FF6B6B');
  }, [value]);

  const applyColor = (color: string) => {
    onChange(color);
    addRecentColor(color);
    setRecentColors(getRecentColors());
    setHexInput(color);
  };

  const handleHexInput = (v: string) => {
    setHexInput(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      applyColor(v);
    }
  };

  return (
    <div className="space-y-3">
      {label && <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</Label>}
      
      {/* Event palette colors */}
      {paletteColors.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Paleta del evento</p>
          <div className="flex gap-2 flex-wrap">
            {paletteColors.map((c, i) => (
              <button
                key={i}
                type="button"
                title={c}
                onClick={() => applyColor(c)}
                className={cn(
                  'w-8 h-8 rounded-full border-2 shadow transition-transform hover:scale-110',
                  value === c ? 'border-blue-500 scale-110' : 'border-white'
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Usados recientemente</p>
          <div className="flex gap-1.5 flex-wrap">
            {recentColors.map((c, i) => (
              <button
                key={i}
                type="button"
                title={c}
                onClick={() => applyColor(c)}
                className={cn(
                  'w-7 h-7 rounded-full border-2 shadow transition-transform hover:scale-110',
                  value === c ? 'border-blue-500 scale-110' : 'border-white'
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset palette grid */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Colores</p>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {PRESET_COLORS.map((c, i) => (
            <button
              key={i}
              type="button"
              title={c}
              onClick={() => applyColor(c)}
              className={cn(
                'w-6 h-6 rounded-md border-2 shadow-sm transition-transform hover:scale-110',
                value === c ? 'border-blue-500 scale-110' : 'border-white'
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* Hex input + native picker */}
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={hexInput.match(/^#[0-9A-Fa-f]{6}$/) ? hexInput : '#FF6B6B'}
          onChange={e => applyColor(e.target.value)}
          className="w-10 h-10 cursor-pointer rounded-lg border-2 border-slate-200 p-0.5 shrink-0"
          title="Selector visual"
        />
        <Input
          value={hexInput}
          onChange={e => handleHexInput(e.target.value)}
          placeholder="#RRGGBB"
          className="h-9 font-mono text-sm rounded-xl bg-slate-50 border-none"
          maxLength={7}
        />
      </div>
    </div>
  );
}
