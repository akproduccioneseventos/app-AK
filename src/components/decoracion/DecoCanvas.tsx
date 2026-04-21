'use client';

import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { RotateCcw, Grid, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ElementoDecorativo } from '@/types/fiesta';
import { DecoElementSvg } from './deco-svg-elements';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DragState {
  elementId: string;
  startMouseX: number;
  startMouseY: number;
  startElX: number;
  startElY: number;
}

interface ResizeState {
  elementId: string;
  handle: 'nw' | 'ne' | 'se' | 'sw';
  startMouseX: number;
  startMouseY: number;
  startEscala: number;
  startX: number;
  startY: number;
}

interface RotateState {
  elementId: string;
  centerX: number;
  centerY: number;
  startAngle: number;
  startRotacion: number;
}

type InteractionState =
  | { type: 'idle' }
  | { type: 'drag'; data: DragState }
  | { type: 'resize'; data: ResizeState }
  | { type: 'rotate'; data: RotateState };

// ─── Single canvas element (memoized) ────────────────────────────────────────

interface CanvasElementProps {
  el: ElementoDecorativo;
  isSelected: boolean;
  isHidden: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeMouseDown: (e: React.MouseEvent, id: string, handle: 'nw' | 'ne' | 'se' | 'sw') => void;
  onRotateMouseDown: (e: React.MouseEvent, id: string) => void;
  onTouchStart: (e: React.TouchEvent, id: string) => void;
  onResizeTouchStart: (e: React.TouchEvent, id: string, handle: 'nw' | 'ne' | 'se' | 'sw') => void;
  onRotateTouchStart: (e: React.TouchEvent, id: string) => void;
}

const HANDLE_SIZE = 20;

const CanvasElement = memo(function CanvasElement({
  el, isSelected, isHidden, onMouseDown, onResizeMouseDown, onRotateMouseDown, onTouchStart, onResizeTouchStart, onRotateTouchStart
}: CanvasElementProps) {
  if (isHidden) return null;

  return (
    <div
      data-deco-element="true"
      className="absolute"
      style={{
        left: el.x,
        top: el.y,
        transform: `translate(-50%,-50%) rotate(${el.rotacion ?? 0}deg)`,
        transformOrigin: 'center center',
        zIndex: el.zIndex ?? 1,
        opacity: el.opacity ?? 1,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={e => { e.stopPropagation(); onMouseDown(e, el.id); }}
      onTouchStart={e => { e.stopPropagation(); onTouchStart(e, el.id); }}
      onClick={e => e.stopPropagation()}
    >
      {/* Element content */}
      <div
        style={{
          transform: `scale(${el.escala ?? 1})`,
          transformOrigin: 'center center',
          outline: isSelected ? '2px dashed #3B82F6' : 'none',
          outlineOffset: 4,
          borderRadius: 4,
        }}
      >
        {el.imageDataUri ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={el.imageDataUri.startsWith('data:image/') ? el.imageDataUri : ''}
              alt={el.etiqueta || el.tipo}
              style={{ width: el.width ?? 80, height: el.height ?? 80, objectFit: 'contain', display: 'block' }}
              draggable={false}
            />
            {el.tintColor && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: el.tintColor,
                  opacity: el.tintOpacity ?? 0,
                  mixBlendMode: 'multiply',
                  pointerEvents: 'none',
                  borderRadius: 4,
                }}
              />
            )}
          </div>
        ) : (
          <DecoElementSvg tipo={el.tipo} colores={el.colores} size={60} />
        )}
      </div>

      {el.etiqueta && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-white/90 px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
          {el.etiqueta}
        </div>
      )}

      {/* Selection handles */}
      {isSelected && (
        <>
          {/* Rotation handle */}
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg cursor-crosshair flex items-center justify-center"
            onMouseDown={e => { e.stopPropagation(); onRotateMouseDown(e, el.id); }}
            onTouchStart={e => { e.stopPropagation(); onRotateTouchStart(e, el.id); }}
            onClick={e => e.stopPropagation()}
          >
            <RotateCcw className="w-3 h-3 text-white" />
          </div>
          {/* Connector line from rotation handle */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-blue-500/50 pointer-events-none" />

          {/* Resize handles at corners */}
          {(['nw', 'ne', 'se', 'sw'] as const).map(handle => (
            <div
              key={handle}
              className="absolute bg-white border-2 border-blue-500 rounded-sm shadow"
              style={{
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                top: handle.startsWith('n') ? -HANDLE_SIZE / 2 : 'auto',
                bottom: handle.startsWith('s') ? -HANDLE_SIZE / 2 : 'auto',
                left: handle.endsWith('w') ? -HANDLE_SIZE / 2 : 'auto',
                right: handle.endsWith('e') ? -HANDLE_SIZE / 2 : 'auto',
                cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize',
              }}
              onMouseDown={e => { e.stopPropagation(); onResizeMouseDown(e, el.id, handle); }}
              onTouchStart={e => { e.stopPropagation(); onResizeTouchStart(e, el.id, handle); }}
              onClick={e => e.stopPropagation()}
            />
          ))}
        </>
      )}
    </div>
  );
});

// ─── Main DecoCanvas ─────────────────────────────────────────────────────────

interface DecoCanvasProps {
  elementos: ElementoDecorativo[];
  onChange: (elementos: ElementoDecorativo[]) => void;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  hiddenZones?: string[];
  fondoColor?: string;
  fondoImagenUrl?: string;
  showGrid?: boolean;
}

export default function DecoCanvas({
  elementos,
  onChange,
  selectedId,
  onSelectId,
  hiddenZones = [],
  fondoColor = '#F8F9FA',
  fondoImagenUrl,
  showGrid = false,
}: DecoCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<InteractionState>({ type: 'idle' });
  const [zoom, setZoom] = useState(100);
  const elementosRef = useRef(elementos);
  elementosRef.current = elementos;

  const CANVAS_W = 900;
  const CANVAS_H = 550;

  const updateElemento = useCallback((id: string, patch: Partial<ElementoDecorativo>) => {
    onChange(elementosRef.current.map(el => el.id === id ? { ...el, ...patch } : el));
  }, [onChange]);

  // ── Mouse down on element (drag) ──────────────────────────────────────────
  const handleMouseDownOnElement = useCallback((e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onSelectId(id);
    const el = elementosRef.current.find(el => el.id === id);
    if (!el) return;
    interaction.current = {
      type: 'drag',
      data: {
        elementId: id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startElX: el.x,
        startElY: el.y,
      }
    };
  }, [onSelectId]);

  // ── Mouse down on resize handle ───────────────────────────────────────────
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, id: string, handle: 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();
    onSelectId(id);
    const el = elementosRef.current.find(el => el.id === id);
    if (!el) return;
    interaction.current = {
      type: 'resize',
      data: {
        elementId: id,
        handle,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startEscala: el.escala ?? 1,
        startX: el.x,
        startY: el.y,
      }
    };
  }, [onSelectId]);

  // ── Mouse down on rotation handle ────────────────────────────────────────
  const handleRotateMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectId(id);
    const el = elementosRef.current.find(el => el.id === id);
    if (!el) return;
    const canvas = containerRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    const centerX = rect.left + el.x * scale;
    const centerY = rect.top + el.y * scale;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    interaction.current = {
      type: 'rotate',
      data: { elementId: id, centerX, centerY, startAngle, startRotacion: el.rotacion ?? 0 }
    };
  }, [zoom, onSelectId]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const state = interaction.current;
      if (state.type === 'idle') return;
      e.preventDefault();

      if (state.type === 'drag') {
        const { elementId, startMouseX, startMouseY, startElX, startElY } = state.data;
        const scale = zoom / 100;
        const dx = (e.clientX - startMouseX) / scale;
        const dy = (e.clientY - startMouseY) / scale;
        updateElemento(elementId, {
          x: Math.max(0, Math.min(CANVAS_W, startElX + dx)),
          y: Math.max(0, Math.min(CANVAS_H, startElY + dy)),
        });
      } else if (state.type === 'resize') {
        const { elementId, startMouseX, startMouseY, startEscala } = state.data;
        const scale = zoom / 100;
        const dx = (e.clientX - startMouseX) / scale;
        const dy = (e.clientY - startMouseY) / scale;
        const delta = (Math.abs(dx) > Math.abs(dy) ? dx : dy);
        updateElemento(elementId, { escala: Math.max(0.2, Math.min(5, startEscala + delta / 80)) });
      } else if (state.type === 'rotate') {
        const { elementId, centerX, centerY, startAngle, startRotacion } = state.data;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        updateElemento(elementId, { rotacion: startRotacion + (currentAngle - startAngle) });
      }
    };
    const onMouseUp = () => {
      interaction.current = { type: 'idle' };
    };
    const outerEl = outerRef.current;

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', onMouseUp);
    outerEl?.addEventListener('mouseleave', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('blur', onMouseUp);
      outerEl?.removeEventListener('mouseleave', onMouseUp);
    };
  }, [zoom, updateElemento]);

  // ── Touch events ──────────────────────────────────────────────────────────
  const handleTouchStartOnElement = useCallback((e: React.TouchEvent, id: string) => {
    e.preventDefault();
    onSelectId(id);
    const touch = e.touches[0];
    if (!touch) return;
    const el = elementosRef.current.find(el => el.id === id);
    if (!el) return;
    interaction.current = {
      type: 'drag',
      data: {
        elementId: id,
        startMouseX: touch.clientX,
        startMouseY: touch.clientY,
        startElX: el.x,
        startElY: el.y,
      }
    };
  }, [onSelectId]);

  const handleResizeTouchStart = useCallback((e: React.TouchEvent, id: string, handle: 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();
    onSelectId(id);
    const touch = e.touches[0];
    if (!touch) return;
    const el = elementosRef.current.find(el => el.id === id);
    if (!el) return;
    interaction.current = {
      type: 'resize',
      data: {
        elementId: id, handle,
        startMouseX: touch.clientX, startMouseY: touch.clientY,
        startEscala: el.escala ?? 1, startX: el.x, startY: el.y,
      }
    };
  }, [onSelectId]);

  const handleRotateTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectId(id);
    const touch = e.touches[0];
    if (!touch) return;
    const el = elementosRef.current.find(el => el.id === id);
    if (!el) return;
    const canvas = containerRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    const centerX = rect.left + el.x * scale;
    const centerY = rect.top + el.y * scale;
    const startAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
    interaction.current = {
      type: 'rotate',
      data: { elementId: id, centerX, centerY, startAngle, startRotacion: el.rotacion ?? 0 }
    };
  }, [zoom, onSelectId]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const state = interaction.current;
    if (state.type === 'idle') return;
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    if (state.type === 'drag') {
      const { elementId, startMouseX, startMouseY, startElX, startElY } = state.data;
      const scale = zoom / 100;
      const dx = (touch.clientX - startMouseX) / scale;
      const dy = (touch.clientY - startMouseY) / scale;
      updateElemento(elementId, {
        x: Math.max(0, Math.min(CANVAS_W, startElX + dx)),
        y: Math.max(0, Math.min(CANVAS_H, startElY + dy)),
      });
    } else if (state.type === 'resize') {
      const { elementId, startMouseX, startMouseY, startEscala } = state.data;
      const scale = zoom / 100;
      const dx = (touch.clientX - startMouseX) / scale;
      const dy = (touch.clientY - startMouseY) / scale;
      const delta = (Math.abs(dx) > Math.abs(dy) ? dx : dy);
      const newEscala = Math.max(0.2, Math.min(5, startEscala + delta / 80));
      updateElemento(elementId, { escala: newEscala });
    } else if (state.type === 'rotate') {
      const { elementId, centerX, centerY, startAngle, startRotacion } = state.data;
      const currentAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
      const diff = currentAngle - startAngle;
      updateElemento(elementId, { rotacion: startRotacion + diff });
    }
  }, [zoom, updateElemento]);

  const handleTouchEnd = useCallback(() => {
    interaction.current = { type: 'idle' };
  }, []);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => handleTouchMove(e);
    const onTouchEnd = () => handleTouchEnd();
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  // ── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Only if not focused on an input
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        onChange(elementosRef.current.filter(el => el.id !== selectedId));
        onSelectId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onChange, onSelectId]);

  const zoomIn = () => setZoom(z => Math.min(200, z + 10));
  const zoomOut = () => setZoom(z => Math.max(30, z - 10));
  const resetZoom = () => setZoom(100);

  const isElementHidden = (el: ElementoDecorativo) => {
    return hiddenZones.includes(el.zona ?? '');
  };

  const safeFondoColor = fondoColor || '#FFFFFF';
  const gridLayers = [
    'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px)',
    'linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)',
  ];
  const hasBackgroundImage = Boolean(fondoImagenUrl);
  const hasGrid = showGrid;
  const backgroundLayers = [
    ...(hasBackgroundImage ? [`url(${fondoImagenUrl})`] : []),
    ...(hasGrid ? gridLayers : []),
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={zoomOut} disabled={zoom <= 30}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <input
          type="range" min={30} max={200} step={5} value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="flex-1 h-2 accent-primary cursor-pointer"
        />
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={zoomIn} disabled={zoom >= 200}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <span className="text-xs font-bold text-slate-500 w-12 text-center">{zoom}%</span>
        <Button type="button" variant="ghost" size="sm" className="text-xs h-8" onClick={resetZoom}>
          <Maximize2 className="w-3.5 h-3.5 mr-1" /> Ajustar
        </Button>
      </div>

      {/* Canvas container */}
      <div
        ref={outerRef}
        className="overflow-auto rounded-2xl border border-slate-200 bg-slate-100"
        style={{ maxHeight: 620 }}
      >
        <div style={{ transformOrigin: 'top left', transform: `scale(${zoom / 100})`, width: CANVAS_W, height: CANVAS_H }}>
          <div
            ref={containerRef}
            data-deco-canvas
            className="relative select-none overflow-hidden"
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                backgroundColor: safeFondoColor,
                backgroundImage: backgroundLayers.join(', ') || undefined,
                backgroundSize: hasBackgroundImage && hasGrid
                  ? 'cover, 40px 40px, 40px 40px'
                  : hasBackgroundImage
                    ? 'cover'
                    : hasGrid
                      ? '40px 40px, 40px 40px'
                      : undefined,
                backgroundPosition: hasBackgroundImage && hasGrid
                  ? 'center, 0 0, 0 0'
                  : hasBackgroundImage
                    ? 'center'
                    : hasGrid
                      ? '0 0, 0 0'
                      : undefined,
                backgroundRepeat: hasBackgroundImage && hasGrid
                  ? 'no-repeat, repeat, repeat'
                  : hasBackgroundImage
                    ? 'no-repeat'
                    : hasGrid
                      ? 'repeat, repeat'
                      : undefined,
                cursor: 'default',
              }}
            onClick={e => {
              const target = e.target as HTMLElement;
              if (target.closest('[data-deco-element="true"]')) return;
              e.stopPropagation();
              onSelectId(null);
            }}
          >
            {elementos.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center opacity-30">
                  <Grid className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-sm text-slate-500 font-medium">Hacé clic en un elemento de la biblioteca para agregarlo</p>
                  <p className="text-xs text-slate-400 mt-1">Podés arrastrar, girar y cambiar el tamaño</p>
                </div>
              </div>
            )}
            {elementos.map(el => (
              <CanvasElement
                key={el.id}
                el={el}
                isSelected={selectedId === el.id}
                isHidden={isElementHidden(el)}
                onMouseDown={handleMouseDownOnElement}
                onResizeMouseDown={handleResizeMouseDown}
                onRotateMouseDown={handleRotateMouseDown}
                onTouchStart={handleTouchStartOnElement}
                onResizeTouchStart={handleResizeTouchStart}
                onRotateTouchStart={handleRotateTouchStart}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
