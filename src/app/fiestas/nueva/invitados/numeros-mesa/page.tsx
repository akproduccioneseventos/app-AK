
'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Printer as PrinterIcon, Save, Loader2, Plus, Minus, Download, Tag, Info, Search } from 'lucide-react';
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

const formatDate = (dateString?: string) => {
  if (!dateString) return "____________";
  try {
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch (e) {
    return "Fecha inválida";
  }
};

const FONT_SIZE_MAP: Record<string, string> = {
  small:  '48pt',
  medium: '72pt',
  large:  '96pt',
  xlarge: '120pt',
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
}> = ({ fiesta, data, logoUrl, tableNumber, customLabel, inverted }) => {
  const protagonistaNombre = data.protagonistaNombre || fiesta.configuracion.protagonista1Nombre || 'Protagonista';
  const eventDate = data.fechaEvento || formatDate(fiesta.configuracion.fechaEvento);
  const fontSize = FONT_SIZE_MAP[data.fontSize ?? 'medium'] ?? '72pt';
  const numberColor = data.numberColor || '#475569';
  const bgColor = data.cardBgColor || '#ffffff';

  return (
    <div className={cn(
        "w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-4", 
        inverted && 'transform rotate-180'
    )} style={{ backgroundColor: bgColor }}>
        {/* Background Image (Floral Frame) when no custom bg */}
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
            <h2 className="font-playfair italic leading-none mb-2 drop-shadow-sm" style={{ fontSize, color: numberColor }}>
                Mesa {tableNumber}
            </h2>
            <div className="space-y-0.5">
                <p className="font-headline text-3xl uppercase tracking-[0.1em] font-medium text-slate-800">
                    {protagonistaNombre}
                </p>
                <p className="font-body text-xl font-medium italic text-slate-600">
                    {eventDate}
                </p>
                {customLabel && (
                    <div className="mt-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                            {customLabel}
                        </Badge>
                    </div>
                )}
            </div>
        </div>

        {logoUrl && (
             <div className={cn("absolute w-16 h-16 z-20", inverted ? 'top-6 left-6' : 'bottom-6 right-6')}>
                <NextImage 
                    src={logoUrl} 
                    alt="logo" 
                    width={64} 
                    height={64} 
                    className="object-contain" 
                />
             </div>
        )}
    </div>
  );
};

function NumerosDeMesaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [data, setData] = useState<NumerosMesaData>(defaultNumerosMesaData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tableCount, setTableCount] = useState(20);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([
          getFiestaById(fiestaId), 
          getInvoiceTemplateSettings()
      ]);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl || null);

      const mergedData = { 
          ...defaultNumerosMesaData, 
          labels: {},
          ...(fiestaData.numerosMesa || {}) 
      };
      if (!mergedData.protagonistaNombre) {
        mergedData.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre || 'Protagonista';
      }
      if (!mergedData.fechaEvento) {
        mergedData.fechaEvento = formatDate(fiestaData.configuracion.fechaEvento);
      }
      setData(mergedData);
      
      const tables = fiestaData.decoracion?.salonElements?.filter(el => el.category?.toLowerCase().includes('mesa')) || [];
      if (tables.length > 0) {
          setTableCount(tables.length);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateNumerosMesaAction(fiestaId, data);
      if (result.success) {
        toast({ title: "¡Configuración Guardada!" });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
       toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  const handlePrint = () => window.print();

  const handleLabelChange = (tableNum: number, label: string) => {
      setData(prev => ({
          ...prev,
          labels: {
              ...(prev.labels || {}),
              [tableNum]: label
          }
      }));
  };

  if (isLoading || !fiesta) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  
  return (
    <div className="bg-slate-100 min-h-screen flex flex-col md:flex-row">
        {/* Sidebar Settings */}
        <div className="w-full md:w-80 bg-white border-r p-6 space-y-6 overflow-y-auto print:hidden shrink-0 h-screen">
            <div className="flex items-center gap-3 mb-2">
                <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5"/></Button></Link>
                <h1 className="font-headline text-xl font-bold text-slate-800">Torres de Mesa A4</h1>
            </div>

            <Separator/>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cantidad de Mesas</Label>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setTableCount(Math.max(1, tableCount - 1))}><Minus className="w-4 h-4"/></Button>
                        <Input type="number" value={tableCount} onChange={e => setTableCount(parseInt(e.target.value) || 1)} className="text-center font-bold text-lg"/>
                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setTableCount(tableCount + 1)}><Plus className="w-4 h-4"/></Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre en Tarjeta</Label>
                    <Input 
                        value={data.protagonistaNombre} 
                        onChange={e => setData({...data, protagonistaNombre: e.target.value})}
                        placeholder="Nombre protagonista"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha en Tarjeta</Label>
                    <Input 
                        value={data.fechaEvento} 
                        onChange={e => setData({...data, fechaEvento: e.target.value})}
                        placeholder="DD/MM/YY"
                    />
                </div>

                <Separator/>

                {/* Styling Controls */}
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tamaño del Número</Label>
                    <Select
                        value={data.fontSize ?? 'medium'}
                        onValueChange={val => setData({ ...data, fontSize: val as NumerosMesaData['fontSize'] })}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Tamaño" />
                        </SelectTrigger>
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
                                    "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                                    data.numberColor === preset.value ? "border-primary ring-2 ring-primary ring-offset-1" : "border-white shadow"
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
                                    "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                                    data.cardBgColor === preset.value ? "border-primary ring-2 ring-primary ring-offset-1" : "border-slate-200 shadow"
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

                <Separator/>
                
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etiquetas de Mesa</Label>
                    <ScrollArea className="h-48 pr-3">
                        <div className="space-y-2">
                            {Array.from({ length: tableCount }).map((_, i) => (
                                <div key={i+1} className="space-y-1">
                                    <Label className="text-[9px] font-bold text-slate-500">MESA {i+1}</Label>
                                    <Input 
                                        size={1}
                                        value={data.labels?.[i+1] || ''} 
                                        onChange={e => handleLabelChange(i+1, e.target.value)}
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
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    Guardar Datos
                </Button>
                <Button onClick={handlePrint} variant="secondary" className="w-full rounded-xl h-12 font-bold">
                    <PrinterIcon className="w-4 h-4 mr-2"/> 🖨️ Imprimir en A4
                </Button>
            </div>
        </div>

        {/* Print Canvas */}
        <div className="flex-1 flex flex-col items-center py-8 gap-12 bg-slate-200 print:bg-white print:gap-0 print:py-0 overflow-y-auto">
            <div className="max-w-4xl w-full p-4 print:hidden">
                <Alert className="bg-blue-50 border-blue-200 shadow-sm">
                    <Info className="w-4 h-4 text-blue-600"/>
                    <AlertTitle className="text-blue-800 font-bold">Layout Torre Triangular A4</AlertTitle>
                    <AlertDescription className="text-xs text-blue-700 space-y-1">
                        <p>1. Imprime 2 números por hoja en papel A4 (cartulina recomendada).</p>
                        <p>2. Corta por la línea negra central.</p>
                        <p>3. Dobla por las 3 líneas punteadas para formar la torre/prisma.</p>
                    </AlertDescription>
                </Alert>
            </div>

            {Array.from({ length: Math.ceil(tableCount / 2) }).map((_, pageIndex) => {
                const tableNum1 = pageIndex * 2 + 1;
                const tableNum2 = pageIndex * 2 + 2;

                return (
                    <div key={pageIndex} className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none print:break-after-page flex flex-row p-0 border border-slate-300 print:border-none overflow-hidden">
                        {/* Columna 1 (Mesa Impar) */}
                        <div className="w-[105mm] h-full border-r border-black flex flex-col">
                            {/* Segmento 1: Pestaña Fina (30mm) */}
                            <div className="h-[30mm] w-full border-b border-dashed border-slate-300 bg-slate-50/20"></div>
                            {/* Segmento 2: Base Blanca (87mm) */}
                            <div className="h-[87mm] w-full border-b border-dashed border-slate-300 bg-white"></div>
                            {/* Segmento 3: Diseño Invertido (90mm) */}
                            <div className="h-[90mm] w-full border-b border-dashed border-slate-300">
                                <TableCardFace tableNumber={tableNum1} fiesta={fiesta} data={data} logoUrl={logoUrl} customLabel={data.labels?.[tableNum1]} inverted />
                            </div>
                            {/* Segmento 4: Diseño Normal (90mm) */}
                            <div className="h-[90mm] w-full">
                                <TableCardFace tableNumber={tableNum1} fiesta={fiesta} data={data} logoUrl={logoUrl} customLabel={data.labels?.[tableNum1]} />
                            </div>
                        </div>

                        {/* Columna 2 (Mesa Par) */}
                        <div className="w-[105mm] h-full flex flex-col">
                            {tableNum2 <= tableCount ? (
                                <>
                                    <div className="h-[30mm] w-full border-b border-dashed border-slate-300 bg-slate-50/20"></div>
                                    <div className="h-[87mm] w-full border-b border-dashed border-slate-300 bg-white"></div>
                                    <div className="h-[90mm] w-full border-b border-dashed border-slate-300">
                                        <TableCardFace tableNumber={tableNum2} fiesta={fiesta} data={data} logoUrl={logoUrl} customLabel={data.labels?.[tableNum2]} inverted />
                                    </div>
                                    <div className="h-[90mm] w-full">
                                        <TableCardFace tableNumber={tableNum2} fiesta={fiesta} data={data} logoUrl={logoUrl} customLabel={data.labels?.[tableNum2]} />
                                    </div>
                                </>
                            ) : (
                                <div className="h-full bg-slate-50 flex items-center justify-center opacity-10">
                                    <PrinterIcon className="w-32 h-32 text-slate-300"/>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
            
            @media print {
                body { -webkit-print-color-adjust: exact; color-adjust: exact; background: white !important; }
                .sidebar, header, nav, button, .no-print, .notifications-hub, .sidebar-inset > header, .fixed-footer, aside { display: none !important ; }
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
        <Suspense fallback={<div className="flex justify-center p-8 h-screen items-center"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}>
            <NumerosDeMesaContent/>
        </Suspense>
    )
}
