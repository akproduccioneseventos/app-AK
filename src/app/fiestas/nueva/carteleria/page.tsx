'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Printer as PrinterIcon, Loader2, Upload,
  GlassWater, Utensils, QrCode, Hash, ExternalLink, Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CartaTragosData, MenuMesaData } from '@/types/fiesta';
import { getFiestaById, updateCartaTragos, updateMenuMesa } from '@/app/actions/fiesta/fiesta.actions';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultCartaTragosData, defaultMenuMesaData } from '@/lib/fiesta-defaults';
import { CartaTragosMenu } from '@/components/invitacion/templates/CartaTragosMenu';
import { MenuMesaTemplate } from '@/components/invitacion/templates/MenuMesaTemplate';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ---------------------------------------------------------------------------
// QR Card (Social Wall) – 10×15 cm card
// ---------------------------------------------------------------------------
const QRCartel: React.FC<{
  fiestaId: string;
  primaryColor: string;
  protagonistaFotoUrl?: string;
  nombreEvento: string;
}> = ({ fiestaId, primaryColor, protagonistaFotoUrl, nombreEvento }) => {
  const [origin, setOrigin] = React.useState('');
  React.useEffect(() => { setOrigin(window.location.origin); }, []);
  const qrUrl = origin
    ? `${origin}/evento/muro-en-vivo/${fiestaId}`
    : `https://app-ak.vercel.app/evento/muro-en-vivo/${fiestaId}`;

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
        ¡Ayúdanos a capturar el momento!
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
}> = ({ tableNumber, primaryColor, protagonistaFotoUrl, nombreEvento, tipoCelebracion }) => {
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

      {protagonistaFotoUrl ? (
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 mb-3" style={{ borderColor: primaryColor }}>
          <NextImage src={protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-full border-4 mb-3 flex items-center justify-center text-xs text-slate-400" style={{ borderColor: primaryColor }}>
          Sin Foto
        </div>
      )}

      <p className="font-headline text-xs font-bold uppercase tracking-widest text-center mb-0.5" style={{ color: primaryColor }}>
        {nombreEvento}
      </p>
      <p className="font-headline text-[10px] uppercase tracking-wider text-slate-400 mb-4">
        {tipoCelebracion}
      </p>

      <div className="text-center">
        <p className="text-[8px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-0">MESA</p>
        <p className="font-headline font-black leading-none" style={{ fontSize: '4rem', color: primaryColor }}>
          {tableNumber}
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// A4 Page Wrapper – 2 cards per A4 sheet in portrait orientation
// ---------------------------------------------------------------------------
const A4Page: React.FC<{ children: React.ReactNode; isLast?: boolean }> = ({ children, isLast }) => (
  <div
    className={cn(
      'w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none flex flex-col items-center justify-center gap-4 p-8',
      !isLast && 'print:break-after-page'
    )}
  >
    {children}
  </div>
);

// A single 10×15 cm card wrapper with visible cutting-guide border
const CardFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative" style={{ width: '10cm', height: '15cm', outline: '1px dashed #cbd5e1' }}>
    <div className="absolute inset-0">{children}</div>
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Shared config
  const [primaryColor, setPrimaryColor] = useState('#9333ea');
  const [protagonistaFotoUrl, setProtagonistFotoUrl] = useState('');
  const [numMesas, setNumMesas] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setCartaTragos(mergedCarta);

      // Menu de mesa
      const mergedMenu = { ...defaultMenuMesaData, ...(fiestaData.menuMesa || {}) };
      setMenuMesa(mergedMenu);

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
      const result = await uploadPublicPageAsset(fiestaId, file);
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
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      await Promise.all([
        updateCartaTragos(fiestaId, cartaTragos),
        updateMenuMesa(fiestaId, menuMesa),
      ]);
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

  const nombreEvento = fiesta.configuracion.nombreEvento || 'Evento';
  const tipoCelebracion = fiesta.configuracion.tipoCelebracion || '';

  // Build table-number pages: 2 cards per A4 sheet
  const tableNumbers = Array.from({ length: numMesas }, (_, i) => i + 1);
  const tablePages: number[][] = [];
  for (let i = 0; i < tableNumbers.length; i += 2) {
    tablePages.push(tableNumbers.slice(i, i + 2));
  }
  const FIXED_PAGES_COUNT = 3; // carta de tragos + menú de comida + cartel QR
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
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">N° de Mesas</Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={numMesas}
              onChange={e => setNumMesas(Math.max(1, Math.min(99, Number(e.target.value))))}
              className="w-20 h-9"
            />
          </div>

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

      {/* ── Hint + Quick links ── */}
      <div className="max-w-5xl mx-auto px-4 py-4 print:hidden space-y-3">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            Haz clic en <strong>Descargar Kit PDF</strong> para generar las {totalPages} páginas A4 listas para imprimir y
            cortar. Cada hoja incluye 2 tarjetas de 10×15 cm con guías de corte. Para editar cada pieza en detalle
            usa los accesos rápidos de abajo.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: `carta-tragos?fiestaId=${fiestaId}`, label: 'Carta de Tragos', icon: GlassWater, cls: 'text-violet-600 bg-violet-50 border-violet-200' },
            { href: `menu-mesa?fiestaId=${fiestaId}`, label: 'Menú de Mesa', icon: Utensils, cls: 'text-orange-600 bg-orange-50 border-orange-200' },
            { href: `/evento/muro-en-vivo/${fiestaId}`, label: 'Ver Muro Social', icon: QrCode, cls: 'text-blue-600 bg-blue-50 border-blue-200', external: true },
            { href: `invitados/numeros-mesa?fiestaId=${fiestaId}`, label: 'Números de Mesa', icon: Hash, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href.startsWith('/') ? item.href : `/fiestas/nueva/${item.href}`}
              target={item.external ? '_blank' : undefined}
            >
              <Card className={cn('border cursor-pointer hover:shadow-md transition-shadow', item.cls)}>
                <CardContent className="p-3 flex items-center gap-2">
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">{item.label}</span>
                  {item.external && <ExternalLink className="w-3 h-3 ml-auto shrink-0" />}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
          Vista previa · {numMesas} mesas · {totalPages} páginas A4
        </p>
      </div>

      {/* ════════════════════════════════════════════
          PRINTABLE AREA – all A4 pages
      ════════════════════════════════════════════ */}
      <div className="flex flex-col items-center gap-8 py-4 print:py-0 print:gap-0">

        {/* PAGE 1 – Carta de Tragos (×2) */}
        <A4Page>
          <CardFrame>
            <CartaTragosMenu fiesta={fiesta} carta={cartaTragos} isPreview={false} />
          </CardFrame>
          <CardFrame>
            <CartaTragosMenu fiesta={fiesta} carta={cartaTragos} isPreview={false} />
          </CardFrame>
        </A4Page>

        {/* PAGE 2 – Menú de Comida (×2) */}
        <A4Page>
          <CardFrame>
            <MenuMesaTemplate fiesta={fiesta} data={menuMesa} logoUrl={logoUrl} isPreview={false} />
          </CardFrame>
          <CardFrame>
            <MenuMesaTemplate fiesta={fiesta} data={menuMesa} logoUrl={logoUrl} isPreview={false} />
          </CardFrame>
        </A4Page>

        {/* PAGE 3 – Cartel QR Social Wall (×2) */}
        <A4Page>
          <CardFrame>
            <QRCartel fiestaId={fiestaId!} primaryColor={primaryColor} protagonistaFotoUrl={protagonistaFotoUrl || undefined} nombreEvento={nombreEvento} />
          </CardFrame>
          <CardFrame>
            <QRCartel fiestaId={fiestaId!} primaryColor={primaryColor} protagonistaFotoUrl={protagonistaFotoUrl || undefined} nombreEvento={nombreEvento} />
          </CardFrame>
        </A4Page>

        {/* PAGES 4+ – Números de Mesa (2 per page) */}
        {tablePages.map((pair, pageIdx) => (
          <A4Page key={`mesa-page-${pageIdx}`} isLast={pageIdx === tablePages.length - 1}>
            {pair.map(n => (
              <CardFrame key={`mesa-${n}`}>
                <TableNumberCard
                  tableNumber={n}
                  primaryColor={primaryColor}
                  protagonistaFotoUrl={protagonistaFotoUrl || undefined}
                  nombreEvento={nombreEvento}
                  tipoCelebracion={tipoCelebracion}
                />
              </CardFrame>
            ))}
            {pair.length === 1 && (
              <div style={{ width: '10cm', height: '15cm' }} />
            )}
          </A4Page>
        ))}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@400;700&display=swap');
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
