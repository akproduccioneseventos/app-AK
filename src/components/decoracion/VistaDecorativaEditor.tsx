'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trash2, Download, Save, Loader2, Copy,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
  Undo2, Redo2, Lock, ImagePlus, Upload,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ElementoDecorativo, ColorPalette } from '@/types/fiesta';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

interface ElementoInfo {
  tipo: TipoElemento;
  emoji: string;
  label: string;
  maxColores: number;
  categoria: string;
}

const CATEGORIAS_ELEMENTOS: { id: string; label: string; emoji: string }[] = [
  { id: 'globos',      label: 'Globos',        emoji: '🎈' },
  { id: 'flores',      label: 'Flores',         emoji: '🌸' },
  { id: 'mobiliario',  label: 'Mobiliario',     emoji: '🪑' },
  { id: 'estructuras', label: 'Estructuras',    emoji: '🏛' },
  { id: 'luces',       label: 'Luces',          emoji: '💡' },
  { id: 'senaletica',  label: 'Señalética',     emoji: '🪧' },
  { id: 'inflables',   label: 'Inflables',      emoji: '🎠' },
  { id: 'custom',      label: 'Personalizado',  emoji: '🖼' },
];

const TIPOS_ELEMENTOS: ElementoInfo[] = [
  { tipo: 'globo',         emoji: '🎈', label: 'Globo',           maxColores: 1, categoria: 'globos' },
  { tipo: 'globosMacizos', emoji: '��', label: 'Racimo Globos',   maxColores: 3, categoria: 'globos' },
  { tipo: 'arco',          emoji: '🌈', label: 'Arco de Globos',  maxColores: 3, categoria: 'globos' },
  { tipo: 'flor',          emoji: '🌸', label: 'Flor',            maxColores: 2, categoria: 'flores' },
  { tipo: 'centroMesa',    emoji: '💐', label: 'Centro de Mesa',  maxColores: 2, categoria: 'flores' },
  { tipo: 'mesa',          emoji: '⭕', label: 'Mesa',             maxColores: 1, categoria: 'mobiliario' },
  { tipo: 'silla',         emoji: '🪑', label: 'Silla',           maxColores: 1, categoria: 'mobiliario' },
  { tipo: 'mesaTorta',     emoji: '🎂', label: 'Mesa de Torta',   maxColores: 1, categoria: 'mobiliario' },
  { tipo: 'columna',       emoji: '🏛', label: 'Columna',         maxColores: 1, categoria: 'estructuras' },
  { tipo: 'pista',         emoji: '💃', label: 'Pista de Baile',  maxColores: 2, categoria: 'estructuras' },
  { tipo: 'tela',          emoji: '🎭', label: 'Tela / Cortina',  maxColores: 1, categoria: 'estructuras' },
  { tipo: 'lazo',          emoji: '🎀', label: 'Lazo / Moño',     maxColores: 1, categoria: 'estructuras' },
  { tipo: 'candelabro',    emoji: '🕯', label: 'Candelabro',      maxColores: 1, categoria: 'luces' },
  { tipo: 'luz',           emoji: '💡', label: 'Luz / Spot',      maxColores: 1, categoria: 'luces' },
  { tipo: 'cartel',        emoji: '🪧', label: 'Cartel',          maxColores: 2, categoria: 'senaletica' },
  { tipo: 'inflable',      emoji: '🎠', label: 'Inflable',        maxColores: 2, categoria: 'inflables' },
  { tipo: 'imagen',        emoji: '🖼', label: 'Imagen Propia',   maxColores: 0, categoria: 'custom' },
];


// ─────────────────────────────────────────────
// SVG Renderers
// ─────────────────────────────────────────────

function GloboSvg({ colores }: { colores: string[] }) {
  const c = colores[0] || '#FF6B6B';
  return (
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
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
    <svg width="60" height="70" viewBox="0 0 60 70" fill="none">
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
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
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
    <svg width="60" height="72" viewBox="0 0 60 72" fill="none">
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
  const n = 14;
  return (
    <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
      {Array.from({ length: n }).map((_, i) => {
        const t = i / (n - 1);
        const cx = 10 + 80 * t;
        const cy = 55 - 46 * Math.sin(Math.PI * t);
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
    <svg width="64" height="52" viewBox="0 0 64 52" fill="none">
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
    <svg width="36" height="80" viewBox="0 0 36 80" fill="none">
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
    <svg width="80" height="76" viewBox="0 0 80 76" fill="none">
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
    <svg width="44" height="100" viewBox="0 0 44 100" fill="none">
      <path d="M4 0 Q22 10 40 0 L44 100 Q22 90 0 100Z" fill={c} opacity="0.85" />
      <path d="M4 0 Q12 20 8 40 Q4 60 10 80 Q14 92 4 100" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
      <path d="M40 0 Q32 20 36 40 Q40 60 34 80 Q30 92 40 100" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
      <rect x="0" y="0" width="44" height="6" rx="2" fill="rgba(0,0,0,0.2)" />
    </svg>
  );
}

function MesaSvg({ colores }: { colores: string[] }) {
  const c = colores[0] || '#A0886A';
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="34" fill={c} />
      <circle cx="40" cy="40" r="30" fill="rgba(255,255,255,0.1)" />
      <circle cx="40" cy="40" r="22" fill={c} opacity="0.6" />
      <circle cx="32" cy="32" r="5" fill="rgba(255,255,255,0.18)" />
    </svg>
  );
}

function SillaSvg({ colores }: { colores: string[] }) {
  const c = colores[0] || '#5C4033';
  return (
    <svg width="44" height="60" viewBox="0 0 44 60" fill="none">
      <rect x="4" y="4" width="36" height="6" rx="2" fill={c} />
      <rect x="8" y="10" width="28" height="3" rx="1" fill={c} opacity="0.5" />
      <rect x="6" y="24" width="32" height="16" rx="3" fill={c} />
      <rect x="6" y="40" width="6" height="18" rx="2" fill={c} />
      <rect x="32" y="40" width="6" height="18" rx="2" fill={c} />
      <rect x="6" y="20" width="4" height="4" rx="1" fill={c} opacity="0.8" />
      <rect x="34" y="20" width="4" height="4" rx="1" fill={c} opacity="0.8" />
    </svg>
  );
}

function PistaSvg({ colores }: { colores: string[] }) {
  const c1 = colores[0] || '#1a1a2e';
  const c2 = colores[1] || '#e94560';
  const size = 16; const cols = 6; const rows = 4;
  return (
    <svg width={cols * size} height={rows * size} viewBox={`0 0 ${cols * size} ${rows * size}`} fill="none">
      {Array.from({ length: rows }).flatMap((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect key={`${r}-${c}`} x={c * size} y={r * size} width={size} height={size}
            fill={(r + c) % 2 === 0 ? c1 : c2} />
        ))
      )}
      <rect x="0" y="0" width={cols * size} height={rows * size} fill="none"
        stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
    </svg>
  );
}

function ColumnaSvg({ colores }: { colores: string[] }) {
  const c = colores[0] || '#C0C0C0';
  return (
    <svg width="32" height="100" viewBox="0 0 32 100" fill="none">
      <rect x="4" y="0" width="24" height="8" rx="2" fill={c} />
      <rect x="8" y="8" width="16" height="80" fill={c} opacity="0.9" />
      <rect x="6" y="8" width="4" height="80" fill="rgba(255,255,255,0.2)" />
      <rect x="4" y="88" width="24" height="8" rx="2" fill={c} />
    </svg>
  );
}

function LuzSvg({ colores }: { colores: string[] }) {
  const c = colores[0] || '#FFD700';
  return (
    <svg width="50" height="70" viewBox="0 0 50 70" fill="none">
      <circle cx="25" cy="12" r="10" fill={c} opacity="0.9" />
      <circle cx="25" cy="12" r="6" fill="#FFF" opacity="0.8" />
      <path d="M14 22 L5 60 L45 60 L36 22Z" fill={c} opacity="0.3" />
      <rect x="22" y="0" width="6" height="4" rx="1" fill="#888" />
    </svg>
  );
}

function CartelSvg({ colores }: { colores: string[] }) {
  const bg = colores[0] || '#FFFFFF';
  const bd = colores[1] || '#4A4A4A';
  return (
    <svg width="90" height="70" viewBox="0 0 90 70" fill="none">
      <rect x="2" y="2" width="86" height="50" rx="6" fill={bg} stroke={bd} strokeWidth="3" />
      <rect x="10" y="14" width="70" height="6" rx="3" fill={bd} opacity="0.5" />
      <rect x="20" y="26" width="50" height="5" rx="2.5" fill={bd} opacity="0.3" />
      <rect x="30" y="37" width="30" height="5" rx="2.5" fill={bd} opacity="0.3" />
      <line x1="45" y1="52" x2="45" y2="66" stroke={bd} strokeWidth="3" />
      <rect x="35" y="63" width="20" height="5" rx="2" fill={bd} opacity="0.6" />
    </svg>
  );
}

function InflableSvg({ colores }: { colores: string[] }) {
  const c1 = colores[0] || '#FF6B6B';
  const c2 = colores[1] || '#FFDD57';
  return (
    <svg width="90" height="80" viewBox="0 0 90 80" fill="none">
      <rect x="5" y="60" width="80" height="15" rx="6" fill={c1} />
      <ellipse cx="18" cy="50" rx="13" ry="18" fill={c1} />
      <ellipse cx="45" cy="40" rx="13" ry="25" fill={c2} />
      <ellipse cx="72" cy="50" rx="13" ry="18" fill={c1} />
      <ellipse cx="18" cy="42" rx="5" ry="8" fill="rgba(255,255,255,0.3)" />
      <ellipse cx="45" cy="32" rx="5" ry="10" fill="rgba(255,255,255,0.3)" />
      <ellipse cx="72" cy="42" rx="5" ry="8" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

function ElementoSvg({ tipo, colores, imageUrl }: { tipo: TipoElemento; colores: string[]; imageUrl?: string }) {
  switch (tipo) {
    case 'globo':         return <GloboSvg colores={colores} />;
    case 'globosMacizos': return <GlobosMacizosSvg colores={colores} />;
    case 'flor':          return <FlorSvg colores={colores} />;
    case 'centroMesa':    return <CentroMesaSvg colores={colores} />;
    case 'arco':          return <ArcoSvg colores={colores} />;
    case 'lazo':          return <LazoSvg colores={colores} />;
    case 'candelabro':    return <CandelabroSvg colores={colores} />;
    case 'mesaTorta':     return <MesaTortaSvg colores={colores} />;
    case 'tela':          return <TelaSvg colores={colores} />;
    case 'mesa':          return <MesaSvg colores={colores} />;
    case 'silla':         return <SillaSvg colores={colores} />;
    case 'pista':         return <PistaSvg colores={colores} />;
    case 'columna':       return <ColumnaSvg colores={colores} />;
    case 'luz':           return <LuzSvg colores={colores} />;
    case 'cartel':        return <CartelSvg colores={colores} />;
    case 'inflable':      return <InflableSvg colores={colores} />;
    case 'imagen': {
      // Only allow https:// URLs (from our storage) to prevent XSS via javascript: or data: URIs
      const safeSrc = imageUrl && imageUrl.startsWith('https://') ? imageUrl : '';
      return safeSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={safeSrc} alt="elemento" style={{ width: 80, height: 80, objectFit: 'contain', display: 'block' }} />
      ) : (
        <div style={{ width: 80, height: 80, background: '#eee', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 11, color: '#999', borderRadius: 4 }}>sin imagen</div>
      );
    }
    default: return null;
  }
}


// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function VistaDecorativaEditor({
  vistaDecorativa, paletaColores, fiestaId, onSave, isSaving = false,
}: Props) {
  const { toast } = useToast();
  const [elementos, setElementos] = useState<ElementoDecorativo[]>(vistaDecorativa.elementos ?? []);
  const [fondoColor, setFondoColor] = useState(vistaDecorativa.fondoColor ?? '#f0f0f0');
  const [fondoImagenUrl, setFondoImagenUrl] = useState(vistaDecorativa.fondoImagenUrl ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [openCategoria, setOpenCategoria] = useState<string | null>('globos');
  const [zoomLevel, setZoomLevel] = useState(100); // percentage: 50-200

  const historyRef = useRef<ElementoDecorativo[][]>([]);
  const redoRef = useRef<ElementoDecorativo[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const elementosRef = useRef<ElementoDecorativo[]>(vistaDecorativa.elementos ?? []);
  const draggingRef = useRef<{
    id: string; startX: number; startY: number; elemX: number; elemY: number;
  } | null>(null);

  useEffect(() => {
    setElementos(vistaDecorativa.elementos ?? []);
    elementosRef.current = vistaDecorativa.elementos ?? [];
    setFondoColor(vistaDecorativa.fondoColor ?? '#f0f0f0');
    setFondoImagenUrl(vistaDecorativa.fondoImagenUrl ?? '');
    historyRef.current = [];
    redoRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [vistaDecorativa]);

  // Keep elementosRef in sync
  useEffect(() => { elementosRef.current = elementos; }, [elementos]);

  const selectedEl = elementos.find(e => e.id === selectedId) ?? null;
  const maxColores = TIPOS_ELEMENTOS.find(t => t.tipo === selectedEl?.tipo)?.maxColores ?? 1;

  // History
  const pushHistory = useCallback((snap: ElementoDecorativo[]) => {
    historyRef.current = [...historyRef.current.slice(-49), JSON.parse(JSON.stringify(snap))];
    redoRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const modifyElementos = useCallback((
    updater: ElementoDecorativo[] | ((prev: ElementoDecorativo[]) => ElementoDecorativo[]),
    skipHistory = false,
  ) => {
    setElementos(prev => {
      if (!skipHistory) pushHistory(prev);
      return typeof updater === 'function' ? updater(prev) : updater;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    setElementos(cur => {
      redoRef.current = [...redoRef.current, JSON.parse(JSON.stringify(cur))];
      setCanUndo(historyRef.current.length > 0);
      setCanRedo(true);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    if (redoRef.current.length === 0) return;
    const next = redoRef.current.pop()!;
    setElementos(cur => {
      historyRef.current = [...historyRef.current, JSON.parse(JSON.stringify(cur))];
      setCanUndo(true);
      setCanRedo(redoRef.current.length > 0);
      return next;
    });
  }, []);

  // Drag
  const handleMouseDownOnElement = useCallback((e: React.MouseEvent, id: string) => {
    const el = elementos.find(el => el.id === id);
    if (el?.bloqueado) { setSelectedId(id); return; }
    e.preventDefault(); e.stopPropagation();
    setSelectedId(id);
    if (!el) return;
    draggingRef.current = { id, startX: e.clientX, startY: e.clientY, elemX: el.x, elemY: el.y };
  }, [elementos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - draggingRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - draggingRef.current.startY) / rect.height) * 100;
    const nx = Math.min(100, Math.max(0, draggingRef.current.elemX + dx));
    const ny = Math.min(100, Math.max(0, draggingRef.current.elemY + dy));
    setElementos(prev => prev.map(el =>
      el.id === draggingRef.current!.id ? { ...el, x: nx, y: ny } : el
    ));
  }, []);

  const handleMouseUp = useCallback(() => {
    if (draggingRef.current) {
      draggingRef.current = null;
      // Push final position to history using the ref (avoids side-effect inside setState)
      pushHistory(elementosRef.current);
    }
  }, [pushHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (ctrl && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (ctrl && e.key === 'y') { e.preventDefault(); redo(); }
      if (ctrl && e.key === 'd' && selectedId) { e.preventDefault(); duplicarElemento(selectedId); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { e.preventDefault(); eliminarElemento(selectedId); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedId, duplicarElemento, eliminarElemento]);

  // Element operations
  const agregarElemento = useCallback((tipo: TipoElemento, imageUrl?: string) => {
    const info = TIPOS_ELEMENTOS.find(t => t.tipo === tipo);
    const maxC = info?.maxColores ?? 1;
    const def = [paletaColores.primary, paletaColores.secondary, paletaColores.accent];
    const colores = maxC > 0 ? def.slice(0, maxC) : [];
    const el: ElementoDecorativo = {
      id: crypto.randomUUID(), tipo,
      x: 10 + Math.random() * 60, y: 10 + Math.random() * 60,
      escala: 1, colores, rotacion: 0, opacidad: 1, imageUrl,
    };
    modifyElementos(prev => [...prev, el]);
    setSelectedId(el.id);
  }, [paletaColores, modifyElementos]);

  const eliminarElemento = useCallback((id: string) => {
    modifyElementos(prev => prev.filter(e => e.id !== id));
    setSelectedId(null);
  }, [modifyElementos]);

  const duplicarElemento = useCallback((id: string) => {
    setElementos(prev => {
      const el = prev.find(e => e.id === id);
      if (!el) return prev;
      pushHistory(prev);
      const newEl: ElementoDecorativo = {
        ...JSON.parse(JSON.stringify(el)),
        id: crypto.randomUUID(),
        x: Math.min(95, el.x + 4),
        y: Math.min(95, el.y + 4),
      };
      const idx = prev.findIndex(e => e.id === id);
      const arr = [...prev];
      arr.splice(idx + 1, 0, newEl);
      setTimeout(() => setSelectedId(newEl.id), 0);
      return arr;
    });
  }, [pushHistory]);

  const updateElemento = useCallback(<K extends keyof ElementoDecorativo>(
    id: string, field: K, value: ElementoDecorativo[K], skipHistory = false,
  ) => {
    modifyElementos(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e), skipHistory);
  }, [modifyElementos]);

  const updateColor = useCallback((idx: number, color: string, skipHistory = false) => {
    if (!selectedEl) return;
    const nc = [...selectedEl.colores];
    nc[idx] = color;
    updateElemento(selectedEl.id, 'colores', nc, skipHistory);
  }, [selectedEl, updateElemento]);

  // Layering
  const bringToFront = useCallback((id: string) => {
    modifyElementos(prev => {
      const i = prev.findIndex(e => e.id === id);
      if (i === prev.length - 1) return prev;
      const a = [...prev]; a.push(a.splice(i, 1)[0]); return a;
    });
  }, [modifyElementos]);

  const sendToBack = useCallback((id: string) => {
    modifyElementos(prev => {
      const i = prev.findIndex(e => e.id === id);
      if (i === 0) return prev;
      const a = [...prev]; a.unshift(a.splice(i, 1)[0]); return a;
    });
  }, [modifyElementos]);

  const moveUp = useCallback((id: string) => {
    modifyElementos(prev => {
      const i = prev.findIndex(e => e.id === id);
      if (i === prev.length - 1) return prev;
      const a = [...prev]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a;
    });
  }, [modifyElementos]);

  const moveDown = useCallback((id: string) => {
    modifyElementos(prev => {
      const i = prev.findIndex(e => e.id === id);
      if (i === 0) return prev;
      const a = [...prev]; [a[i], a[i - 1]] = [a[i - 1], a[i]]; return a;
    });
  }, [modifyElementos]);

  const limpiarTodo = useCallback(() => {
    modifyElementos([]); setSelectedId(null);
  }, [modifyElementos]);

  // Image uploads
  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const res = await uploadPublicPageAsset(fiestaId || null, file);
      if (res.success && res.url) { agregarElemento('imagen', res.url); toast({ title: 'Imagen agregada al canvas ✓' }); }
      else throw new Error(res.error || 'Error al subir');
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setIsUploading(false); }
  }, [fiestaId, agregarElemento, toast]);

  const handleBgUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const res = await uploadPublicPageAsset(fiestaId || null, file);
      if (res.success && res.url) { setFondoImagenUrl(res.url); toast({ title: 'Fondo actualizado ✓' }); }
      else throw new Error(res.error || 'Error al subir');
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setIsUploading(false); }
  }, [fiestaId, toast]);

  const handleGuardar = useCallback(async () => {
    await onSave({ elementos, fondoColor, fondoImagenUrl: fondoImagenUrl || undefined });
  }, [onSave, elementos, fondoColor, fondoImagenUrl]);

  const handleExportar = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(canvasRef.current, { backgroundColor: fondoColor, scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `decoracion-${fiestaId || 'canvas'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error(e); toast({ title: 'Error al exportar', variant: 'destructive' }); }
    finally { setIsExporting(false); }
  }, [fondoColor, fiestaId, toast]);

  // ──── Zoom ─────────────────────────────────────────────────────────────────

  const zoomIn = useCallback(() => setZoomLevel(z => Math.min(200, z + 10)), []);
  const zoomOut = useCallback(() => setZoomLevel(z => Math.max(50, z - 10)), []);
  const fitToScreen = useCallback(() => setZoomLevel(100), []);

  // ─── Render ───────────────────────────────

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-muted/30 rounded-xl border">
          <div className="flex gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo}>
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deshacer (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo}>
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rehacer (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>

          {selectedEl && (
            <>
              <div className="h-5 w-px bg-border mx-0.5" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => duplicarElemento(selectedEl.id)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplicar (Ctrl+D)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => updateElemento(selectedEl.id, 'bloqueado', !selectedEl.bloqueado)}>
                    <Lock className={cn('w-4 h-4', selectedEl.bloqueado && 'text-amber-500')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{selectedEl.bloqueado ? 'Desbloquear' : 'Bloquear'}</TooltipContent>
              </Tooltip>
              <div className="h-5 w-px bg-border mx-0.5" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => bringToFront(selectedEl.id)}>
                    <ChevronsUp className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Traer al frente</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => moveUp(selectedEl.id)}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Subir una capa</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => moveDown(selectedEl.id)}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bajar una capa</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => sendToBack(selectedEl.id)}>
                    <ChevronsDown className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Enviar al fondo</TooltipContent>
              </Tooltip>
              <div className="h-5 w-px bg-border mx-0.5" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => eliminarElemento(selectedEl.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eliminar (Supr)</TooltipContent>
              </Tooltip>
            </>
          )}

          <div className="flex-1" />
          {/* Zoom controls */}
          <div className="flex items-center gap-0.5">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} disabled={zoomLevel <= 50} title="Reducir zoom">
              <span className="text-base font-bold leading-none">−</span>
            </Button>
            <span className="text-[10px] font-bold text-muted-foreground w-10 text-center">{zoomLevel}%</span>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} disabled={zoomLevel >= 200} title="Aumentar zoom">
              <span className="text-base font-bold leading-none">+</span>
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-[10px] h-8 px-2" onClick={fitToScreen}>
              1:1
            </Button>
          </div>
          <div className="h-5 w-px bg-border mx-0.5" />
          <Button type="button" onClick={handleGuardar} disabled={isSaving} size="sm" className="gap-1.5">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Guardar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleExportar}
            disabled={isExporting || elementos.length === 0} className="gap-1.5">
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            PNG
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm"
                className="gap-1.5 text-destructive hover:text-destructive" disabled={elementos.length === 0}>
                <Trash2 className="w-3.5 h-3.5" /> Limpiar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Limpiar el diseño?</AlertDialogTitle>
                <AlertDialogDescription>Se eliminarán todos los elementos. Podés deshacer con Ctrl+Z.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={limpiarTodo} className="bg-destructive hover:bg-destructive/90">Limpiar todo</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Editor: library + canvas + properties */}
        <div className="flex gap-3 items-start">

          {/* Element library */}
          <div className="w-52 flex-shrink-0">
            <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
              <div className="p-2 bg-muted/40 border-b text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Biblioteca</p>
              </div>
              <ScrollArea className="h-[490px]">
                <div className="p-2 space-y-0.5">
                  {CATEGORIAS_ELEMENTOS.map(cat => {
                    const items = TIPOS_ELEMENTOS.filter(t => t.categoria === cat.id);
                    const isOpen = openCategoria === cat.id;
                    return (
                      <div key={cat.id}>
                        <button type="button"
                          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted/60 transition-colors text-left"
                          onClick={() => setOpenCategoria(isOpen ? null : cat.id)}>
                          <span className="text-base">{cat.emoji}</span>
                          <span className="flex-1 text-xs font-semibold text-foreground">{cat.label}</span>
                          {isOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                        </button>
                        {isOpen && (
                          <div className="pl-1 pb-1 space-y-0.5">
                            {items.map(item =>
                              item.tipo === 'imagen' ? (
                                <label key={item.tipo} className={cn(
                                  'flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors text-xs font-medium',
                                  'bg-primary/5 hover:bg-primary/10 text-primary border border-dashed border-primary/30',
                                  isUploading && 'opacity-50 pointer-events-none',
                                )}>
                                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                               : <Upload className="w-3.5 h-3.5 shrink-0" />}
                                  <span>{item.label}</span>
                                  <input type="file" accept="image/*" className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
                                </label>
                              ) : (
                                <button key={item.tipo} type="button"
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium text-left"
                                  onClick={() => agregarElemento(item.tipo)}>
                                  <span className="text-base shrink-0 leading-none">{item.emoji}</span>
                                  <span className="truncate">{item.label}</span>
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto" style={{ maxHeight: 540 }}>
            <div style={{ transformOrigin: 'top left', transform: `scale(${zoomLevel / 100})`, width: 730, height: 500 }}>
            <div
              id="vista-decorativa-canvas"
              ref={canvasRef}
              className="relative rounded-xl border-2 border-dashed border-muted-foreground/30 overflow-hidden select-none"
              style={{
                width: 730, height: 500, minWidth: 730,
                backgroundColor: fondoColor,
                backgroundImage: fondoImagenUrl ? `url(${fondoImagenUrl})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={() => setSelectedId(null)}
            >
              {elementos.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-muted-foreground/40 text-sm text-center px-8">
                    Elegí un elemento de la biblioteca para comenzar.<br />
                    <span className="text-[11px]">Arrastrá · Doble clic para deseleccionar</span>
                  </p>
                </div>
              )}
              {elementos.map((el, idx) => (
                <div key={el.id} className="absolute"
                  style={{
                    left: `${el.x}%`, top: `${el.y}%`,
                    transform: `translate(-50%,-50%) rotate(${el.rotacion ?? 0}deg) scale(${el.escala ?? 1})`,
                    cursor: el.bloqueado ? 'not-allowed' : 'grab',
                    opacity: el.opacidad ?? 1,
                    outline: selectedId === el.id ? '2px dashed #3B82F6' : 'none',
                    outlineOffset: 4, borderRadius: 4, zIndex: idx + 1,
                  }}
                  onMouseDown={e => handleMouseDownOnElement(e, el.id)}
                >
                  <ElementoSvg tipo={el.tipo} colores={el.colores} imageUrl={el.imageUrl} />
                  {el.bloqueado && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 pointer-events-none">
                      <Lock className="w-2.5 h-2.5 text-amber-900" />
                    </div>
                  )}
                  {el.etiqueta && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full text-[10px] font-medium bg-white/85 px-1.5 rounded shadow-sm pointer-events-none whitespace-nowrap">
                      {el.etiqueta}
                    </div>
                  )}
                </div>
              ))}
            </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              {elementos.length} elemento{elementos.length !== 1 ? 's' : ''}
              {selectedEl ? ` · Capa ${elementos.findIndex(e => e.id === selectedId) + 1} de ${elementos.length}` : ''}
              {' · '}Ctrl+Z deshacer · Ctrl+D duplicar · Supr eliminar
            </p>
          </div>

          {/* Properties panel */}
          <div className="w-64 flex-shrink-0">
            <AnimatePresence mode="wait">
              {selectedEl ? (
                <motion.div key="props"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.15 }}
                  className="space-y-3 p-3 border rounded-xl bg-card shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">Propiedades</h3>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {TIPOS_ELEMENTOS.find(t => t.tipo === selectedEl.tipo)?.label ?? selectedEl.tipo}
                    </span>
                  </div>

                  {/* Position */}
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Posición (%)</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">X</Label>
                        <Input type="number" min={0} max={100} step={0.5}
                          value={Math.round(selectedEl.x * 10) / 10}
                          onChange={e => updateElemento(selectedEl.id, 'x', Number(e.target.value), true)}
                          className="h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Y</Label>
                        <Input type="number" min={0} max={100} step={0.5}
                          value={Math.round(selectedEl.y * 10) / 10}
                          onChange={e => updateElemento(selectedEl.id, 'y', Number(e.target.value), true)}
                          className="h-7 text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Scale */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Tamaño</Label>
                      <span className="text-[10px] font-mono text-muted-foreground">{(selectedEl.escala ?? 1).toFixed(2)}x</span>
                    </div>
                    <Slider min={0.15} max={5} step={0.05}
                      value={[selectedEl.escala ?? 1]}
                      onValueChange={([v]) => updateElemento(selectedEl.id, 'escala', v, true)}
                      onValueCommit={([v]) => updateElemento(selectedEl.id, 'escala', v)} />
                    <div className="flex gap-0.5">
                      {([0.5, 1, 1.5, 2, 3] as const).map(v => (
                        <Button key={v} type="button" size="sm"
                          variant={Math.abs((selectedEl.escala ?? 1) - v) < 0.01 ? 'default' : 'outline'}
                          className="flex-1 text-[10px] h-6 px-0"
                          onClick={() => updateElemento(selectedEl.id, 'escala', v)}>
                          {v === 0.5 ? 'XS' : v === 1 ? 'S' : v === 1.5 ? 'M' : v === 2 ? 'L' : 'XL'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Rotation */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Rotación</Label>
                      <span className="text-[10px] font-mono text-muted-foreground">{Math.round(selectedEl.rotacion ?? 0)}°</span>
                    </div>
                    <Slider min={0} max={360} step={1}
                      value={[selectedEl.rotacion ?? 0]}
                      onValueChange={([v]) => updateElemento(selectedEl.id, 'rotacion', v, true)}
                      onValueCommit={([v]) => updateElemento(selectedEl.id, 'rotacion', v)} />
                    <div className="flex gap-0.5">
                      {([0, 45, 90, 135, 180, 270] as const).map(v => (
                        <Button key={v} type="button" size="sm"
                          variant={Math.abs((selectedEl.rotacion ?? 0) - v) < 1 ? 'default' : 'outline'}
                          className="flex-1 text-[9px] h-6 px-0"
                          onClick={() => updateElemento(selectedEl.id, 'rotacion', v)}>
                          {v}°
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Opacity */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Opacidad</Label>
                      <span className="text-[10px] font-mono text-muted-foreground">{Math.round((selectedEl.opacidad ?? 1) * 100)}%</span>
                    </div>
                    <Slider min={0.05} max={1} step={0.05}
                      value={[selectedEl.opacidad ?? 1]}
                      onValueChange={([v]) => updateElemento(selectedEl.id, 'opacidad', v, true)}
                      onValueCommit={([v]) => updateElemento(selectedEl.id, 'opacidad', v)} />
                  </div>

                  {/* Colors */}
                  {maxColores > 0 && (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Colores</Label>
                      {Array.from({ length: maxColores }).map((_, idx) => (
                        <div key={idx} className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">
                            {idx === 0 ? 'Principal' : idx === 1 ? 'Secundario' : 'Terciario'}
                          </Label>
                          <div className="flex gap-1.5 items-center flex-wrap">
                            {[paletaColores.primary, paletaColores.secondary, paletaColores.accent].map((c, pi) => (
                              <button key={pi} type="button"
                                className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                                style={{ background: c, outline: selectedEl.colores[idx] === c ? '2px solid #3B82F6' : 'none', outlineOffset: 2 }}
                                onClick={() => updateColor(idx, c)} />
                            ))}
                            <input type="color"
                              value={selectedEl.colores[idx] ?? paletaColores.primary}
                              onChange={e => updateColor(idx, e.target.value, true)}
                              onBlur={e => updateColor(idx, e.target.value, false)}
                              className="w-7 h-7 cursor-pointer rounded border p-0.5 shrink-0"
                              title="Color libre" />
                            <Input value={selectedEl.colores[idx] ?? ''}
                              onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) updateColor(idx, e.target.value, true); }}
                              onBlur={e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) updateColor(idx, e.target.value, false); }}
                              className="h-7 text-[10px] font-mono flex-1 min-w-0"
                              placeholder="#RRGGBB" maxLength={7} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Label */}
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Etiqueta</Label>
                    <Input value={selectedEl.etiqueta ?? ''}
                      onChange={e => updateElemento(selectedEl.id, 'etiqueta', e.target.value, true)}
                      onBlur={e => updateElemento(selectedEl.id, 'etiqueta', e.target.value)}
                      placeholder="Ej: Mesa 1, Entrada..." className="h-7 text-xs" />
                  </div>

                  <Button type="button" variant="destructive" size="sm" className="w-full gap-1.5"
                    onClick={() => eliminarElemento(selectedEl.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar elemento
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="global"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.15 }}
                  className="space-y-3 p-3 border rounded-xl bg-card shadow-sm"
                >
                  <h3 className="font-bold text-sm">Fondo del Canvas</h3>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Color de fondo</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={fondoColor} onChange={e => setFondoColor(e.target.value)}
                        className="w-9 h-9 cursor-pointer rounded border p-0.5" />
                      <Input value={fondoColor}
                        onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setFondoColor(e.target.value); }}
                        className="h-9 text-xs font-mono" placeholder="#f0f0f0" maxLength={7} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Imagen de fondo</Label>
                    <label className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer text-xs transition-colors',
                      'hover:bg-muted/60 hover:border-primary/40',
                      isUploading && 'opacity-50 pointer-events-none',
                    )}>
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                      <span>{fondoImagenUrl ? 'Cambiar imagen' : 'Subir foto del salón'}</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleBgUpload(f); e.target.value = ''; }} />
                    </label>
                    {fondoImagenUrl && (
                      <Button type="button" variant="ghost" size="sm" className="text-xs text-destructive w-full"
                        onClick={() => setFondoImagenUrl('')}>
                        <Trash2 className="w-3 h-3 mr-1" /> Quitar imagen
                      </Button>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Clic en un elemento para editar sus propiedades.<br />
                    <strong>Arrastrá</strong> para mover · <strong>Ctrl+Z</strong> deshacer<br />
                    <strong>Ctrl+D</strong> duplicar · <strong>Supr</strong> eliminar
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
