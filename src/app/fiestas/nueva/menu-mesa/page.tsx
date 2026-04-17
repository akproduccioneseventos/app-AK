
'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Save, Loader2, Edit, Upload, Image as ImageIcon, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, MenuMesaData } from '@/types/fiesta';
import { getFiestaById, updateMenuMesa as updateMenuMesaAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultMenuMesaData } from '@/lib/fiesta-defaults';
import { MenuMesaTemplate } from '@/components/invitacion/templates/MenuMesaTemplate';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import NextImage from 'next/image';
import html2canvas from 'html2canvas';


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
  const printRef = useRef<HTMLDivElement>(null);


  const loadData = useCallback(async () => {
    if (!fiestaId) {
      toast({ title: "Error", description: "No se encontró ID de evento.", variant: "destructive" });
      router.push('/eventos');
      return;
    }
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([getFiestaById(fiestaId), getInvoiceTemplateSettings()]);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl ?? null);
      
      const mergedData = { ...defaultMenuMesaData, ...(fiestaData.menuMesa || {}) };
      setData(mergedData);
    } catch (e: any) {
      setError("No se pudo cargar la información del evento.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
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

  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateMenuMesaAction(fiestaId, data);
      if (result.success) {
        toast({ title: "¡Guardado!", description: "El menú de mesa ha sido actualizado." });
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


  if (isLoading || !fiesta) {
    return <div className="p-8 max-w-4xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-8 max-w-4xl mx-auto text-center">{error}</div>;
  }
  
  return (
    <div className="bg-gray-100 print:bg-white">
        <div className="py-2 px-4 print:hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-white shadow-sm sticky top-0 z-50">
            <h1 className="font-headline text-lg">Editor de Menú de Mesa</h1>
            <div className="flex flex-wrap gap-2 items-center">
                <div className="space-y-1"><Label htmlFor="protagonista-foto" className="text-xs">Foto</Label><Input id="protagonista-foto" type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs w-48" disabled={isUploading}/></div>
                <div className="space-y-1"><Label className="text-xs">Borde</Label><Input type="color" value={data.paletaColores?.primary || '#8b5cf6'} onChange={e => handleColorChange('primary', e.target.value)} className="w-10 h-9 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Título</Label><Input type="color" value={data.paletaColores?.accent || '#3b82f6'} onChange={e => handleColorChange('accent', e.target.value)} className="w-10 h-9 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Texto</Label><Input type="color" value={data.paletaColores?.secondary || '#4b5563'} onChange={e => handleColorChange('secondary', e.target.value)} className="w-10 h-9 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Fondo</Label><Input type="color" value={data.paletaColores?.background || '#ffffff'} onChange={e => handleColorChange('background', e.target.value)} className="w-10 h-9 p-0.5"/></div>

               <div className="flex items-end gap-2">
                 <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}</Button>
                 <Button onClick={handleDownloadJpg} size="sm" variant="outline" title="Descargar como JPG"><Download className="w-4 h-4"/></Button>
                 <Button onClick={handlePrint} size="sm" variant="outline" title="Imprimir PDF"><PrinterIcon className="w-4 h-4"/></Button>
                 <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4"/></Button></Link>
               </div>
            </div>
        </div>
        <div className="w-[29.7cm] h-[21cm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto flex gap-4 p-4" ref={printRef}>
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

export default function MenuMesaPageWrapper() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <MenuDeMesaContent/>
        </Suspense>
    )
}
