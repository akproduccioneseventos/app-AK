'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft, Printer as PrinterIcon, Save, Loader2, Download, Sparkles, FileDown, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, MenuMesaData, PapeleriaIAPieza } from '@/types/fiesta';
import { getFiestaParaPantalla, updateMenuMesa as updateMenuMesaAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getMenuById } from '@/app/actions/menus-catering';
import { quitarPapeleriaIAAction } from '@/app/actions/fiesta/papeleria-ia.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultMenuMesaData } from '@/lib/fiesta-defaults';
import { MenuMesaTemplate } from '@/components/invitacion/templates/MenuMesaTemplate';
import { PapeleriaIAModal } from './papeleria-ia-modal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  descargarPdfArchivo,
  generarPdfCuadritos10x15,
  imprimirPdfEnNavegador,
} from '@/lib/papeleria/pdf-impresion';
import { asegurarDataUrl, imagenUrlADataUrl } from '@/lib/papeleria/imagen-a-data-url';


function MenuDeMesaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const router = useRouter();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [data, setData] = useState<MenuMesaData>(defaultMenuMesaData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formatoHoja, setFormatoHoja] = useState<'a4-2-vertical' | 'a4-apaisado'>('a4-2-vertical');
  const [platosMenu, setPlatosMenu] = useState<
    Array<{ nombre: string; categoria?: string; type?: string; imageUrl?: string }> | undefined
  >(undefined);
  const [isIAModalOpen, setIsIAModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isQuittingIA, setIsQuittingIA] = useState(false);
  const [fondoPlantillaUrl, setFondoPlantillaUrl] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);


  const loadData = useCallback(async () => {
    if (!fiestaId) {
      toast({ title: "Error", description: "No se encontró ID de evento.", variant: "destructive" });
      router.push('/eventos');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [{ fiesta: fiestaData, fallo }, settings] = await Promise.all([getFiestaParaPantalla(fiestaId), getInvoiceTemplateSettings()]);
      if (fallo) {
        setError("No se pudo cargar la fiesta");
        return;
      }
      if (!fiestaData) {
        setFiesta(null);
        return;
      }
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl ?? null);

      if (fiestaData.menuAsignadoId) {
        const menuAsignado = await getMenuById(fiestaData.menuAsignadoId).catch(() => null);
        if (menuAsignado?.items?.length) {
          setPlatosMenu(
            menuAsignado.items.map((item) => ({
              nombre: item.name,
              categoria: item.type,
              type: item.type,
              imageUrl: item.imageUrl,
            })),
          );
        } else {
          setPlatosMenu(undefined);
        }
      } else {
        setPlatosMenu(undefined);
      }

      const mergedData = { ...defaultMenuMesaData, ...(fiestaData.menuMesa || {}) };
      lastSavedDataRef.current = mergedData;
      setData(mergedData);
    } catch (e: any) {
      setError("No se pudo cargar la fiesta");
      toast({ title: "Error", description: "No se pudo cargar la fiesta", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = (field: keyof Omit<MenuMesaData, 'paletaColores' | 'empresa'>, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent' | 'background', value: string) => {
    setData(prev => ({
        ...prev,
        paletaColores: {
            ...(prev.paletaColores || defaultMenuMesaData.paletaColores),
            [colorType]: value,
        }
    }));
  };

  const handleEmpresaUpdate = (field: keyof MenuMesaData['empresa'], value: string) => {
      setData(prev => ({ ...prev, empresa: { ...(prev.empresa || defaultMenuMesaData.empresa), [field]: value } }));
  }

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('folder', fiestaId);
      formData.append('file', file);
      const result = await uploadPublicPageAsset(formData);
      if(result.success && result.url) {
        setData(prev => ({ ...prev, protagonistaFotoUrl: result.url }));
        toast({title: "Foto actualizada"});
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al subir foto", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const lastSavedDataRef = React.useRef<MenuMesaData>(data);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await updateMenuMesaAction(fiestaId, data);
      if (result.success) {
        lastSavedDataRef.current = data;
        setSaveError(null);
        toast({ title: "¡Guardado!", description: "El menú de mesa ha sido actualizado." });
      } else {
        throw new Error(result.error || "No se pudo guardar la configuración.");
      }
    } catch (e: any) {
      // No descartar lo escrito: el usuario conserva su trabajo para corregirlo
      const msg = e.message || 'Error de conexión';
      setSaveError(msg);
      toast({
        title: "No se pudo guardar la configuración",
        description: `${msg}. El texto escrito se mantiene para que lo puedas corregir.`,
        variant: "destructive"
      });
    } finally {
        setIsSaving(false);
    }
  }

  const imagenIAUrl = fiesta?.papeleriaIA?.menuMesa?.url || null;

  const obtenerImagenParaPdf = async (): Promise<string> => {
    if (imagenIAUrl) {
      return await imagenUrlADataUrl(imagenIAUrl);
    }
    if (!printRef.current) {
      throw new Error('No se encontró la vista previa del menú de mesa.');
    }
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    return canvas.toDataURL('image/png');
  };

  const handlePrint = async () => {
    if (formatoHoja === 'a4-apaisado' && !imagenIAUrl) {
      window.print();
      return;
    }
    setIsExportingPdf(true);
    try {
      const dataUrl = await obtenerImagenParaPdf();
      if (formatoHoja === 'a4-2-vertical') {
        const pdf = generarPdfCuadritos10x15(dataUrl);
        imprimirPdfEnNavegador(pdf);
      } else {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210);
        imprimirPdfEnNavegador(pdf);
      }
    } catch (e: any) {
      toast({
        title: 'Error al imprimir PDF',
        description: e?.message || 'No se pudo preparar el PDF del menú de mesa.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const dataUrl = await obtenerImagenParaPdf();
      const nombreBase = `menu-mesa-${fiesta?.configuracion?.nombreEvento || fiestaId}.pdf`;
      if (formatoHoja === 'a4-2-vertical') {
        const pdf = generarPdfCuadritos10x15(dataUrl);
        descargarPdfArchivo(pdf, nombreBase);
      } else {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210);
        descargarPdfArchivo(pdf, nombreBase);
      }
      toast({ title: '¡Descarga iniciada!', description: 'El PDF del menú de mesa se está descargando.' });
    } catch (e: any) {
      toast({
        title: 'Error al generar PDF',
        description: e?.message || 'No se pudo crear el archivo PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleQuitarIA = async () => {
    if (!fiestaId || isQuittingIA) return;
    setIsQuittingIA(true);
    try {
      const res = await quitarPapeleriaIAAction({ fiestaId, pieza: 'menuMesa' });
      if (res.success) {
        setFiesta((prev) => {
          if (!prev) return prev;
          const nextPapeleria = { ...(prev.papeleriaIA || {}) };
          delete nextPapeleria.menuMesa;
          return { ...prev, papeleriaIA: nextPapeleria };
        });
        toast({ title: 'Volviste a la plantilla', description: 'Se quitó la versión generada con IA.' });
      } else {
        throw new Error(res.error || 'No se pudo volver a la plantilla.');
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo volver a la plantilla.',
        variant: 'destructive',
      });
    } finally {
      setIsQuittingIA(false);
    }
  };

  const handleIAGuardado = (
    piezaGuardada: PapeleriaIAPieza,
    meta?: { usarFondoEnPlantilla?: boolean; fondoBase64?: string },
  ) => {
    if (meta?.usarFondoEnPlantilla && meta.fondoBase64) {
      setFondoPlantillaUrl(asegurarDataUrl(meta.fondoBase64));
      toast({
        title: 'Seguimos con la plantilla',
        description: 'Se aplicó el fondo sugerido como respaldo visual.',
      });
      return;
    }

    setFondoPlantillaUrl(null);
    setFiesta((prev) =>
      prev
        ? {
            ...prev,
            papeleriaIA: {
              ...(prev.papeleriaIA || {}),
              menuMesa: piezaGuardada,
            },
          }
        : prev,
    );
  };

  const handleDownloadJpg = async () => {
    if (!printRef.current) return;
    toast({ title: "Generando imagen...", description: "Por favor, espera un momento."});
    try {
        const canvas = await html2canvas(printRef.current, {
            scale: 2, // Increase resolution
            useCORS: true, // For external images
            backgroundColor: '#ffffff',
        });
        const link = document.createElement('a');
        link.download = `menu-mesa-${fiesta?.configuracion.nombreEvento}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9); // Use jpeg format
        link.click();
        toast({ title: "¡Descarga iniciada!", description: "La imagen del menú se está descargando."});
    } catch(e) {
        toast({ title: "Error al generar imagen", description: "No se pudo crear el archivo JPG.", variant: "destructive"});
    }
  };


  if (isLoading) {
    return <div className="p-8 max-w-4xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-xl font-bold">No se pudo cargar la fiesta</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => loadData()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" /> Reintentar
        </Button>
      </div>
    );
  }
  if (!fiesta) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-xl font-bold">Fiesta no encontrada</h2>
        <p className="text-muted-foreground">La fiesta solicitada no existe o fue eliminada.</p>
        <Button asChild variant="outline"><Link href="/eventos">Volver a eventos</Link></Button>
      </div>
    );
  }

  return (
    <div className="bg-background print:bg-white">
        <div className="py-2 px-4 print:hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-card border-b border-border shadow-sm sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-lg">Editor de Menú de Mesa</h1>
              <Button asChild variant="ghost" size="sm">
                <Link href="/asistente">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-primary" />
                  Ver en Asistente AK
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
                <div className="space-y-1 min-w-[210px]">
                  <Label className="text-xs">Formato hoja</Label>
                  <Select value={formatoHoja} onValueChange={(value: 'a4-2-vertical' | 'a4-apaisado') => setFormatoHoja(value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4-2-vertical">2 por hoja A4 (10 × 15 vertical)</SelectItem>
                      <SelectItem value="a4-apaisado">A4 apaisado (anterior)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label htmlFor="protagonista-foto" className="text-xs">Foto</Label><Input id="protagonista-foto" type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs w-48" disabled={isUploading}/></div>
                <div className="space-y-1"><Label className="text-xs">Borde</Label><Input type="color" value={data.paletaColores?.primary || '#8b5cf6'} onChange={e => handleColorChange('primary', e.target.value)} className="w-10 h-9 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Título</Label><Input type="color" value={data.paletaColores?.accent || '#3b82f6'} onChange={e => handleColorChange('accent', e.target.value)} className="w-10 h-9 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Texto</Label><Input type="color" value={data.paletaColores?.secondary || '#4b5563'} onChange={e => handleColorChange('secondary', e.target.value)} className="w-10 h-9 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Fondo</Label><Input type="color" value={data.paletaColores?.background || '#ffffff'} onChange={e => handleColorChange('background', e.target.value)} className="w-10 h-9 p-0.5"/></div>

               <div className="flex flex-wrap items-end gap-2">
                 <Button
                   size="sm"
                   variant="secondary"
                   onClick={() => setIsIAModalOpen(true)}
                   title="Diseñar menú de mesa con IA"
                 >
                   <Sparkles className="w-4 h-4 mr-1.5 text-primary" />
                   Diseñar con IA
                 </Button>
                 <Button size="sm" onClick={handleSave} disabled={isSaving} title="Guardar cambios">{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}</Button>
                 <Button onClick={handleDownloadJpg} size="sm" variant="outline" title="Descargar como JPG"><Download className="w-4 h-4"/></Button>
                 <Button onClick={handleDownloadPdf} size="sm" variant="outline" disabled={isExportingPdf} title="Descargar PDF">
                   {isExportingPdf ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileDown className="w-4 h-4 mr-1.5" />}
                   Descargar PDF
                 </Button>
                 <Button onClick={handlePrint} size="sm" variant="outline" disabled={isExportingPdf} title="Imprimir">
                   {isExportingPdf ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <PrinterIcon className="w-4 h-4 mr-1.5" />}
                   Imprimir
                 </Button>
                 <Button asChild variant="outline" size="sm"><Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><ArrowLeft className="w-4 h-4"/></Link></Button>
               </div>
            </div>
        </div>
        {saveError && (
          <div className="mx-4 my-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
            <span><strong>No se pudo guardar:</strong> {saveError}. Tu trabajo se mantiene en pantalla para que lo puedas corregir.</span>
            <Button size="sm" variant="outline" onClick={() => setSaveError(null)}>Cerrar</Button>
          </div>
        )}
        {imagenIAUrl && (
          <div className="flex justify-center mt-4 print:hidden">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border shadow-sm">
              <Badge variant="default" className="gap-1">
                <Sparkles className="w-3 h-3" />
                Diseño con IA activo
              </Badge>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleQuitarIA}
                disabled={isQuittingIA}
              >
                {isQuittingIA ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                )}
                Volver a plantilla
              </Button>
            </div>
          </div>
        )}
        {imagenIAUrl ? (
          <div
            className={
              formatoHoja === 'a4-2-vertical'
                ? 'w-[10cm] h-[15cm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto overflow-hidden'
                : 'w-[29.7cm] h-[21cm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto flex items-center justify-center gap-4 p-4'
            }
            ref={printRef}
          >
            {formatoHoja === 'a4-2-vertical' ? (
              <img
                src={imagenIAUrl}
                alt="Menú de mesa diseñado con IA"
                className="w-full h-full object-contain bg-white"
              />
            ) : (
              <>
                <img
                  src={imagenIAUrl}
                  alt="Menú de mesa diseñado con IA"
                  className="w-1/2 h-full object-contain bg-white"
                />
                <img
                  src={imagenIAUrl}
                  alt="Menú de mesa diseñado con IA (copia)"
                  className="w-1/2 h-full object-contain bg-white"
                />
              </>
            )}
          </div>
        ) : formatoHoja === 'a4-2-vertical' ? (
          <div
            className="w-[10cm] h-[15cm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto relative overflow-hidden"
            ref={printRef}
          >
            {fondoPlantillaUrl && (
              <img
                src={fondoPlantillaUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
              />
            )}
            <MenuMesaTemplate
              fiesta={fiesta}
              data={data}
              logoUrl={logoUrl}
              onUpdate={(newData) => setData(prev => ({ ...prev, ...newData } as typeof prev))}
              isPreview={true}
            />
          </div>
        ) : (
          <div className="w-[29.7cm] h-[21cm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto flex gap-4 p-4 relative" ref={printRef}>
              <div className="w-1/2 h-full relative">
                  <MenuMesaTemplate
                      fiesta={fiesta}
                      data={data}
                      logoUrl={logoUrl}
                      onUpdate={(newData) => setData(prev => ({ ...prev, ...newData } as typeof prev))}
                      isPreview={true}
                  />
              </div>
               <div className="w-1/2 h-full relative">
                  <MenuMesaTemplate
                      fiesta={fiesta}
                      data={data}
                      logoUrl={logoUrl}
                      onUpdate={(newData) => setData(prev => ({ ...prev, ...newData } as typeof prev))}
                      isPreview={true}
                  />
              </div>
          </div>
        )}
        {fiestaId && (
          <PapeleriaIAModal
            open={isIAModalOpen}
            onOpenChange={setIsIAModalOpen}
            fiestaId={fiestaId}
            pieza="menuMesa"
            tituloPieza="Menú de Mesa"
            esA4Entero={false}
            imagenGuardadaUrl={imagenIAUrl}
            platosMenu={platosMenu}
            onGuardado={handleIAGuardado}
            onVolverPlantilla={() => {
              setFiesta((prev) => {
                if (!prev) return prev;
                const nextPapeleria = { ...(prev.papeleriaIA || {}) };
                delete nextPapeleria.menuMesa;
                return { ...prev, papeleriaIA: nextPapeleria };
              });
            }}
          />
        )}
       <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@400;700&family=Great+Vibes&display=swap');
             @media print {
                body { -webkit-print-color-adjust: exact; color-adjust: exact; background: white !important; }
                .sidebar, header, nav, button, .no-print, .notifications-hub { display: none !important ; }
                @page { size: A4 landscape; margin: 0; }
                main { padding: 0 !important; margin: 0 !important; }
            }
        `}</style>
    </div>
  );
}

export default function MenuMesaPanel() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <MenuDeMesaContent/>
        </Suspense>
    )
}
