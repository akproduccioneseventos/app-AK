'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { ElementoDecorativo } from '@/types/fiesta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadButton } from '@/components/invitacion/edit/UploadButton';
import { getMaxColoresByTipo } from '@/components/decoracion/deco-element-types';

interface DecoPropertiesPanelProps {
  selectedElemento: ElementoDecorativo | null;
  paletteColors: string[];
  canvasFondoColor: string;
  canvasFondoImagenUrl: string;
  fiestaId?: string;
  onUpdateElemento: (id: string, patch: Partial<ElementoDecorativo>) => void;
  onDeleteElemento: (id: string) => void;
  onCanvasFondoColorChange: (color: string) => void;
  onCanvasFondoImagenUrlChange: (url: string) => void;
}

export default function DecoPropertiesPanel({
  selectedElemento,
  paletteColors,
  canvasFondoColor,
  canvasFondoImagenUrl,
  fiestaId,
  onUpdateElemento,
  onDeleteElemento,
  onCanvasFondoColorChange,
  onCanvasFondoImagenUrlChange,
}: DecoPropertiesPanelProps) {
  if (!selectedElemento) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold">Fondo del Canvas</h3>
        <div className="space-y-1">
          <Label className="text-xs">Color de fondo</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={canvasFondoColor}
              onChange={e => onCanvasFondoColorChange(e.target.value)}
              className="w-10 h-10 cursor-pointer rounded border p-0.5"
            />
            <span className="text-xs text-muted-foreground font-mono">{canvasFondoColor}</span>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Imagen de fondo</Label>
          <UploadButton
            currentUrl={canvasFondoImagenUrl || undefined}
            onUrlChange={onCanvasFondoImagenUrlChange}
            fiestaId={fiestaId}
            accept="image/*"
          />
          {canvasFondoImagenUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-destructive"
              onClick={() => onCanvasFondoImagenUrlChange('')}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Quitar imagen
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">Hacé clic en un elemento del canvas para ver sus propiedades.</p>
      </div>
    );
  }

  const maxColores = getMaxColoresByTipo(selectedElemento.tipo, Math.max(1, selectedElemento.colores.length || 1));

  const updateColorAt = (index: number, value: string) => {
    const next = [...(selectedElemento.colores || [])];
    while (next.length <= index) next.push('#888888');
    next[index] = value;
    onUpdateElemento(selectedElemento.id, { colores: next });
  };
  const getColorLabel = (idx: number) => {
    if (idx === 0) return 'Color principal';
    if (idx === 1) return 'Color secundario';
    return `Color ${idx + 1}`;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">Propiedades del elemento</h3>

      {Array.from({ length: maxColores }).map((_, idx) => (
        <div key={idx} className="space-y-1">
          <Label className="text-xs">{getColorLabel(idx)}</Label>
          <div className="flex items-center gap-2 flex-wrap">
            {paletteColors.map((color, i) => (
              <button
                key={`${color}-${i}`}
                type="button"
                className="w-7 h-7 rounded-full border-2 border-white shadow"
                style={{
                  backgroundColor: color,
                  outline: (selectedElemento.colores[idx] ?? '#888888') === color ? '2px solid #3B82F6' : 'none',
                  outlineOffset: 2,
                }}
                onClick={() => updateColorAt(idx, color)}
              />
            ))}
            <input
              type="color"
              value={selectedElemento.colores[idx] ?? '#888888'}
              onChange={e => updateColorAt(idx, e.target.value)}
              className="w-8 h-8 rounded border p-0.5 cursor-pointer"
            />
          </div>
        </div>
      ))}

      {selectedElemento.imageDataUri && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Tinte</Label>
            <input
              type="color"
              value={selectedElemento.tintColor ?? '#ffffff'}
              onChange={e => onUpdateElemento(selectedElemento.id, { tintColor: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white p-1 cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Intensidad tinte ({Math.round((selectedElemento.tintOpacity ?? 0) * 100)}%)</Label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selectedElemento.tintOpacity ?? 0}
              onChange={e => onUpdateElemento(selectedElemento.id, { tintOpacity: Number(e.target.value) })}
              className="w-full h-2 accent-primary"
            />
          </div>
        </>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Tamaño</Label>
        <div className="flex gap-1">
          {([['S', 0.7], ['M', 1], ['L', 1.5], ['XL', 2]] as [string, number][]).map(([label, value]) => (
            <Button
              key={label}
              type="button"
              size="sm"
              variant={(selectedElemento.escala ?? 1) === value ? 'default' : 'outline'}
              className="flex-1 text-xs px-1 h-8"
              onClick={() => onUpdateElemento(selectedElemento.id, { escala: value })}
            >
              {label}
            </Button>
          ))}
        </div>
        <input
          type="range"
          min={0.2}
          max={3}
          step={0.05}
          value={selectedElemento.escala ?? 1}
          onChange={e => onUpdateElemento(selectedElemento.id, { escala: Number(e.target.value) })}
          className="w-full h-2 accent-primary"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Rotación ({Math.round(selectedElemento.rotacion ?? 0)}°)</Label>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={selectedElemento.rotacion ?? 0}
          onChange={e => onUpdateElemento(selectedElemento.id, { rotacion: Number(e.target.value) })}
          className="w-full h-2 accent-primary"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Opacidad ({Math.round((selectedElemento.opacity ?? 1) * 100)}%)</Label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={selectedElemento.opacity ?? 1}
          onChange={e => onUpdateElemento(selectedElemento.id, { opacity: Number(e.target.value) })}
          className="w-full h-2 accent-primary"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Etiqueta</Label>
        <Input
          value={selectedElemento.etiqueta ?? ''}
          onChange={e => onUpdateElemento(selectedElemento.id, { etiqueta: e.target.value })}
          placeholder="Ej: Mesa principal"
          className="h-8 text-sm"
        />
      </div>

      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={() => onDeleteElemento(selectedElemento.id)}
      >
        <Trash2 className="w-4 h-4 mr-2" /> Eliminar elemento
      </Button>
    </div>
  );
}
