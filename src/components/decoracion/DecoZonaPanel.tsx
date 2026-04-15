'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ElementoDecorativo } from '@/types/fiesta';

const ZONAS_DISPONIBLES = [
  { id: '', nombre: 'General (sin zona)' },
  { id: 'zona_entrada', nombre: 'Entrada' },
  { id: 'zona_mesas', nombre: 'Mesas' },
  { id: 'zona_principal', nombre: 'Mesa Principal / Torta' },
  { id: 'zona_pista', nombre: 'Pista de Baile' },
  { id: 'zona_candy', nombre: 'Candy Bar' },
  { id: 'zona_fotos', nombre: 'Zona Fotos' },
  { id: 'zona_regalos', nombre: 'Zona Regalos' },
];

interface DecoZonaPanelProps {
  selectedElement?: ElementoDecorativo | null;
  onChangeZona: (zona: string) => void;
  hiddenZones: string[];
  onToggleZoneVisibility: (zonaId: string) => void;
}

export default function DecoZonaPanel({ selectedElement, onChangeZona, hiddenZones, onToggleZoneVisibility }: DecoZonaPanelProps) {
  return (
    <div className="space-y-4">
      {/* Zone assignment for selected element */}
      {selectedElement && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" /> Zona del elemento
          </p>
          <Select value={selectedElement.zona ?? ''} onValueChange={onChangeZona}>
            <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-none text-sm">
              <SelectValue placeholder="Seleccionar zona..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              {ZONAS_DISPONIBLES.map(z => (
                <SelectItem key={z.id} value={z.id}>{z.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Show/hide zones */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mostrar por zona</p>
        <div className="space-y-1.5">
          {ZONAS_DISPONIBLES.filter(z => z.id !== '').map(zona => {
            const isHidden = hiddenZones.includes(zona.id);
            return (
              <Button
                key={zona.id}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onToggleZoneVisibility(zona.id)}
                className={cn(
                  "w-full justify-start gap-2 text-xs h-8 rounded-xl",
                  isHidden ? "text-slate-300 line-through" : "text-slate-700"
                )}
              >
                {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {zona.nombre}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { ZONAS_DISPONIBLES };
