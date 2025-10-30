
'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Share2, Edit, Upload, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CartaTragosData, Trago } from '@/types/fiesta';
import { getFiestaById, updateCartaTragos as updateCartaTragosAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import { MenuComponent } from '@/components/invitacion/templates/CartaTragosMenu';

function CartaTragosContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cartaTragos, setCartaTragos] = useState<CartaTragosData>(defaultCartaTragosData);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      setFiesta(fiestaData);
      
      const mergedData = { ...defaultCartaTragosData, ...(fiestaData.cartaTragos || {}) };
      
      // Auto-fill from event config if fields are empty
      if (!mergedData.protagonistaNombre) {
        mergedData.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre || 'La Agasajada';
      }
      if (!mergedData.numeroPrincipal) {
        mergedData.numeroPrincipal = fiestaData.configuracion.tipoCelebracion === 'XV años' ? 'Mis XV' : 'Nuestra Boda';
      }
      setCartaTragos(mergedData);

    } catch (e: any) {
      setError("No se pudo cargar la información del evento.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [fiestaId]);

  const handleUpdate = (field: keyof CartaTragosData, value: string | Partial<CartaTragosData['paletaColores']>) => {
    setCartaTragos(prev => ({ ...prev, [field]: value }));
  };
  
  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent' | 'background', value: string) => {
    if (colorType === 'background') {
        setCartaTragos(prev => ({ ...prev, backgroundColor: value }));
    } else {
        const paleta = cartaTragos.paletaColores || defaultCartaTragosData.paletaColores;
        handleUpdate('paletaColores', { ...paleta, [colorType]: value });
    }
  };

  const handleProtagonistPhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiestaId, file);
      if (result.success && result.url) {
        setCartaTragos(prev => ({ ...prev, protagonistaFotoUrl: result.url }));
        toast({ title: "Foto actualizada" });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al subir foto", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackgroundImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiestaId, file);
      if (result.success && result.url) {
        setCartaTragos(prev => ({ ...prev, backgroundImageUrl: result.url }));
        toast({ title: "Imagen de fondo actualizada" });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al subir foto de fondo", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateCartaTragosAction(fiestaId, cartaTragos);
      if (result.success) {
        toast({ title: "Guardado!", description: "La carta de tragos ha sido actualizada." });
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
    return <div className="p-8 max-w-4xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-8 max-w-4xl mx-auto text-center">{error}</div>;
  }
  
  return (
    <div className="bg-gray-100 print:bg-white">
        <div className="py-2 px-4 print:hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-white shadow-sm sticky top-0 z-50">
            <h1 className="font-headline text-lg">Editor de Carta de Tragos</h1>
            <div className="flex flex-wrap gap-2 items-center">
                <div className="space-y-1"><Label htmlFor="protagonista-foto" className="text-xs">Foto Protagonista</Label><Input id="protagonista-foto" type="file" accept="image/*" onChange={handleProtagonistPhotoUpload} className="text-xs w-44" disabled={isUploading}/></div>
                <div className="space-y-1"><Label htmlFor="bg-image-upload" className="text-xs">Fondo</Label><Input id="bg-image-upload" type="file" accept="image/*" onChange={handleBackgroundImageUpload} className="text-xs w-44" disabled={isUploading}/></div>
                <div className="space-y-1"><Label className="text-xs">Fondo Principal</Label><Input type="color" value={cartaTragos.backgroundColor || '#FBF8F0'} onChange={e => handleColorChange('background', e.target.value)} className="w-9 h-8 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Color Primario</Label><Input type="color" value={cartaTragos.paletaColores?.primary || '#9333ea'} onChange={e => handleColorChange('primary', e.target.value)} className="w-9 h-8 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Color Secundario</Label><Input type="color" value={cartaTragos.paletaColores?.secondary || '#363636'} onChange={e => handleColorChange('secondary', e.target.value)} className="w-9 h-8 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Título</Label><Input value={cartaTragos.numeroPrincipal || ''} onChange={e => handleUpdate('numeroPrincipal', e.target.value)} className="h-8 w-16"/></div>
                <div className="space-y-1"><Label className="text-xs">Nombre</Label><Input value={cartaTragos.protagonistaNombre || ''} onChange={e => handleUpdate('protagonistaNombre', e.target.value)} className="h-8 w-28"/></div>
               <Separator orientation="vertical" className="h-10 mx-1"/>
               <div className="flex items-end gap-2">
                 <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}</Button>
                 <Button onClick={handlePrint} size="sm" variant="outline"><PrinterIcon className="w-4 h-4"/></Button>
                 <Link href={`/fiestas/nueva/catering?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4"/></Button></Link>
               </div>
            </div>
        </div>
        
        <div className="w-[210mm] h-[297mm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto p-4 flex flex-col">
            <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="border-4 border-dashed border-gray-300 print:border-none p-2">
                    <MenuComponent fiesta={fiesta} carta={cartaTragos} isPreview={true} />
                </div>
                 <div className="border-4 border-dashed border-gray-300 print:border-none p-2">
                    <MenuComponent fiesta={fiesta} carta={cartaTragos} isPreview={true} />
                </div>
            </div>
        </div>

       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
         @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
            @page { size: A4 portrait; margin: 0; }
            .print-hidden { display: none; }
        }
       `}</style>
    </div>
  );
}

export default function CartaTragosPageWrapper() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <CartaTragosContent/>
        </Suspense>
    )
}
