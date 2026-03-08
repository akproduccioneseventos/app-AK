
'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Save, Loader2, Plus, Minus, Scissors, Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, NumerosMesaData } from '@/types/fiesta';
import { getFiestaById, updateNumerosMesa as updateNumerosMesaAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultNumerosMesaData } from '@/lib/fiesta-defaults';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';

const formatDate = (dateString?: string) => {
  if (!dateString) return "____________";
  try {
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return "Fecha inválida";
  }
};

const Ornament: React.FC<{ position: string; color: string }> = ({ position, color }) => {
    const baseClasses = "absolute w-12 h-12 border-2";
    const positionClasses = {
        'top-left': 'top-4 left-4 border-t-0 border-r-0',
        'top-right': 'top-4 right-4 border-t-0 border-l-0',
        'bottom-left': 'bottom-4 left-4 border-b-0 border-r-0',
        'bottom-right': 'bottom-4 right-4 border-b-0 border-l-0',
    };
    const innerClasses = "absolute w-6 h-6 border-2";
    const innerPositionClasses = {
        'top-left': 'top-[-2px] left-[-2px] border-t-0 border-r-0',
        'top-right': 'top-[-2px] right-[-2px] border-t-0 border-l-0',
        'bottom-left': 'bottom-[-2px] left-[-2px] border-b-0 border-r-0',
        'bottom-right': 'bottom-[-2px] right-[-2px] border-b-0 border-l-0',
    }

    return (
        <div className={cn(baseClasses, positionClasses[position as keyof typeof positionClasses])} style={{ borderColor: color }}>
            <div className={cn(innerClasses, innerPositionClasses[position as keyof typeof innerPositionClasses])} style={{ borderColor: color }} />
        </div>
    );
};

const TableNumberComponent: React.FC<{
  fiesta: FiestaEnPlanificacion;
  data: NumerosMesaData;
  logoUrl: string | null;
  tableNumber: number;
  inverted?: boolean;
}> = ({ fiesta, data, logoUrl, tableNumber, inverted }) => {
  
  const protagonistaNombre = data.protagonistaNombre || fiesta.configuracion.protagonista1Nombre || 'Protagonista';
  const eventDate = data.fechaEvento || formatDate(fiesta.configuracion.fechaEvento);

  return (
    <div className={cn(
        "w-full h-full relative bg-white overflow-hidden flex flex-col items-center justify-center border", 
        inverted && 'transform rotate-180'
    )} style={{ borderColor: `${data.colorPrincipal}40` }}>
        
        <Ornament position="top-left" color={data.colorPrincipal} />
        <Ornament position="top-right" color={data.colorPrincipal} />
        <Ornament position="bottom-left" color={data.colorPrincipal} />
        <Ornament position="bottom-right" color={data.colorPrincipal} />

        {data.backgroundImageUrl && (
            <div className="absolute inset-0 opacity-15 -z-10">
                <NextImage src={data.backgroundImageUrl} layout="fill" objectFit="cover" alt="" />
            </div>
        )}

        <div className="text-center p-8 z-10">
            <h2 className="font-dancing text-[130px] leading-none mb-4" style={{ color: data.colorPrincipal }}>
                {tableNumber}
            </h2>
            <div className="space-y-1">
                <p className="font-headline text-3xl uppercase tracking-[0.2em] font-bold" style={{ color: data.colorSecundario }}>
                    {protagonistaNombre}
                </p>
                <p className="font-body text-xl opacity-60 font-semibold italic" style={{ color: data.colorSecundario }}>
                    {eventDate}
                </p>
            </div>
        </div>

        {logoUrl && (
             <div className={cn("absolute w-20 h-20 z-20", inverted ? 'top-10 left-10' : 'bottom-10 right-10')}>
                <NextImage 
                    src={logoUrl} 
                    alt="logo" 
                    width={80} 
                    height={80} 
                    className="object-contain filter drop-shadow-sm" 
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
  const printRef = useRef<HTMLDivElement>(null);

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [data, setData] = useState<NumerosMesaData>(defaultNumerosMesaData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      const mergedData = { ...defaultNumerosMesaData, ...(fiestaData.numerosMesa || {}) };
      if (!mergedData.protagonistaNombre) {
        mergedData.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre || 'La Agasajada';
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
      setError("No se pudo cargar la información del evento.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleUpdate = (field: keyof NumerosMesaData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleBackgroundImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiestaId, file);
      if(result.success && result.url) {
        setData(prev => ({ ...prev, backgroundImageUrl: result.url }));
        toast({title: "Imagen de fondo actualizada"});
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al subir", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

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

  if (isLoading || !fiesta) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  
  return (
    <div className="bg-muted/30 min-h-screen">
        <div className="py-3 px-4 print:hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-background border-b sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
                <PrinterIcon className="w-6 h-6 text-primary"/>
                <h1 className="font-headline text-xl font-bold">Generador de Números de Mesa</h1>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              {/* Table Count Selector */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border">
                  <Label className="px-3 text-[10px] font-black uppercase text-slate-500">Cantidad de Mesas</Label>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTableCount(Math.max(1, tableCount - 1))}><Minus className="w-3 h-3"/></Button>
                  <Input 
                    type="number" 
                    value={tableCount} 
                    onChange={e => setTableCount(parseInt(e.target.value) || 1)}
                    className="w-12 h-8 text-center bg-transparent border-none font-bold p-0"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTableCount(tableCount + 1)}><Plus className="w-3 h-3"/></Button>
              </div>

              <div className="flex flex-col">
                <Label htmlFor="bg-image-upload" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Fondo Personalizado</Label>
                <Input id="bg-image-upload" type="file" accept="image/*" onChange={handleBackgroundImageUpload} className="text-xs w-40 h-8" disabled={isUploading}/>
              </div>
              
              <div className="flex flex-col">
                 <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Color Principal</Label>
                 <Input type="color" value={data.colorPrincipal || '#9333ea'} onChange={e => handleUpdate('colorPrincipal', e.target.value)} className="w-10 h-8 p-0.5"/>
              </div>

              <div className="flex items-end gap-2 ml-2">
                 <Button size="sm" onClick={handleSave} disabled={isSaving} title="Guardar cambios">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    Guardar
                 </Button>
                 <Button onClick={handlePrint} size="sm" variant="outline" title="Imprimir PDF" className="font-bold">
                    <PrinterIcon className="w-4 h-4 mr-2"/> IMPRIMIR
                 </Button>
                 <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4"/></Button></Link>
              </div>
            </div>
        </div>

        <div className="flex flex-col items-center py-8 gap-12 print:gap-0 print:py-0" ref={printRef}>
            {Array.from({ length: Math.ceil(tableCount / 2) }).map((_, pageIndex) => {
                const tableNum1 = pageIndex * 2 + 1;
                const tableNum2 = pageIndex * 2 + 2;

                return (
                    <div key={pageIndex} className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none print:break-after-page flex flex-col p-8 print:p-0">
                        <div className="flex-1 grid grid-cols-2 gap-8 print:gap-0">
                            {/* Mesa 1 de la página */}
                            <div className="flex flex-col h-full border border-dashed border-slate-200 print:border-none relative group">
                                <div className="flex-1">
                                    <TableNumberComponent tableNumber={tableNum1} inverted fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                                </div>
                                
                                {/* LÍNEA DE DOBLADO CENTRAL */}
                                <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dotted border-slate-300 z-30 pointer-events-none flex items-center justify-center">
                                    <div className="bg-white px-2 text-[8px] font-black text-slate-300 uppercase tracking-widest -mt-[1px] print:hidden">
                                        Línea de doblado
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <TableNumberComponent tableNumber={tableNum1} fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                                </div>
                            </div>

                            {/* Mesa 2 de la página (si existe) */}
                            {tableNum2 <= tableCount ? (
                                <div className="flex flex-col h-full border border-dashed border-slate-200 print:border-none relative">
                                    <div className="flex-1">
                                        <TableNumberComponent tableNumber={tableNum2} inverted fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                                    </div>
                                    
                                    <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dotted border-slate-300 z-30 pointer-events-none flex items-center justify-center">
                                        <div className="bg-white px-2 text-[8px] font-black text-slate-300 uppercase tracking-widest -mt-[1px] print:hidden">
                                            Línea de doblado
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <TableNumberComponent tableNumber={tableNum2} fiesta={fiesta} data={data} logoUrl={logoUrl}/>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center text-slate-300 font-black uppercase tracking-widest text-xs border border-dashed border-slate-200">
                                    <Scissors className="w-8 h-8 mb-2 opacity-20"/>
                                    Fin de lista
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
            
            @media print {
                body { -webkit-print-color-adjust: exact; color-adjust: exact; background: white !important; }
                .sidebar, header, nav, button, .no-print, .notifications-hub, .sidebar-inset > header, .fixed-footer { display: none !important ; }
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
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NumerosDeMesaContent/>
        </Suspense>
    )
}
