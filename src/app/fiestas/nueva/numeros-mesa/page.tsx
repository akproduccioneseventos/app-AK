

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft, Printer as PrinterIcon, Save, Loader2, Plus, Minus,
  Info, Eye, X, LayoutGrid, Rows2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, NumerosMesaData } from '@/types/fiesta';
import { getFiestaById, updateNumerosMesa as updateNumerosMesaAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { defaultNumerosMesaData } from '@/lib/fiesta-defaults';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const formatDate = (dateString?: string) => {
  if (!dateString) return '____________';
  try {
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return 'Fecha inválida';
  }
};

const FONT_SIZE_MAP: Record<string, string> = {
  small:  '48pt',
  medium: '72pt',
  large:  '96pt',
  xlarge: '120pt',
};

const FONT_SIZE_MAP_SMALL: Record<string, string> = {
  small:  '24pt',
  medium: '36pt',
  large:  '48pt',
  xlarge: '56pt',
};

const BG_COLOR_PRESETS = [
  { label: 'Blanco', value: '#ffffff' },
  { label: 'Crema', value: '#fdf8f0' },
  { label: 'Rosa', value: '#fce7f3' },
  { label: 'Lavanda', value: '#ede9fe' },
  { label: 'Celeste', value: '#e0f2fe' },
  { label: 'Verde Menta', value: '#d1fae5' },
  { label: 'Dorado', value: '#fef3c7' },
  { label: 'Gris Claro', value: '#f1f5f9' },
];

const NUMBER_COLOR_PRESETS = [
  { label: 'Gris Pizarra', value: '#475569' },
  { label: 'Negro', value: '#1e293b' },
  { label: 'Violeta', value: '#7c3aed' },
  { label: 'Dorado', value: '#b45309' },
  { label: 'Rosa', value: '#db2777' },
  { label: 'Azul', value: '#1d4ed8' },
  { label: 'Verde', value: '#15803d' },
  { label: 'Rojo', value: '#dc2626' },
];

const TableCardFace: React.FC<{
  fiesta: FiestaEnPlanificacion;
  data: NumerosMesaData;
  logoUrl: string | null;
  tableNumber: number;
  customLabel?: string;
  inverted?: boolean;
  small?: boolean;
}> = ({ fiesta, data, logoUrl, tableNumber, customLabel, inverted, small }) => {
  const protagonistaNombre = data.protagonistaNombre || fiesta.configuracion.protagonista1Nombre || 'Protagonista';
  const eventDate = data.fechaEvento || formatDate(fiesta.configuracion.fechaEvento);
  const fontSize = small
    ? (FONT_SIZE_MAP_SMALL[data.fontSize ?? 'medium'] ?? '36pt')
    : (FONT_SIZE_MAP[data.fontSize ?? 'medium'] ?? '72pt');
  const numberColor = data.numberColor || '#475569';
  const bgColor = data.cardBgColor || '#ffffff';

  return (
    <div
      className={cn(
        'w-full h-full relative overflow-hidden flex flex-col items-center justify-center',
        small ? 'p-2' : 'p-4',
        inverted && 'transform rotate-180',
      )}
      style={{ backgroundColor: bgColor }}
    >
      {!data.cardBgColor && (
        <div className="absolute inset-0 opacity-100 -z-10">
          <NextImage
            src="https://picsum.photos/seed/lilies-frame/800/600"
            layout="fill"
            objectFit="cover"
            alt=""
            data-ai-hint="white lilies flowers border frame"
          />
        </div>
      )}

      <div className="text-center z-10 space-y-1">
        <h2
          className="font-playfair italic leading-none mb-2 drop-shadow-sm"
          style={{ fontSize, color: numberColor }}
        >
          Mesa {tableNumber}
        </h2>
        <div className="space-y-0.5">
          <p className={cn('font-headline uppercase tracking-[0.1em] font-medium text-slate-800', small ? 'text-base' : 'text-3xl')}>
            {protagonistaNombre}
          </p>
          <p className={cn('font-body font-medium italic text-slate-600', small ? 'text-xs' : 'text-xl')}>
            {eventDate}
          </p>
          {customLabel && (
            <div className="mt-1">
              <Badge
                variant="outline"
                className={cn('bg-primary/5 text-primary border-primary/20 font-bold rounded-full uppercase tracking-widest', small ? 'text-[8px] px-2 py-0.5' : 'text-xs px-4 py-1')}
              >
                {customLabel}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {logoUrl && (
        <div className={cn('absolute z-20', inverted ? (small ? 'top-2 left-2' : 'top-6 left-6') : (small ? 'bottom-2 right-2' : 'bottom-6 right-6'))}>
          <NextImage
            src={logoUrl}
            alt="logo"
            width={small ? 32 : 64}
            height={small ? 32 : 64}
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
};

// 2-per-page tent column (full height A4)
const TentColumn: React.FC<{
  tableNumber: number;
  fiesta: FiestaEnPlanificacion;
  data: NumerosMesaData;
  logoUrl: string | null;
}> = ({ tableNumber, fiesta, data, logoUrl }) => (
  <div className="w-[105mm] h-full flex flex-col">
    <div className="h-[30mm] w-full border-b border-dashed border-slate-300 bg-slate-50/20" />
    <div className="h-[87mm] w-full border-b border-dashed border-slate-300 bg-white" />
    <div className="h-[90mm] w-full border-b border-dashed border-slate-300">
      <TableCardFace tableNumber={tableNumber} fiesta={fiesta} data={data} logoUrl={logoUrl} customLabel={data.labels?.[tableNumber]} inverted />
    </div>
    <div className="h-[90mm] w-full">
      <TableCardFace tableNumber={tableNumber} fiesta={fiesta} data={data} logoUrl={logoUrl} customLabel={data.labels?.[tableNumber]} />
    </div>
  </div>
);

// 4-per-page tent column (half height)
const TentColumnSmall: React.FC<{
  tableNumber: number;
  fiesta: FiestaEnPlanificacion;
  data: NumerosMesaData;
  logoUrl: string | null;
}> = ({ tableNumber, fiesta, data, logoUrl }) => (
  <div className="w-[105mm] h-[148.5mm] flex flex-col border-b border-black">
    <div className="h-[15mm] w-full border-b border-dashed border-slate-300 bg-slate-50/20" />
    <div className="h-[43.5mm] w-full border-b border-dashed border-slate-300 bg-white" />
    <div className="h-[45mm] w-full border-b border-dashed border-slate-300">
      <TableCardFace tableNumber={tableNumber} fiesta={fiesta} data={data} logoUrl={logoUrl} customLabel={data.labels?.[tableNumber]} inverted small />
    </div>
    <div className="h-[45mm] w-full">
      <TableCardFace tableNumber={tableNumber} fiesta={fiesta} data={data} logoUrl={logoUrl} customLabel={data.labels?.[tableNumber]} small />
    </div>
  </div>
);

function NumerosDeMesaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [data, setData] = useState<NumerosMesaData>(defaultNumerosMesaData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tableCount, setTableCount] = useState(20);
  const [layoutMode, setLayoutMode] = useState<'2-per-page' | '4-per-page'>('2-per-page');
  const [previewTable, setPreviewTable] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([
        getFiestaById(fiestaId),
        getInvoiceTemplateSettings(),
      ]);
      if (!fiestaData) throw new Error('Fiesta no encontrada');
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl || null);
      const mergedData: NumerosMesaData = {
        ...defaultNumerosMesaData,
        labels: {},
        ...(fiestaData.numerosMesa || {}),
      };
      if (!mergedData.protagonistaNombre) {
        mergedData.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre || 'Protagonista';
      }
      if (!mergedData.fechaEvento) {
        mergedData.fechaEvento = formatDate(fiestaData.configuracion.fechaEvento);
      }
      setData(mergedData);
      const tables = fiestaData.decoracion?.salonElements?.filter(el => el.category?.toLowerCase().includes('mesa')) || [];
      if (tables.length > 0) setTableCount(tables.length);
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error al cargar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateNumerosMesaAction(fiestaId, data);
      if (result.success) {
        toast({ title: '¡Configuración Guardada!' });
      } else {
        throw new Error((result as { success: false; error?: string }).error);
      }
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => window.print();

  const handleLabelChange = (tableNum: number, label: string) => {
    setData(prev => ({ ...prev, labels: { ...(prev.labels || {}), [tableNum]: label } }));
  };

  if (isLoading || !fiesta) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const pagesFor2 = Math.ceil(tableCount / 2);
  const pagesFor4 = Math.ceil(tableCount / 4);

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Settings */}
      <div className="w-full md:w-80 bg-white border-r p-6 space-y-6 overflow-y-auto print:hidden shrink-0 h-screen">
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-headline text-xl font-bold text-slate-800">Torres de Mesa A4</h1>
        </div>

        <Separator />

        {/* Layout Toggle */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Números por Hoja
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={layoutMode === '2-per-page' ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={() => setLayoutMode('2-per-page')}
            >
              <Rows2 className="w-3 h-3" /> 2 por hoja
            </Button>
            <Button
              variant={layoutMode === '4-per-page' ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={() => setLayoutMode('4-per-page')}
            >
              <LayoutGrid className="w-3 h-3" /> 4 por hoja
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cantidad de Mesas</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setTableCount(Math.max(1, tableCount - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={tableCount}
                onChange={e => setTableCount(parseInt(e.target.value) || 1)}
                className="text-center font-bold text-lg"
              />
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setTableCount(tableCount + 1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre en Tarjeta</Label>
            <Input
              value={data.protagonistaNombre}
              onChange={e => setData({ ...data, protagonistaNombre: e.target.value })}
              placeholder="Nombre protagonista"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha en Tarjeta</Label>
            <Input
              value={data.fechaEvento}
              onChange={e => setData({ ...data, fechaEvento: e.target.value })}
              placeholder="DD/MM/YY"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tamaño del Número</Label>
            <Select
              value={data.fontSize ?? 'medium'}
              onValueChange={val => setData({ ...data, fontSize: val as NumerosMesaData['fontSize'] })}
            >
              <SelectTrigger className="h-9"><SelectValue placeholder="Tamaño" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeño (48pt)</SelectItem>
                <SelectItem value="medium">Mediano (72pt)</SelectItem>
                <SelectItem value="large">Grande (96pt)</SelectItem>
                <SelectItem value="xlarge">Extra Grande (120pt)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Color del Número</Label>
            <div className="flex flex-wrap gap-2">
              {NUMBER_COLOR_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => setData({ ...data, numberColor: preset.value })}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                    data.numberColor === preset.value ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-white shadow',
                  )}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
              <input
                type="color"
                title="Color personalizado"
                value={data.numberColor || '#475569'}
                onChange={e => setData({ ...data, numberColor: e.target.value })}
                className="w-7 h-7 rounded-full cursor-pointer border border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Color de Fondo de Tarjeta</Label>
            <div className="flex flex-wrap gap-2">
              {BG_COLOR_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => setData({ ...data, cardBgColor: preset.value })}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                    data.cardBgColor === preset.value ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-slate-200 shadow',
                  )}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
              <input
                type="color"
                title="Color personalizado"
                value={data.cardBgColor || '#ffffff'}
                onChange={e => setData({ ...data, cardBgColor: e.target.value })}
                className="w-7 h-7 rounded-full cursor-pointer border border-slate-200"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etiquetas de Mesa</Label>
            <ScrollArea className="h-48 pr-3">
              <div className="space-y-2">
                {Array.from({ length: tableCount }).map((_, i) => (
                  <div key={i + 1} className="space-y-1">
                    <Label className="text-[9px] font-bold text-slate-500">MESA {i + 1}</Label>
                    <Input
                      size={1}
                      value={data.labels?.[i + 1] || ''}
                      onChange={e => handleLabelChange(i + 1, e.target.value)}
                      placeholder="Ej: Familia, Trabajo..."
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button onClick={handleSave} disabled={isSaving} className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Datos
          </Button>
          <Button onClick={handlePrint} variant="secondary" className="w-full rounded-xl h-12 font-bold">
            <PrinterIcon className="w-4 h-4 mr-2" /> 🖨️ Imprimir en A4
          </Button>
        </div>
      </div>

      {/* Print Canvas */}
      <div className="flex-1 flex flex-col items-center py-8 gap-12 bg-slate-200 print:bg-white print:gap-0 print:py-0 overflow-y-auto">
        <div className="max-w-4xl w-full p-4 print:hidden">
          <Alert className="bg-blue-50 border-blue-200 shadow-sm">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertTitle className="text-blue-800 font-bold">
              {layoutMode === '2-per-page' ? 'Layout Torre Triangular A4 · 2 por hoja' : 'Layout Torre Triangular A4 · 4 por hoja'}
            </AlertTitle>
            <AlertDescription className="text-xs text-blue-700 space-y-1">
              <p>1. Imprime {layoutMode === '2-per-page' ? '2' : '4'} números por hoja en papel A4 (cartulina recomendada).</p>
              <p>2. Corta por la línea negra central.</p>
              <p>3. Dobla por las 3 líneas punteadas para formar la torre/prisma.</p>
              <p>4. Haz clic en el ícono <Eye className="inline w-3 h-3" /> para previsualizar e imprimir una mesa individual.</p>
            </AlertDescription>
          </Alert>
        </div>

        {/* 2-per-page layout */}
        {layoutMode === '2-per-page' && Array.from({ length: pagesFor2 }).map((_, pageIndex) => {
          const tableNum1 = pageIndex * 2 + 1;
          const tableNum2 = pageIndex * 2 + 2;

          return (
            <div key={pageIndex} className="relative group">
              {/* Per-page preview buttons (hidden in print) */}
              <div className="print:hidden absolute -top-8 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => setPreviewTable(tableNum1)}>
                  <Eye className="w-3 h-3" /> Mesa {tableNum1}
                </Button>
                {tableNum2 <= tableCount && (
                  <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => setPreviewTable(tableNum2)}>
                    <Eye className="w-3 h-3" /> Mesa {tableNum2}
                  </Button>
                )}
              </div>
              <div className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none print:break-after-page flex flex-row p-0 border border-slate-300 print:border-none overflow-hidden">
                {/* Columna 1 */}
                <div className="border-r border-black">
                  <TentColumn tableNumber={tableNum1} fiesta={fiesta} data={data} logoUrl={logoUrl} />
                </div>
                {/* Columna 2 */}
                {tableNum2 <= tableCount ? (
                  <TentColumn tableNumber={tableNum2} fiesta={fiesta} data={data} logoUrl={logoUrl} />
                ) : (
                  <div className="w-[105mm] h-full bg-slate-50 flex items-center justify-center opacity-10">
                    <PrinterIcon className="w-32 h-32 text-slate-300" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 4-per-page layout */}
        {layoutMode === '4-per-page' && Array.from({ length: pagesFor4 }).map((_, pageIndex) => {
          const nums = [
            pageIndex * 4 + 1,
            pageIndex * 4 + 2,
            pageIndex * 4 + 3,
            pageIndex * 4 + 4,
          ];

          return (
            <div key={pageIndex} className="relative group">
              <div className="print:hidden absolute -top-8 right-0 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {nums.filter(n => n <= tableCount).map(n => (
                  <Button key={n} size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => setPreviewTable(n)}>
                    <Eye className="w-3 h-3" /> Mesa {n}
                  </Button>
                ))}
              </div>
              <div className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none print:break-after-page grid grid-cols-2 p-0 border border-slate-300 print:border-none overflow-hidden">
                {nums.map((n, idx) => (
                  n <= tableCount ? (
                    <div key={n} className={cn('flex flex-col border-black', idx % 2 === 0 ? 'border-r' : '')}>
                      <TentColumnSmall tableNumber={n} fiesta={fiesta} data={data} logoUrl={logoUrl} />
                    </div>
                  ) : (
                    <div key={n} className={cn('bg-slate-50 flex items-center justify-center opacity-10 border-black', idx % 2 === 0 ? 'border-r' : '')}>
                      <PrinterIcon className="w-16 h-16 text-slate-300" />
                    </div>
                  )
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Preview Modal */}
      <Dialog open={previewTable !== null} onOpenChange={open => !open && setPreviewTable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Vista Individual · Mesa {previewTable}</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewTable(null)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewTable !== null && fiesta && (
            <div className="space-y-4">
              <div className="mx-auto" style={{ width: '10cm', height: '15cm', border: '1px dashed #cbd5e1', position: 'relative' }}>
                <TableCardFace
                  tableNumber={previewTable}
                  fiesta={fiesta}
                  data={data}
                  logoUrl={logoUrl}
                  customLabel={data.labels?.[previewTable]}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                10 cm × 15 cm · Formato tarjeta individual
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  printWindow.document.write(`
                    <html><head><title>Mesa ${previewTable}</title>
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
                      body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f1f5f9; }
                      @page { size: 10cm 15cm; margin: 0; }
                      .card { width: 10cm; height: 15cm; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${data.cardBgColor || '#fff'}; padding: 1cm; text-align: center; }
                      h2 { font-family: 'Playfair Display', serif; font-style: italic; font-size: ${FONT_SIZE_MAP[data.fontSize ?? 'medium']}; color: ${data.numberColor || '#475569'}; margin: 0 0 0.5cm 0; line-height: 1; }
                      p { margin: 0.15cm 0; font-family: sans-serif; }
                      .name { font-size: 1.2em; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #1e293b; }
                      .date { font-size: 0.9em; color: #64748b; font-style: italic; }
                    </style></head>
                    <body><div class="card">
                      <h2>Mesa ${previewTable}</h2>
                      <p class="name">${data.protagonistaNombre || fiesta?.configuracion.protagonista1Nombre || ''}</p>
                      <p class="date">${data.fechaEvento || ''}</p>
                      ${data.labels?.[previewTable] ? `<p style="font-size:0.75em;border:1px solid currentColor;padding:0.1cm 0.3cm;border-radius:999px;margin-top:0.3cm;color:${data.numberColor || '#475569'}">${data.labels[previewTable]}</p>` : ''}
                    </div></body></html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }}
              >
                <PrinterIcon className="w-4 h-4 mr-2" /> Imprimir esta mesa
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        @media print {
          body { -webkit-print-color-adjust: exact; color-adjust: exact; background: white !important; }
          .sidebar, header, nav, button, .no-print, .notifications-hub, .sidebar-inset > header, .fixed-footer, aside { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
          main { padding: 0 !important; margin: 0 !important; }
          .print-main-override { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

export default function NumerosMesaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8 h-screen items-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <NumerosDeMesaContent />
    </Suspense>
  );
}

