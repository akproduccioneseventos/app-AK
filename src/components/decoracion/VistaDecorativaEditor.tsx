'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Download, Save, Loader2, ImageIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { ElementoDecorativo, ColorPalette } from '@/types/fiesta';
import { UploadButton } from '@/components/invitacion/edit/UploadButton';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

type TipoElemento = ElementoDecorativo['tipo'];

interface VistaDecorativaData {
  elementos: ElementoDecorativo[];
  fondoColor?: string;
  fondoImagenUrl?: string;
}

interface Props {
  vistaDecorativa: VistaDecorativaData;
  paletaColores: ColorPalette;
  fiestaId: string;
  onSave: (data: VistaDecorativaData) => Promise<void>;
  isSaving?: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Catalogue of available decoration elements
// ────────────────────────────────────────────────────────────────────────────

const TIPOS_ELEMENTOS: { tipo: TipoElemento; emoji: string; label: string; maxColores: number }[] = [
  { tipo: 'globo',        emoji: '🎈', label: 'Globo',          maxColores: 1 },
  { tipo: 'globosMacizos',emoji: '🫧', label: 'Racimo Globos',  maxColores: 3 },
  { tipo: 'flor',         emoji: '🌸', label: 'Flor',           maxColores: 2 },
  { tipo: 'centroMesa',   emoji: '💐', label: 'Centro Mesa',    maxColores: 2 },
  { tipo: 'arco',         emoji: '🌈', label: 'Arco Globos',    maxColores: 3 },
  { tipo: 'lazo',         emoji: '🎀', label: 'Lazo',           maxColores: 1 },
  { tipo: 'candelabro',   emoji: '🕯️', label: 'Candelabro',    maxColores: 1 },
  { tipo: 'mesaTorta',    emoji: '🎂', label: 'Mesa Torta',     maxColores: 1 },
  { tipo: 'tela',         emoji: '🪩', label: 'Tela/Cortina',   maxColores: 1 },
];

// ────────────────────────────────────────────────────────────────────────────
// SVG renderers for each element type
// ────────────────────────────────────────────────────────────────────────────

function GloboSvg({ colores }: { colores: string[] }) {
  const c = colores[0] || '#FF6B6B';
  return (
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="28" rx="26" ry="28" fill={c} />
      <ellipse cx="22" cy="16" rx="8" ry="6" fill="rgba(255,255,255,0.35)" />
      <path d="M30 56 C28 62 26 68 30 72 C34 68 32 62 30 56Z" fill={c} />
      <line x1="30" y1="56" x2="30" y2="72" stroke="#888" strokeWidth="1.5" />
      <circle cx="30" cy="57" r="2" fill="#888" />
    </svg>
  );
}

function GlobosMacizosSvg({ colores }: { colores: string[] }) {
  const cs = [colores[0] || '#FF6B6B', colores[1] || '#6BC5FF', colores[2] || '#FFDD57'];
  const positions = [
    { cx: 18, cy: 38 }, { cx: 38, cy: 38 }, { cx: 28, cy: 24 },
    { cx: 12, cy: 24 }, { cx: 44, cy: 24 }, { cx: 28, cy: 48 },
  ];
  return (
    <svg width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {positions.map((p, i) => (
        <g key={i}>
          <ellipse cx={p.cx} cy={p.cy} rx="11" ry="12" fill={cs[i % cs.length]} />
          <ellipse cx={p.cx - 3} cy={p.cy - 4} rx="3" ry="2.5" fill="rgba(255,255,255,0.35)" />
        </g>
      ))}
      <line x1="28" y1="60" x2="28" y2="65" stroke="#888" strokeWidth="2" />
    </svg>
  );
}

function FlorSvg({ colores }: { colores: string[] }) {
  const petal = colores[0] || '#FF9ECA';
  const center = colores[1] || '#FFD700';
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {angles.map((a, i) => {
        const rad = (a * Math.PI) / 180;
        const cx = 30 + 14 * Math.cos(rad);
        const cy = 30 + 14 * Math.sin(rad);
        return <ellipse key={i} cx={cx} cy={cy} rx="9" ry="6" fill={petal} transform={`rotate(${a},${cx},${cy})`} />;
      })}
      <circle cx="30" cy="30" r="9" fill={center} />
      <circle cx="27" cy="27" r="3" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

function CentroMesaSvg({ colores }: { colores: string[] }) {
  const c1 = colores[0] || '#FF9ECA';
  const c2 = colores[1] || '#A8E6CF';
  return (
    <svg width="60" height="72" viewBox="0 0 60 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="18" rx="10" ry="10" fill={c1} />
      <ellipse cx="16" cy="26" rx="8" ry="8" fill={c2} />
      <ellipse cx="44" cy="26" rx="8" ry="8" fill={c1} />
      <ellipse cx="22" cy="36" rx="7" ry="7" fill={c2} />
      <ellipse cx="38" cy="36" rx="7" ry="7" fill={c1} />
      <path d="M20 46 Q30 52 40 46 L42 56 Q30 62 18 56Z" fill="#C8A882" />
    </svg>
  );
}

function ArcoSvg({ colores }: { colores: string[] }) {
  const cs = [colores[0] || '#FF6B6B', colores[1] || '#6BC5FF', colores[2] || '#FFDD57'];
  const ballsOnArc = 14;
  return (
    <svg width="100" height="60" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {Array.from({ length: ballsOnArc }).map((_, i) => {
        const t = i / (ballsOnArc - 1);
        const angle = Math.PI * t;
        const cx = 10 + 80 * t;
        const cy = 55 - 46 * Math.sin(angle);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="7" fill={cs[i % cs.length]} />
            <circle cx={cx - 2} cy={cy - 2} r="2.5" fill="rgba(255,255,255,0.4)" />
          </g>
        );
      })}
    </svg>
  );
}

function LazoSvg({ colores }: { colores: string[] }) {
  const c = colores[0] || '#FF69B4';
  return (
    <svg width="64" height="52" viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 26 C14 10 2 4 4 18 C6 28 20 30 32 26Z" fill={c} />
      <path d="M32 26 C50 10 62 4 60 18 C58 28 44 30 32 26Z" fill={c} />
      <path d="M32 26 C14 42 2 48 4 34 C6 24 20 22 32 26Z" fill={c} opacity="0.8" />
      <path d="M32 26 C50 42 62 48 60 34 C58 24 44 22 32 26Z" fill={c} opacity="0.8" />
      <circle cx="32" cy="26" r="5" fill="rgba(255,255,255,0.6)" />
      <path d="M29 26 L32 38 L35 26Z" fill={c} opacity="0.9" />
    </svg>
  );
}

function CandelabroSvg({ colores }: { colores: string[] }) {
  const c = colores[0] || '#DAA520';
  return (
    <svg width="36" height="80" viewBox="0 0 36 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="52" width="6" height="22" fill={c} />
      <path d="M6 52 Q18 48 30 52 L28 56 Q18 52 8 56Z" fill={c} />
      <circle cx="18" cy="50" r="5" fill={c} />
      <rect x="14" y="30" width="8" height="20" rx="3" fill="#FFF8DC" />
      <ellipse cx="18" cy="30" rx="4" ry="6" fill="#FFA500" opacity="0.9" />
      <ellipse cx="18" cy="26" rx="2" ry="4" fill="#FFD700" />
    </svg>
  );
}

function MesaTortaSvg({ colores }: { colores: string[] }) {
  const c = colores[0] || '#F8F0E3';
  return (
    <svg width="80" height="76" viewBox="0 0 80 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="38" width="68" height="8" rx="2" fill="#8B7355" />
      <rect x="10" y="46" width="6" height="24" rx="2" fill="#8B7355" />
      <rect x="64" y="46" width="6" height="24" rx="2" fill="#8B7355" />
      <path d="M8 38 Q40 28 72 38 L72 46 Q40 36 8 46Z" fill={c} />
      <rect x="22" y="14" width="36" height="24" rx="3" fill="#FFF" stroke="#E0D0C0" strokeWidth="1" />
      <rect x="26" y="20" width="28" height="8" rx="2" fill="#FFB6C1" />
      <line x1="40" y1="10" x2="40" y2="14" stroke="#888" strokeWidth="1.5" />
      <circle cx="40" cy="9" r="3" fill="#FF6B6B" />
    </svg>
  );
}

function TelaSvg({ colores }: { colores: string[] }) {
  const c = colores[0] || '#B0C4DE';
  return (
    <svg width="44" height="100" viewBox="0 0 44 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 0 Q22 10 40 0 L44 100 Q22 90 0 100Z"
        fill={c}
        opacity="0.85"
      />
      <path
        d="M4 0 Q12 20 8 40 Q4 60 10 80 Q14 92 4 100"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M40 0 Q32 20 36 40 Q40 60 34 80 Q30 92 40 100"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
        fill="none"
      />
      <rect x="0" y="0" width="44" height="6" rx="2" fill="rgba(0,0,0,0.2)" />
    </svg>
  );
}

function ElementoSvg({ tipo, colores }: { tipo: TipoElemento; colores: string[] }) {
  switch (tipo) {
    case 'globo':        return <GloboSvg colores={colores} />;
    case 'globosMacizos':return <GlobosMacizosSvg colores={colores} />;
    case 'flor':         return <FlorSvg colores={colores} />;
    case 'centroMesa':   return <CentroMesaSvg colores={colores} />;
    case 'arco':         return <ArcoSvg colores={colores} />;
    case 'lazo':         return <LazoSvg colores={colores} />;
    case 'candelabro':   return <CandelabroSvg colores={colores} />;
    case 'mesaTorta':    return <MesaTortaSvg colores={colores} />;
    case 'tela':         return <TelaSvg colores={colores} />;
    default:             return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────────────

export default function VistaDecorativaEditor({
  vistaDecorativa,
  paletaColores,
  fiestaId,
  onSave,
  isSaving = false,
}: Props) {
  const [elementos, setElementos] = useState<ElementoDecorativo[]>(vistaDecorativa.elementos ?? []);
  const [fondoColor, setFondoColor] = useState(vistaDecorativa.fondoColor ?? '#f0f0f0');
  const [fondoImagenUrl, setFondoImagenUrl] = useState(vistaDecorativa.fondoImagenUrl ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100); // percentage: 50-200

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string; startX: number; startY: number; elemX: number; elemY: number } | null>(null);

  // Keep local state in sync if parent data changes (e.g. on load)
  useEffect(() => {
    setElementos(vistaDecorativa.elementos ?? []);
    setFondoColor(vistaDecorativa.fondoColor ?? '#f0f0f0');
    setFondoImagenUrl(vistaDecorativa.fondoImagenUrl ?? '');
  }, [vistaDecorativa]);

  const selectedEl = elementos.find(e => e.id === selectedId) ?? null;
  const maxColores = TIPOS_ELEMENTOS.find(t => t.tipo === selectedEl?.tipo)?.maxColores ?? 1;

  // ──── Canvas drag logic ────────────────────────────────────────────────────

  const handleMouseDownOnElement = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedId(id);
      const el = elementos.find(el => el.id === id);
      if (!el) return;
      draggingRef.current = { id, startX: e.clientX, startY: e.clientY, elemX: el.x, elemY: el.y };
    },
    [elementos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((e.clientX - draggingRef.current.startX) / rect.width) * 100;
      const dy = ((e.clientY - draggingRef.current.startY) / rect.height) * 100;
      const newX = Math.min(100, Math.max(0, draggingRef.current.elemX + dx));
      const newY = Math.min(100, Math.max(0, draggingRef.current.elemY + dy));
      setElementos(prev => prev.map(el => el.id === draggingRef.current!.id ? { ...el, x: newX, y: newY } : el));
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  // ──── Element operations ───────────────────────────────────────────────────

  const agregarElemento = useCallback((tipo: TipoElemento) => {
    const defaultColors = [paletaColores.primary, paletaColores.secondary, paletaColores.accent];
    const maxC = TIPOS_ELEMENTOS.find(t => t.tipo === tipo)?.maxColores ?? 1;
    const colores = defaultColors.slice(0, maxC);
    const el: ElementoDecorativo = {
      id: crypto.randomUUID(),
      tipo,
      x: 10 + Math.random() * 60,
      y: 10 + Math.random() * 60,
      escala: 1,
      colores,
    };
    setElementos(prev => [...prev, el]);
    setSelectedId(el.id);
  }, [paletaColores]);

  const eliminarElemento = useCallback((id: string) => {
    setElementos(prev => prev.filter(e => e.id !== id));
    setSelectedId(null);
  }, []);

  const updateElemento = useCallback(<K extends keyof ElementoDecorativo>(id: string, field: K, value: ElementoDecorativo[K]) => {
    setElementos(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }, []);

  const updateColor = useCallback((idx: number, color: string) => {
    if (!selectedEl) return;
    const newColores = [...selectedEl.colores];
    newColores[idx] = color;
    updateElemento(selectedEl.id, 'colores', newColores);
  }, [selectedEl, updateElemento]);

  const limpiarTodo = useCallback(() => {
    setElementos([]);
    setSelectedId(null);
  }, []);

  // ──── Save ─────────────────────────────────────────────────────────────────

  const handleGuardar = useCallback(async () => {
    await onSave({ elementos, fondoColor, fondoImagenUrl: fondoImagenUrl || undefined });
  }, [onSave, elementos, fondoColor, fondoImagenUrl]);

  // ──── Export ───────────────────────────────────────────────────────────────

  const handleExportar = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: fondoColor,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `decoracion-${fiestaId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error al exportar:', err);
    } finally {
      setIsExporting(false);
    }
  }, [fondoColor, fiestaId]);

  // ──── Zoom ─────────────────────────────────────────────────────────────────

  const zoomIn = useCallback(() => setZoomLevel(z => Math.min(200, z + 10)), []);
  const zoomOut = useCallback(() => setZoomLevel(z => Math.max(50, z - 10)), []);
  const fitToScreen = useCallback(() => setZoomLevel(100), []);

  // ──── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border">
        {TIPOS_ELEMENTOS.map(({ tipo, emoji, label }) => (
          <Button
            key={tipo}
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-sm"
            onClick={() => agregarElemento(tipo)}
          >
            <span role="img" aria-label={label}>{emoji}</span>
            {label}
          </Button>
        ))}
      </div>

      {/* Main area */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Canvas with zoom */}
        <div className="flex-1 space-y-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-xl border">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={zoomOut} disabled={zoomLevel <= 50} title="Reducir zoom">
              <span className="text-base font-bold">−</span>
            </Button>
            <input
              type="range"
              min={50}
              max={200}
              step={10}
              value={zoomLevel}
              onChange={e => setZoomLevel(Number(e.target.value))}
              className="flex-1 h-2 accent-primary cursor-pointer"
            />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={zoomIn} disabled={zoomLevel >= 200} title="Aumentar zoom">
              <span className="text-base font-bold">+</span>
            </Button>
            <span className="text-xs font-bold text-muted-foreground w-12 text-center shrink-0">{zoomLevel}%</span>
            <Button type="button" variant="ghost" size="sm" className="text-xs h-8 shrink-0" onClick={fitToScreen}>
              Ajustar
            </Button>
          </div>

          {/* Canvas container */}
          <div ref={canvasContainerRef} className="overflow-auto rounded-xl border border-muted/40 bg-muted/10" style={{ maxHeight: 600 }}>
            <div style={{ transformOrigin: 'top left', transform: `scale(${zoomLevel / 100})`, width: 800, height: 500 }}>
              <div
                id="vista-decorativa-canvas"
                ref={canvasRef}
                className="relative rounded-xl border-2 border-dashed border-muted-foreground/30 overflow-hidden select-none"
                style={{
                  width: 800,
                  height: 500,
                  minWidth: 800,
                  backgroundColor: fondoColor,
                  backgroundImage: fondoImagenUrl ? `url(${fondoImagenUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  cursor: draggingRef.current ? 'grabbing' : 'default',
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={() => setSelectedId(null)}
              >
                {elementos.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground/50 text-sm text-center">
                      Hacé clic en un elemento de la barra para agregarlo al diseño.<br />
                      Arrastrá los elementos para posicionarlos.
                    </p>
                  </div>
                )}
                {elementos.map(el => (
                  <div
                    key={el.id}
                    className="absolute"
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: `translate(-50%, -50%) rotate(${el.rotacion ?? 0}deg) scale(${el.escala})`,
                      cursor: 'grab',
                      outline: selectedId === el.id ? '2px dashed #3B82F6' : undefined,
                      outlineOffset: 4,
                      borderRadius: 4,
                      zIndex: selectedId === el.id ? 10 : 1,
                    }}
                    onMouseDown={e => handleMouseDownOnElement(e, el.id)}
                  >
                    <ElementoSvg tipo={el.tipo} colores={el.colores} />
                    {el.etiqueta && (
                      <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full text-[10px] font-medium bg-white/80 px-1 rounded shadow"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {el.etiqueta}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Properties panel */}
        <div className="xl:w-72 flex-shrink-0">
          <AnimatePresence mode="wait">
            {selectedEl ? (
              <motion.div
                key="props"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 p-4 border rounded-xl bg-card shadow-sm"
              >
                <h3 className="font-bold text-base">Propiedades</h3>

                {/* Colors */}
                {Array.from({ length: maxColores }).map((_, idx) => (
                  <div key={idx} className="space-y-1">
                    <Label className="text-xs">
                      {idx === 0 ? 'Color principal' : idx === 1 ? 'Color secundario' : 'Color terciario'}
                    </Label>
                    <div className="flex gap-2 items-center flex-wrap">
                      {/* Quick palette buttons */}
                      {[paletaColores.primary, paletaColores.secondary, paletaColores.accent].map((c, pi) => (
                        <button
                          key={pi}
                          type="button"
                          title={`Color paleta ${pi + 1}`}
                          className="w-7 h-7 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                          style={{ background: c, outlineOffset: 2, outline: selectedEl.colores[idx] === c ? `2px solid #3B82F6` : 'none' }}
                          onClick={() => updateColor(idx, c)}
                        />
                      ))}
                      {/* Free picker */}
                      <input
                        type="color"
                        value={selectedEl.colores[idx] ?? paletaColores.primary}
                        onChange={e => updateColor(idx, e.target.value)}
                        className="w-8 h-8 cursor-pointer rounded border p-0.5"
                        title="Color personalizado"
                      />
                    </div>
                  </div>
                ))}

                {/* Size */}
                <div className="space-y-1">
                  <Label className="text-xs">Tamaño</Label>
                  <div className="flex gap-1">
                    {([['S', 0.7], ['M', 1], ['L', 1.5], ['XL', 2]] as [string, number][]).map(([lbl, val]) => (
                      <Button
                        key={lbl}
                        type="button"
                        size="sm"
                        variant={selectedEl.escala === val ? 'default' : 'outline'}
                        className="flex-1 text-xs px-1"
                        onClick={() => updateElemento(selectedEl.id, 'escala', val)}
                      >
                        {lbl}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Label */}
                <div className="space-y-1">
                  <Label className="text-xs">Etiqueta (opcional)</Label>
                  <Input
                    value={selectedEl.etiqueta ?? ''}
                    onChange={e => updateElemento(selectedEl.id, 'etiqueta', e.target.value)}
                    placeholder="Ej: Entrada, Mesa 1..."
                    className="h-8 text-sm"
                  />
                </div>

                {/* Delete */}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => eliminarElemento(selectedEl.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="global"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 p-4 border rounded-xl bg-card shadow-sm"
              >
                <h3 className="font-bold text-base">Fondo del Canvas</h3>
                <div className="space-y-1">
                  <Label className="text-xs">Color de fondo</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fondoColor}
                      onChange={e => setFondoColor(e.target.value)}
                      className="w-10 h-10 cursor-pointer rounded border p-0.5"
                    />
                    <span className="text-xs text-muted-foreground">{fondoColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Imagen de fondo (foto del salón)</Label>
                  <UploadButton
                    currentUrl={fondoImagenUrl || undefined}
                    onUrlChange={url => setFondoImagenUrl(url)}
                    fiestaId={fiestaId}
                    accept="image/*"
                  />
                  {fondoImagenUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive mt-1"
                      onClick={() => setFondoImagenUrl('')}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Quitar imagen
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Hacé clic en un elemento del canvas para editar sus propiedades.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button type="button" onClick={handleGuardar} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleExportar}
          disabled={isExporting || elementos.length === 0}
          className="gap-2"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isExporting ? 'Exportando...' : 'Exportar como PNG'}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" className="gap-2 text-destructive hover:text-destructive" disabled={elementos.length === 0}>
              <Trash2 className="w-4 h-4" /> Limpiar todo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Limpiar el diseño?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminarán todos los elementos del canvas. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={limpiarTodo} className="bg-destructive hover:bg-destructive/90">
                Limpiar todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
