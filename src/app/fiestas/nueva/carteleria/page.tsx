'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  ArrowLeft, Printer as PrinterIcon, Loader2, Upload,
  GlassWater, Utensils, Hash, Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CartaTragosData, MenuMesaData, NumerosMesaData, LayoutElement } from '@/types/fiesta';
import { getFiestaById, updateCartaTragos, updateMenuMesa, updateNumerosMesa } from '@/app/actions/fiesta/fiesta.actions';
import { updateConfiguracionFiestaActual } from '@/app/actions/fiesta-actual';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultCartaTragosData, defaultMenuMesaData, defaultNumerosMesaData } from '@/lib/fiesta-defaults';
import { CartaTragosMenu } from '@/components/invitacion/templates/CartaTragosMenu';
import { MenuMesaTemplate } from '@/components/invitacion/templates/MenuMesaTemplate';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FONT_OPTIONS = ['Playfair Display', 'Dancing Script', 'Montserrat', 'Georgia', 'Arial'] as const;

// Aesthetic presets for quick styling
const AESTHETIC_PRESETS = [
  { id: 'elegante-dorado',   label: 'Elegante dorado',     color: '#c9a96e', bg: '#fdf8f0', emoji: '✨' },
  { id: 'xv-celeste',        label: 'XV celeste',           color: '#4fa7cc', bg: '#f0f8ff', emoji: '👑' },
  { id: 'boda-blanco-dorado', label: 'Boda blanco/dorado', color: '#b8960c', bg: '#fffdf5', emoji: '💍' },
  { id: 'neon',              label: 'Neón',                 color: '#e040fb', bg: '#1a0033', emoji: '🪩' },
  { id: 'corporativo',       label: 'Corporativo',          color: '#1e3a5f', bg: '#f5f7fa', emoji: '🏢' },
  { id: 'infantil',          label: 'Infantil',             color: '#ff6b9d', bg: '#fff0f6', emoji: '🎠' },
] as const;
const TITLE_SIZE_OPTIONS = ['small', 'medium', 'large', 'xlarge'] as const;
const TABLE_SIZE_MAP: Record<NonNullable<NumerosMesaData['fontSize']>, string> = {
  small: '3rem',
  medium: '4rem',
  large: '5rem',
  xlarge: '5.8rem',
};
const DEFAULT_QR_TEXT = '¡Ayúdanos a capturar el momento!';
const A4_WIDTH_CM = 21;
const A4_HEIGHT_CM = 29.7;
const UNASSIGNED_TABLE_LABEL = 'Sin mesa asignada';
const calculateItemsPerA4 = (widthCm: number, heightCm: number) => {
  const cols = Math.max(1, Math.floor(A4_WIDTH_CM / widthCm));
  const rows = Math.max(1, Math.floor(A4_HEIGHT_CM / heightCm));
  return Math.max(1, cols * rows);
};
const sortTableLabels = (a: string, b: string) => {
  const aNum = Number(a);
  const bNum = Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
  if (!Number.isNaN(aNum)) return -1;
  if (!Number.isNaN(bNum)) return 1;
  return a.localeCompare(b, 'es');
};
type CardLayoutPreset = {
  value: '10x15' | 'a6';
  label: string;
  widthCm: number;
  heightCm: number;
  itemsPerPage: number;
};
const CARD_LAYOUT_PRESETS: CardLayoutPreset[] = [
  { value: '10x15', label: 'Tarjeta 10×15 cm (2 por hoja A4)', widthCm: 10, heightCm: 15, itemsPerPage: calculateItemsPerA4(10, 15) },
  { value: 'a6', label: 'Tarjeta A6 10.5×14.8 cm (4 por hoja A4)', widthCm: 10.5, heightCm: 14.8, itemsPerPage: calculateItemsPerA4(10.5, 14.8) },
];
const TENT_FOLD_TOP_MM = 30;
const TENT_FOLD_BASE_MM = 87;
const TENT_FOLD_FACE_MM = 90;

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateString;
  }
};

/** Extrae los elementos de tipo mesa de la lista de elementos del diseño de salón */
const filterTableElements = (salonElements: LayoutElement[]) =>
  salonElements.filter(el => el.type === 'element' && (el.seats != null || el.name?.toLowerCase().includes('mesa')));

// ---------------------------------------------------------------------------
// QR Card (Social Wall) – 10×15 cm card
// ---------------------------------------------------------------------------
const QRCartel: React.FC<{
  fiestaId: string;
  primaryColor: string;
  protagonistaFotoUrl?: string;
  nombreEvento: string;
  subtitleText: string;
}> = ({ fiestaId, primaryColor, protagonistaFotoUrl, nombreEvento, subtitleText }) => {
  const [origin, setOrigin] = React.useState('');
  React.useEffect(() => { setOrigin(window.location.origin); }, []);
  const qrUrl = origin
    ? `${origin}/evento/social/${fiestaId}`
    : `https://app-ak.vercel.app/evento/social/${fiestaId}`;

  const cornerClasses: Record<string, string> = {
    'top-left': 'top-1.5 left-1.5 border-t-0 border-r-0',
    'top-right': 'top-1.5 right-1.5 border-t-0 border-l-0',
    'bottom-left': 'bottom-1.5 left-1.5 border-b-0 border-r-0',
    'bottom-right': 'bottom-1.5 right-1.5 border-b-0 border-l-0',
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-4 border-[3px]"
      style={{ borderColor: primaryColor, backgroundColor: '#ffffff' }}
    >
      {Object.entries(cornerClasses).map(([pos, cls]) => (
        <div key={pos} className={cn('absolute w-6 h-6 border-2', cls)} style={{ borderColor: primaryColor }} />
      ))}

      {protagonistaFotoUrl && (
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 mb-3" style={{ borderColor: primaryColor }}>
          <NextImage src={protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" />
        </div>
      )}

      {nombreEvento && (
        <p className="font-headline text-sm font-bold uppercase tracking-widest mb-3 text-center" style={{ color: primaryColor }}>
          {nombreEvento}
        </p>
      )}

      <div className="p-3 rounded-xl bg-white shadow-inner border" style={{ borderColor: primaryColor }}>
        <QRCodeSVG value={qrUrl} size={120} level="M" fgColor={primaryColor} />
      </div>

      <p className="text-center text-[9px] font-bold uppercase tracking-widest mt-3 leading-snug" style={{ color: primaryColor }}>
        {subtitleText}
      </p>
      <p className="text-center text-[8px] text-slate-500 mt-1 leading-snug max-w-[80%]">
        Escanea aquí y sube tus fotos
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Table Number Card – 10×15 cm card
// ---------------------------------------------------------------------------
const TableNumberCard: React.FC<{
  tableNumber: number;
  primaryColor: string;
  protagonistaFotoUrl?: string;
  nombreEvento: string;
  tipoCelebracion: string;
  protagonistaNombre: string;
  fechaEvento: string;
  fontSize: NonNullable<NumerosMesaData['fontSize']>;
  numberColor: string;
  cardBgColor: string;
  fontFamily: string;
  inverted?: boolean;
}> = ({
  tableNumber,
  primaryColor,
  protagonistaFotoUrl,
  nombreEvento,
  tipoCelebracion,
  protagonistaNombre,
  fechaEvento,
  fontSize,
  numberColor,
  cardBgColor,
  fontFamily,
  inverted,
}) => {
  const cornerClasses: Record<string, string> = {
    'top-left': 'top-1.5 left-1.5 border-t-0 border-r-0',
    'top-right': 'top-1.5 right-1.5 border-t-0 border-l-0',
    'bottom-left': 'bottom-1.5 left-1.5 border-b-0 border-r-0',
    'bottom-right': 'bottom-1.5 right-1.5 border-b-0 border-l-0',
  };

  return (
    <div
      className={cn('w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-4 border-[3px]', inverted && 'rotate-180')}
      style={{ borderColor: primaryColor, backgroundColor: cardBgColor }}
    >
      {Object.entries(cornerClasses).map(([pos, cls]) => (
        <div key={pos} className={cn('absolute w-6 h-6 border-2', cls)} style={{ borderColor: primaryColor }} />
      ))}

      {protagonistaFotoUrl ? (
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 mb-3" style={{ borderColor: primaryColor }}>
          <NextImage src={protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-full border-4 mb-3 flex items-center justify-center text-xs text-slate-400" style={{ borderColor: primaryColor }}>
          Sin Foto
        </div>
      )}

      <p className="font-headline text-xs font-bold uppercase tracking-widest text-center mb-0.5" style={{ color: primaryColor, fontFamily }}>
        {nombreEvento}
      </p>
      <p className="font-headline text-[10px] uppercase tracking-wider text-slate-400 mb-1" style={{ fontFamily }}>
        {tipoCelebracion}
      </p>
      {fechaEvento && (
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-4" style={{ fontFamily }}>
          {fechaEvento}
        </p>
      )}

      <div className="text-center">
        <p className="text-[8px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-0" style={{ fontFamily }}>MESA</p>
        <p className="font-headline font-black leading-none" style={{ fontSize: TABLE_SIZE_MAP[fontSize], color: numberColor, fontFamily }}>
          {tableNumber}
        </p>
        <p className="text-[10px] mt-1" style={{ color: primaryColor, fontFamily }}>{protagonistaNombre}</p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// A4 Page Wrapper – 2 cards per A4 sheet in portrait orientation
// ---------------------------------------------------------------------------
const A4Page: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div
    className={cn(
      'w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none print:break-after-page last:print:break-after-auto flex flex-col items-center justify-center gap-4 p-8',
      className
    )}
  >
    {children}
  </div>
);

// A single 10×15 cm card wrapper with visible cutting-guide border
const CardFrame: React.FC<{ children: React.ReactNode; widthCm: number; heightCm: number }> = ({ children, widthCm, heightCm }) => (
  <div className="relative" style={{ width: `${widthCm}cm`, height: `${heightCm}cm`, outline: '1px dashed #cbd5e1' }}>
    <div className="absolute inset-0">{children}</div>
  </div>
);

const WelcomePoster: React.FC<{ nombreEvento: string; tipoCelebracion: string; fechaEvento: string; primaryColor: string; protagonistaFotoUrl?: string; }> = ({
  nombreEvento,
  tipoCelebracion,
  fechaEvento,
  primaryColor,
  protagonistaFotoUrl,
}) => (
  <div className="w-full h-full border-[6px] rounded-[2rem] flex flex-col items-center justify-center text-center px-10 py-8" style={{ borderColor: primaryColor }}>
    {protagonistaFotoUrl && (
      <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 mb-6" style={{ borderColor: primaryColor }}>
        <NextImage src={protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" />
      </div>
    )}
    <p className="text-sm font-bold uppercase tracking-[0.35em] mb-3" style={{ color: primaryColor }}>
      Bienvenidos
    </p>
    <h2 className="font-headline text-5xl font-black leading-tight mb-3">{nombreEvento}</h2>
    {tipoCelebracion && <p className="text-2xl uppercase tracking-[0.15em] text-slate-600 mb-2">{tipoCelebracion}</p>}
    {fechaEvento && <p className="text-lg uppercase tracking-[0.12em] text-slate-500">{fechaEvento}</p>}
  </div>
);

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------
function CarteleriaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const router = useRouter();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cartaTragos, setCartaTragos] = useState<CartaTragosData>(defaultCartaTragosData);
  const [menuMesa, setMenuMesa] = useState<MenuMesaData>(defaultMenuMesaData);
  const [numerosMesa, setNumerosMesa] = useState<NumerosMesaData>(defaultNumerosMesaData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Shared config
  const [primaryColor, setPrimaryColor] = useState('#9333ea');
  const [protagonistaFotoUrl, setProtagonistFotoUrl] = useState('');
  const [numMesas, setNumMesas] = useState(10);
  const [nombreEventoOverride, setNombreEventoOverride] = useState('');
  const [fechaEventoOverride, setFechaEventoOverride] = useState('');
  const [tipoCelebracionOverride, setTipoCelebracionOverride] = useState('');
  const [qrSubtitle, setQrSubtitle] = useState(DEFAULT_QR_TEXT);
  const [cardLayout, setCardLayout] = useState<(typeof CARD_LAYOUT_PRESETS)[number]['value']>('10x15');
  const [showSeatingPlan, setShowSeatingPlan] = useState(true);
  const [showWelcomePoster, setShowWelcomePoster] = useState(true);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSeatingQr, setShowSeatingQr] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      toast({ title: 'Error', description: 'No se encontró ID de evento.', variant: 'destructive' });
      router.push('/eventos');
      return;
    }
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([
        getFiestaById(fiestaId),
        getInvoiceTemplateSettings(),
      ]);
      if (!fiestaData) throw new Error('Fiesta no encontrada');
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl || null);

      // Carta de tragos
      const mergedCarta = { ...defaultCartaTragosData, ...(fiestaData.cartaTragos || {}) };
      if (!mergedCarta.protagonistaNombre)
        mergedCarta.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre || 'La Agasajada';
      if (!mergedCarta.numeroPrincipal)
        mergedCarta.numeroPrincipal =
          fiestaData.configuracion.tipoCelebracion === 'XV años'
            ? 'Mis XV'
            : fiestaData.configuracion.tipoCelebracion;
      if (!mergedCarta.fontFamily) mergedCarta.fontFamily = 'Playfair Display';
      if (!mergedCarta.titleSize) mergedCarta.titleSize = 'medium';
      setCartaTragos(mergedCarta);

      // Menu de mesa
      const mergedMenu = { ...defaultMenuMesaData, ...(fiestaData.menuMesa || {}) };
      if (!mergedMenu.titulo) mergedMenu.titulo = 'MENÚ';
      if (!mergedMenu.protagonistaNombre) mergedMenu.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre || 'La Agasajada';
      if (!mergedMenu.fontFamily) mergedMenu.fontFamily = 'Playfair Display';
      setMenuMesa(mergedMenu);

      // Números de mesa
      const mergedNumeros = { ...defaultNumerosMesaData, ...(fiestaData.numerosMesa || {}) };
      if (!mergedNumeros.protagonistaNombre) mergedNumeros.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre || 'La Agasajada';
      if (!mergedNumeros.fechaEvento) mergedNumeros.fechaEvento = formatDate(fiestaData.configuracion.fechaEvento);
      if (!mergedNumeros.fontFamily) mergedNumeros.fontFamily = 'Playfair Display';
      setNumerosMesa(mergedNumeros);

      // Shared color from carta if already set
      const sharedColor = mergedCarta.paletaColores?.primary || '#9333ea';
      setPrimaryColor(sharedColor);

      // Shared photo
      const sharedPhoto =
        mergedCarta.protagonistaFotoUrl ||
        mergedMenu.protagonistaFotoUrl ||
        fiestaData.configuracion.protagonistaFotoUrl ||
        '';
      setProtagonistFotoUrl(sharedPhoto);

      setNombreEventoOverride(fiestaData.configuracion.nombreEvento || 'Evento');
      setFechaEventoOverride(fiestaData.configuracion.fechaEvento || '');
      setTipoCelebracionOverride(fiestaData.configuracion.tipoCelebracion || '');
      setQrSubtitle(fiestaData.configuracion.carteleriaQrTexto || DEFAULT_QR_TEXT);

      // Auto-pull table count from salon layout elements
      const salonElements = fiestaData.decoracion?.salonElements ?? [];
      const tableElements = filterTableElements(salonElements);
      if (tableElements.length > 0) {
        setNumMesas(tableElements.length);
      }
    } catch (e: unknown) {
      setError('No se pudo cargar la información del evento.');
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync color + photo changes to both card data objects
  useEffect(() => {
    setCartaTragos(prev => ({
      ...prev,
      protagonistaFotoUrl,
      paletaColores: {
        ...(prev.paletaColores || { primary: primaryColor, secondary: '#363636', accent: '#ffffff' }),
        primary: primaryColor,
      },
    }));
    setMenuMesa(prev => ({
      ...prev,
      protagonistaFotoUrl,
      paletaColores: {
        ...(prev.paletaColores || { primary: primaryColor, secondary: '#4b5563', accent: primaryColor, background: '#ffffff' }),
        primary: primaryColor,
      },
    }));
  }, [primaryColor, protagonistaFotoUrl]);

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('folder', fiestaId);
      formData.append('file', file);
      const result = await uploadPublicPageAsset(formData);
      if (result.success && result.url) {
        setProtagonistFotoUrl(result.url);
        toast({ title: 'Foto actualizada' });
      } else {
        throw new Error(result.error);
      }
    } catch (e: unknown) {
      toast({ title: 'Error al subir foto', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!fiestaId || !fiesta) return;
    setIsSaving(true);
    try {
      const configToSave = {
        ...fiesta.configuracion,
        nombreEvento: nombreEventoOverride || fiesta.configuracion.nombreEvento,
        fechaEvento: fechaEventoOverride,
        tipoCelebracion: tipoCelebracionOverride || fiesta.configuracion.tipoCelebracion,
        carteleriaQrTexto: qrSubtitle,
      };

      await Promise.all([
        updateCartaTragos(fiestaId, cartaTragos),
        updateMenuMesa(fiestaId, menuMesa),
        updateNumerosMesa(fiestaId, numerosMesa),
        updateConfiguracionFiestaActual(fiestaId, configToSave),
      ]);
      setFiesta(prev => prev ? ({ ...prev, configuracion: configToSave }) : prev);
      toast({ title: '¡Kit guardado!', description: 'La cartelería ha sido actualizada.' });
    } catch (e: unknown) {
      toast({ title: 'Error al guardar', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => window.print();

  if (isLoading || !fiesta) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }

  const nombreEvento = nombreEventoOverride || fiesta.configuracion.nombreEvento || 'Evento';
  const tipoCelebracion = tipoCelebracionOverride || fiesta.configuracion.tipoCelebracion || '';
  const fechaEventoTexto = formatDate(fechaEventoOverride || fiesta.configuracion.fechaEvento);
  const nombreProtagonistaMesa = numerosMesa.protagonistaNombre || cartaTragos.protagonistaNombre || fiesta.configuracion.protagonista1Nombre || 'Protagonista';
  const fechaMesa = numerosMesa.fechaEvento || fechaEventoTexto;
  const tableFontSize = numerosMesa.fontSize || 'medium';
  const tableNumberColor = numerosMesa.numberColor || primaryColor;
  const tableCardBgColor = numerosMesa.cardBgColor || '#ffffff';
  const tableFontFamily = numerosMesa.fontFamily || cartaTragos.fontFamily || 'Playfair Display';
  const activeCardLayout = CARD_LAYOUT_PRESETS.find(layout => layout.value === cardLayout) || CARD_LAYOUT_PRESETS[0];

  // Check if table count was auto-derived from salon layout
  const salonTableCount = (() => {
    const els = fiesta.decoracion?.salonElements ?? [];
    const tableEls = filterTableElements(els);
    return tableEls.length > 0 ? tableEls.length : null;
  })();

  // Build table-number pages: 2 cards per A4 sheet
  const tableNumbers = Array.from({ length: numMesas }, (_, i) => i + 1);
  const tablePages: number[][] = [];
  for (let i = 0; i < tableNumbers.length; i += 2) {
    tablePages.push(tableNumbers.slice(i, i + 2));
  }
  const invitadosPorMesa = (() => {
    const map = new Map<string, string[]>();
    for (const invitado of fiesta.invitados || []) {
      const mesa = (invitado.tableNumber || '').trim() || UNASSIGNED_TABLE_LABEL;
      if (!map.has(mesa)) map.set(mesa, []);
      map.get(mesa)?.push(invitado.nombre);
    }
    return Array.from(map.entries()).sort((a, b) => sortTableLabels(a[0], b[0]));
  })();

  // Enrich table labels with salon element names when available
  const salonTableLabels = (() => {
    const els = fiesta.decoracion?.salonElements ?? [];
    const tableEls = filterTableElements(els);
    const labelMap = new Map<string, string>();
    tableEls.forEach((el, idx) => {
      const num = String(idx + 1);
      if (el.name && el.name.toLowerCase() !== 'mesa') {
        labelMap.set(num, el.name);
      }
    });
    return labelMap;
  })();
  const FIXED_PAGES_COUNT = 3 + (showWelcomePoster ? 1 : 0) + (showSeatingPlan ? 1 : 0); // carta + menu + qr + opcionales
  const totalPages = FIXED_PAGES_COUNT + tablePages.length;

  return (
    <div className="bg-slate-100 min-h-screen print:bg-white">
      {/* ── Toolbar ── */}
      <div className="py-2 px-4 print:hidden flex flex-col md:flex-row justify-between items-center gap-3 bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="flex items-center gap-2">
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="font-headline text-lg font-bold leading-tight">Generador de Cartelería de Mesas</h1>
            <p className="text-xs text-muted-foreground">{nombreEvento} · {tipoCelebracion}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          {/* Color picker */}
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Color Principal</Label>
            <Input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-10 h-9 p-0.5 cursor-pointer"
            />
          </div>
          {/* Photo upload */}
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">
              Foto {isUploading && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}
            </Label>
            <div className="flex items-center gap-1">
              {protagonistaFotoUrl && (
                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2" style={{ borderColor: primaryColor }}>
                  <NextImage src={protagonistaFotoUrl} alt="foto" layout="fill" objectFit="cover" />
                </div>
              )}
              <label htmlFor="foto-protagonista-carteleria" className="cursor-pointer">
                <Button variant="outline" size="sm" className="h-9 pointer-events-none" asChild>
                  <span><Upload className="w-4 h-4 mr-1" />Subir</span>
                </Button>
              </label>
              <input
                id="foto-protagonista-carteleria"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={isUploading}
              />
            </div>
          </div>
          {/* Number of tables */}
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">
              N° de Mesas
              {salonTableCount != null && (
                <span className="ml-1 text-green-600 normal-case font-normal">(del diseño)</span>
              )}
            </Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={numMesas}
              onChange={e => setNumMesas(Math.max(1, Math.min(99, Number(e.target.value))))}
              className="w-20 h-9"
            />
          </div>
          <Button size="sm" variant="secondary" onClick={() => setIsEditorOpen(true)}>
            ⚙️ Editar Diseño
          </Button>

          <Separator orientation="vertical" className="h-9 mx-1 hidden md:block" />

          <Button size="sm" onClick={handleSaveAll} disabled={isSaving} variant="outline">
            {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            Guardar
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <PrinterIcon className="w-4 h-4 mr-1" />
            Descargar Kit PDF
          </Button>
        </div>
      </div>

      {/* Auto-pull notice */}
      {salonTableCount != null && (
        <div className="print:hidden mx-4 mt-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Se detectaron <strong>{salonTableCount} mesas</strong> en el Diseño de Salón y se usaron automáticamente. Podés ajustar el número manualmente si necesitás.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent side="right" className="w-[96vw] sm:max-w-2xl p-0">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-6 pb-3 border-b">
              <SheetTitle>Panel Avanzado de Cartelería</SheetTitle>
              <SheetDescription>Personalizá cada pieza y visualizá los cambios en tiempo real.</SheetDescription>
            </SheetHeader>

            <div className="p-4 overflow-y-auto">
              <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto gap-1">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="carta">Carta de Tragos</TabsTrigger>
                  <TabsTrigger value="menu">Menú</TabsTrigger>
                  <TabsTrigger value="qr">QR</TabsTrigger>
                  <TabsTrigger value="numeros">Números</TabsTrigger>
                  <TabsTrigger value="impresion">Impresión</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  {/* Aesthetic presets */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Presets estéticos</Label>
                    <div className="flex flex-wrap gap-2">
                      {AESTHETIC_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setPrimaryColor(preset.color)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all',
                            primaryColor === preset.color
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-slate-200 hover:border-slate-300'
                          )}
                          style={{ backgroundColor: preset.bg, color: preset.color }}
                          title={preset.label}
                        >
                          <span>{preset.emoji}</span> {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Color principal</Label>
                      <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-full h-10" />
                    </div>
                    <div className="space-y-1">
                      <Label>Foto protagonista</Label>
                      <div className="flex items-center gap-2">
                        <label htmlFor="foto-protagonista-carteleria-panel" className="cursor-pointer w-full">
                          <Button variant="outline" className="w-full pointer-events-none" asChild>
                            <span><Upload className="w-4 h-4 mr-1" />Subir foto</span>
                          </Button>
                        </label>
                        <input
                          id="foto-protagonista-carteleria-panel"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>N° de mesas</Label>
                      <Input type="number" min={1} max={99} value={numMesas} onChange={e => setNumMesas(Math.max(1, Math.min(99, Number(e.target.value))))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Nombre del evento</Label>
                      <Input value={nombreEventoOverride} onChange={e => setNombreEventoOverride(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha del evento</Label>
                      <Input type="date" value={fechaEventoOverride} onChange={e => setFechaEventoOverride(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Tipo de fiesta</Label>
                      <Select value={tipoCelebracionOverride} onValueChange={setTipoCelebracionOverride}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Boda">Boda</SelectItem>
                          <SelectItem value="XV años">XV años</SelectItem>
                          <SelectItem value="Cumpleaños">Cumpleaños</SelectItem>
                          <SelectItem value="Aniversario">Aniversario</SelectItem>
                          <SelectItem value="Corporativo">Corporativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="carta" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Título de la carta</Label>
                      <Input value={cartaTragos.titulo || ''} onChange={e => setCartaTragos(prev => ({ ...prev, titulo: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Nombre del protagonista</Label>
                      <Input value={cartaTragos.protagonistaNombre || ''} onChange={e => setCartaTragos(prev => ({ ...prev, protagonistaNombre: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Color de fondo</Label>
                      <Input type="color" value={cartaTragos.backgroundColor || '#ffffff'} onChange={e => setCartaTragos(prev => ({ ...prev, backgroundColor: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Color de texto</Label>
                      <Input
                        type="color"
                        value={cartaTragos.paletaColores?.secondary || '#363636'}
                        onChange={e => setCartaTragos(prev => ({
                          ...prev,
                          paletaColores: { ...(prev.paletaColores || { primary: primaryColor, secondary: '#363636', accent: '#ffffff' }), secondary: e.target.value },
                        }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Tipo de fuente</Label>
                      <Select value={cartaTragos.fontFamily || 'Playfair Display'} onValueChange={value => setCartaTragos(prev => ({ ...prev, fontFamily: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(option => (<SelectItem key={option} value={option}>{option}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Tamaño número/título</Label>
                      <Select
                        value={cartaTragos.titleSize || 'medium'}
                        onValueChange={value => setCartaTragos(prev => ({ ...prev, titleSize: value as CartaTragosData['titleSize'] }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TITLE_SIZE_OPTIONS.map(size => (<SelectItem key={size} value={size}>{size}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Link href={`/fiestas/nueva/carta-tragos?fiestaId=${fiestaId}`}>
                    <Button variant="outline" className="w-full">Ir a lista de tragos</Button>
                  </Link>
                </TabsContent>

                <TabsContent value="menu" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Título del menú</Label>
                      <Input value={menuMesa.titulo || ''} onChange={e => setMenuMesa(prev => ({ ...prev, titulo: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Nombre del protagonista</Label>
                      <Input value={menuMesa.protagonistaNombre || ''} onChange={e => setMenuMesa(prev => ({ ...prev, protagonistaNombre: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Color de fondo</Label>
                      <Input
                        type="color"
                        value={menuMesa.paletaColores.background || '#ffffff'}
                        onChange={e => setMenuMesa(prev => ({ ...prev, paletaColores: { ...prev.paletaColores, background: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Color de texto</Label>
                      <Input
                        type="color"
                        value={menuMesa.paletaColores.secondary || '#4b5563'}
                        onChange={e => setMenuMesa(prev => ({ ...prev, paletaColores: { ...prev.paletaColores, secondary: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Color de acento</Label>
                      <Input
                        type="color"
                        value={menuMesa.paletaColores.accent || primaryColor}
                        onChange={e => setMenuMesa(prev => ({ ...prev, paletaColores: { ...prev.paletaColores, accent: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Tipo de fuente</Label>
                      <Select value={menuMesa.fontFamily || 'Playfair Display'} onValueChange={value => setMenuMesa(prev => ({ ...prev, fontFamily: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(option => (<SelectItem key={option} value={option}>{option}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Link href={`/fiestas/nueva/menu-mesa?fiestaId=${fiestaId}`}>
                    <Button variant="outline" className="w-full">Ir a lista de platos</Button>
                  </Link>
                </TabsContent>

                <TabsContent value="qr" className="space-y-4">
                  <div className="space-y-1">
                    <Label>Nombre del evento</Label>
                    <Input value={nombreEventoOverride} onChange={e => setNombreEventoOverride(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Color principal</Label>
                    <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Texto debajo del QR</Label>
                    <Input value={qrSubtitle} onChange={e => setQrSubtitle(e.target.value)} />
                  </div>
                </TabsContent>

                <TabsContent value="numeros" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Nombre del protagonista</Label>
                      <Input value={numerosMesa.protagonistaNombre || ''} onChange={e => setNumerosMesa(prev => ({ ...prev, protagonistaNombre: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha en tarjeta</Label>
                      <Input value={numerosMesa.fechaEvento || ''} onChange={e => setNumerosMesa(prev => ({ ...prev, fechaEvento: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Color del número</Label>
                      <Input type="color" value={numerosMesa.numberColor || primaryColor} onChange={e => setNumerosMesa(prev => ({ ...prev, numberColor: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Color de fondo de tarjeta</Label>
                      <Input type="color" value={numerosMesa.cardBgColor || '#ffffff'} onChange={e => setNumerosMesa(prev => ({ ...prev, cardBgColor: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Tamaño del número</Label>
                      <Select
                        value={numerosMesa.fontSize || 'medium'}
                        onValueChange={value => setNumerosMesa(prev => ({ ...prev, fontSize: value as NumerosMesaData['fontSize'] }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TITLE_SIZE_OPTIONS.map(size => (<SelectItem key={size} value={size}>{size}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Tipo de fuente</Label>
                      <Select value={numerosMesa.fontFamily || 'Playfair Display'} onValueChange={value => setNumerosMesa(prev => ({ ...prev, fontFamily: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(option => (<SelectItem key={option} value={option}>{option}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="impresion" className="space-y-4">
                  <div className="space-y-1">
                    <Label>Medida predefinida (A4)</Label>
                    <Select value={cardLayout} onValueChange={value => setCardLayout(value as (typeof CARD_LAYOUT_PRESETS)[number]['value'])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CARD_LAYOUT_PRESETS.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 rounded-lg border p-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={showSeatingPlan} onChange={e => setShowSeatingPlan(e.target.checked)} />
                      Incluir “Busca tu mesa” (invitados agrupados por mesa)
                    </label>
                    {showSeatingPlan && (
                      <label className="flex items-center gap-2 text-sm font-medium ml-6 text-muted-foreground">
                        <input type="checkbox" checked={showSeatingQr} onChange={e => setShowSeatingQr(e.target.checked)} />
                        Incluir código QR para consultar mesa en el cartel
                      </label>
                    )}
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={showWelcomePoster} onChange={e => setShowWelcomePoster(e.target.checked)} />
                      Incluir cartel de bienvenida A4
                    </label>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Hint + Quick links ── */}
      <div className="max-w-5xl mx-auto px-4 py-4 print:hidden space-y-3">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            Haz clic en <strong>Descargar Kit PDF</strong> para generar las {totalPages} páginas A4 listas para imprimir y
            cortar. Formato activo: <strong>{activeCardLayout.label}</strong>. Para editar cada pieza en detalle
            usa los accesos rápidos de abajo.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { href: `carta-tragos?fiestaId=${fiestaId}`, label: 'Carta de Tragos', icon: GlassWater, cls: 'text-violet-600 bg-violet-50 border-violet-200' },
            { href: `menu-mesa?fiestaId=${fiestaId}`, label: 'Menú de Mesa', icon: Utensils, cls: 'text-orange-600 bg-orange-50 border-orange-200' },
            { href: `numeros-mesa?fiestaId=${fiestaId}`, label: 'Números de Mesa', icon: Hash, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href.startsWith('/') ? item.href : `/fiestas/nueva/${item.href}`}
            >
              <Card className={cn('border cursor-pointer hover:shadow-md transition-shadow', item.cls)}>
                <CardContent className="p-3 flex items-center gap-2">
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
          Vista previa · {numMesas} mesas · {totalPages} páginas A4 · {activeCardLayout.itemsPerPage} piezas por hoja
        </p>
      </div>

      {/* ════════════════════════════════════════════
          PRINTABLE AREA – all A4 pages
      ════════════════════════════════════════════ */}
      <div className="flex flex-col items-center gap-8 py-4 print:py-0 print:gap-0">

        {/* PAGE 1 – Carta de Tragos */}
        <A4Page>
          <div className={cn('w-full grid justify-items-center content-center', activeCardLayout.itemsPerPage === 4 ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-4')}>
            {Array.from({ length: activeCardLayout.itemsPerPage }).map((_, idx) => (
              <CardFrame key={`carta-${idx}`} widthCm={activeCardLayout.widthCm} heightCm={activeCardLayout.heightCm}>
                <CartaTragosMenu fiesta={fiesta} carta={cartaTragos} isPreview={false} />
              </CardFrame>
            ))}
          </div>
        </A4Page>

        {/* PAGE 2 – Menú de Comida */}
        <A4Page>
          <div className={cn('w-full grid justify-items-center content-center', activeCardLayout.itemsPerPage === 4 ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-4')}>
            {Array.from({ length: activeCardLayout.itemsPerPage }).map((_, idx) => (
              <CardFrame key={`menu-${idx}`} widthCm={activeCardLayout.widthCm} heightCm={activeCardLayout.heightCm}>
                <MenuMesaTemplate fiesta={fiesta} data={menuMesa} logoUrl={logoUrl} isPreview={false} />
              </CardFrame>
            ))}
          </div>
        </A4Page>

        {/* PAGE 3 – Cartel QR Social Wall */}
        <A4Page>
          <div className={cn('w-full grid justify-items-center content-center', activeCardLayout.itemsPerPage === 4 ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-4')}>
            {Array.from({ length: activeCardLayout.itemsPerPage }).map((_, idx) => (
              <CardFrame key={`qr-${idx}`} widthCm={activeCardLayout.widthCm} heightCm={activeCardLayout.heightCm}>
                <QRCartel
                  fiestaId={fiestaId!}
                  primaryColor={primaryColor}
                  protagonistaFotoUrl={protagonistaFotoUrl || undefined}
                  nombreEvento={nombreEvento}
                  subtitleText={qrSubtitle}
                />
              </CardFrame>
            ))}
          </div>
        </A4Page>

        {/* PAGES 4+ – Números de Mesa tipo carpa (2 por A4) */}
        {tablePages.map((pair, pageIdx) => (
          <A4Page key={`mesa-page-${pageIdx}`} className="p-0">
            <div className="w-full h-full grid grid-cols-2 border border-black overflow-hidden">
              {pair.map(n => (
                <div key={`mesa-carpa-${n}`} className="h-full flex flex-col border-r last:border-r-0 border-black">
                  <div className="border-b border-dashed border-slate-300 bg-slate-50/30" style={{ height: `${TENT_FOLD_TOP_MM}mm` }} />
                  <div className="border-b border-dashed border-slate-300 bg-white" style={{ height: `${TENT_FOLD_BASE_MM}mm` }} />
                  <div className="border-b border-dashed border-slate-300" style={{ height: `${TENT_FOLD_FACE_MM}mm` }}>
                    <TableNumberCard
                      tableNumber={n}
                      primaryColor={primaryColor}
                      protagonistaFotoUrl={protagonistaFotoUrl || undefined}
                      nombreEvento={nombreEvento}
                      tipoCelebracion={tipoCelebracion}
                      protagonistaNombre={nombreProtagonistaMesa}
                      fechaEvento={fechaMesa}
                      fontSize={tableFontSize}
                      numberColor={tableNumberColor}
                      cardBgColor={tableCardBgColor}
                      fontFamily={tableFontFamily}
                      inverted
                    />
                  </div>
                  <div style={{ height: `${TENT_FOLD_FACE_MM}mm` }}>
                    <TableNumberCard
                      tableNumber={n}
                      primaryColor={primaryColor}
                      protagonistaFotoUrl={protagonistaFotoUrl || undefined}
                      nombreEvento={nombreEvento}
                      tipoCelebracion={tipoCelebracion}
                      protagonistaNombre={nombreProtagonistaMesa}
                      fechaEvento={fechaMesa}
                      fontSize={tableFontSize}
                      numberColor={tableNumberColor}
                      cardBgColor={tableCardBgColor}
                      fontFamily={tableFontFamily}
                    />
                  </div>
                </div>
              ))}
              {pair.length === 1 && (
                <div className="h-full bg-slate-50/50" />
              )}
            </div>
          </A4Page>
        ))}

        {showSeatingPlan && (
          <A4Page className="items-stretch justify-start p-0">
            <div className="w-full h-full flex flex-col" style={{ fontFamily: tableFontFamily }}>
              {/* Header */}
              <div
                className="flex items-center justify-between px-10 py-6 shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="text-white">
                  <h2 className="font-headline text-4xl font-black tracking-tight leading-none">Busca tu mesa</h2>
                  <p className="text-sm mt-1 opacity-80 uppercase tracking-widest">{nombreEvento}</p>
                </div>
                {showSeatingQr && fiestaId && (
                  <div className="bg-white rounded-xl p-2 shadow-lg">
                    <QRCodeSVG
                      value={`${typeof window !== 'undefined' ? window.location.origin : 'https://app-ak.vercel.app'}/evento/actual/mesa?fiestaId=${encodeURIComponent(fiestaId)}`}
                      size={80}
                      level="M"
                      fgColor={primaryColor}
                    />
                    <p className="text-[7px] text-center font-bold mt-1" style={{ color: primaryColor }}>CONSULTA TU MESA</p>
                  </div>
                )}
              </div>

              {/* Guest list */}
              <div className="flex-1 p-8 overflow-hidden">
                {invitadosPorMesa.length > 0 ? (
                  <div className="columns-2 gap-5 text-sm">
                    {invitadosPorMesa.map(([mesa, nombres]) => {
                      const mesaLabel = salonTableLabels.get(mesa);
                      return (
                      <div
                        key={`mesa-plan-${mesa}`}
                        className="rounded-xl border-l-4 bg-slate-50 px-4 py-3 mb-4 break-inside-avoid"
                        style={{ borderLeftColor: primaryColor }}
                      >
                        <p
                          className="font-black uppercase tracking-wider text-xs mb-2 flex items-center gap-1"
                          style={{ color: primaryColor }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[9px] font-black"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {mesa}
                          </span>
                          Mesa {mesaLabel ? `${mesaLabel} (${mesa})` : mesa}
                        </p>
                        <ul className="space-y-0.5 text-slate-700">
                          {nombres.map((nombre, index) => (
                            <li key={`${mesa}-${nombre}-${index}`} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-slate-400 inline-block shrink-0" />
                              {nombre}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    No hay invitados con mesa asignada.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="px-10 py-3 shrink-0 flex items-center justify-between"
                style={{ backgroundColor: `${primaryColor}18` }}
              >
                <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: primaryColor }}>
                  {tipoCelebracion} · {fechaEventoTexto}
                </p>
                {showSeatingQr && fiestaId && (
                  <p className="text-[8px] text-slate-500">Escanea el QR para consultar tu mesa</p>
                )}
              </div>
            </div>
          </A4Page>
        )}

        {showWelcomePoster && (
          <A4Page className="items-stretch justify-stretch p-8">
            <WelcomePoster
              nombreEvento={nombreEvento}
              tipoCelebracion={tipoCelebracion}
              fechaEvento={fechaEventoTexto}
              primaryColor={primaryColor}
              protagonistaFotoUrl={protagonistaFotoUrl || undefined}
            />
          </A4Page>
        )}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@400;700&family=Playfair+Display:wght@400;700&family=Montserrat:wght@400;700&display=swap');
        @media print {
          body { -webkit-print-color-adjust: exact; color-adjust: exact; background: white !important; }
          .sidebar, header, nav, button, .no-print, .notifications-hub, .sidebar-inset > header, aside { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
          main { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}

export default function CarteleriaPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <CarteleriaContent />
    </Suspense>
  );
}
