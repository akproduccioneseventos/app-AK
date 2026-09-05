'use client';

import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Trash2 } from 'lucide-react';

export interface LienzoDibujoHandles {
  clear: () => void;
  mergeToCanvas: (destCanvas: HTMLCanvasElement) => void;
  getCanvas: () => HTMLCanvasElement | null;
  hasDrawing: () => boolean;
}

export interface LienzoDibujoProps {
  width?: number;
  height?: number;
  className?: string;
  defaultColor?: string;
  lineWidth?: number;
  onDrawingChange?: (hasDrawn: boolean) => void;
}

const PALETA_COLORES = [
  { label: 'Blanco', valor: '#ffffff' },
  { label: 'Dorado', valor: '#eab308' },
  { label: 'Rosa Neón', valor: '#ec4899' },
  { label: 'Cian Neón', valor: '#06b6d4' },
  { label: 'Verde Neón', valor: '#22c55e' },
  { label: 'Púrpura', valor: '#a855f7' },
];

export const LienzoDibujoCompartido = forwardRef<LienzoDibujoHandles, LienzoDibujoProps>(
  ({ width, height, className = '', defaultColor = '#ffffff', lineWidth = 12, onDrawingChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const hasDrawnRef = useRef(false);
    const [color, setColor] = useState(defaultColor);

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawnRef.current = false;
        onDrawingChange?.(false);
      },
      mergeToCanvas: (destCanvas: HTMLCanvasElement) => {
        const canvas = canvasRef.current;
        if (!canvas || !destCanvas) return;
        const destCtx = destCanvas.getContext('2d');
        if (!destCtx) return;
        destCtx.drawImage(canvas, 0, 0, destCanvas.width, destCanvas.height);
      },
      getCanvas: () => canvasRef.current,
      hasDrawing: () => hasDrawnRef.current,
    }));

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      ctx.beginPath();
      ctx.moveTo(x, y);
      isDrawingRef.current = true;
      hasDrawnRef.current = true;
      onDrawingChange?.(true);
    };

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const endDrawing = () => {
      isDrawingRef.current = false;
    };

    return (
      <div className={`relative ${className}`}>
        <canvas
          ref={canvasRef}
          width={width || 720}
          height={height || 1080}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={endDrawing}
          onPointerCancel={endDrawing}
          className="absolute inset-0 z-20 h-full w-full touch-none cursor-crosshair"
        />
        {/* Controles flotantes de pincel */}
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-zinc-950/80 px-3 py-1.5 backdrop-blur-md">
          {PALETA_COLORES.map((c) => (
            <button
              key={c.valor}
              type="button"
              onClick={() => setColor(c.valor)}
              aria-label={c.label}
              className={`h-6 w-6 rounded-full border-2 transition-transform ${
                color === c.valor ? 'scale-110 border-white shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.valor }}
            />
          ))}
          <div className="h-4 w-px bg-white/20 mx-1" />
          <button
            type="button"
            onClick={() => {
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
                hasDrawnRef.current = false;
                onDrawingChange?.(false);
              }
            }}
            title="Borrar firma o dibujo"
            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-red-400 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }
);

LienzoDibujoCompartido.displayName = 'LienzoDibujoCompartido';
