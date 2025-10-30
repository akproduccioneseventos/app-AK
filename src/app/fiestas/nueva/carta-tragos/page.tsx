
'use client';

import React, { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Share2, GlassWater, Upload, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CartaTragosData, Trago } from '@/types/fiesta';
import { getFiestaActual, updateCartaTragos as updateCartaTragosAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Loader2 as LoaderIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultCartaTragosData, defaultStaticTragos } from '@/lib/fiesta-defaults';


const MenuComponent: React.FC<{
  fiesta: FiestaEnPlanificacion;
  carta: CartaTragosData;
  logoUrl: string | null;
}> = ({ fiesta, carta, logoUrl }) => {
  
  const protagonistaNombre = carta.protagonistaNombre || fiesta.configuracion.protagonista1Nombre || 'Protagonista';
  const tipoEvento = fiesta.configuracion.tipoCelebracion || 'Mi Evento';

  return (
    <div className="w-full h-full flex flex-col p-2 relative overflow-hidden bg-gradient-to-br from-[#e9d5ff] to-[#f3e8ff]">
      <div className="absolute top-0 left-0 w-full h-12" style={{ background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="${carta.paletaColores?.primary.replace('#', '%23') || '%239333ea'}" fill-opacity="0.8" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,138.7C960,117,1056,107,1152,117.3C1248,128,1344,160,1392,176L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>')`, backgroundSize: 'cover' }}></div>
      <div className="absolute bottom-0 left-0 w-full h-12" style={{ background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="${carta.paletaColores?.primary.replace('#', '%23') || '%239333ea'}" fill-opacity="0.8" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,138.7C960,117,1056,107,1152,117.3C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>')`, backgroundSize: 'cover' }}></div>

      <header className="relative z-10 grid grid-cols-2 gap-2 items-center px-4 mt-12">
        <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 shadow-lg overflow-hidden justify-self-center">
            {carta.protagonistaFotoUrl && <NextImage src={carta.protagonistaFotoUrl} alt={`Foto de ${protagonistaNombre}`} width={96} height={96} className="object-cover w-full h-full" data-ai-hint="protagonist photo"/>}
        </div>
        <div className="text-center">
            <h1 className="font-extrabold text-xl text-white uppercase tracking-wider" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Carta de Tragos</h1>
            <h2 className="font-extrabold text-5xl mt-1 text-white" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '3px 3px 5px rgba(0,0,0,0.5)' }}>{protagonistaNombre}</h2>
            <h3 className="font-extrabold text-3xl mt-0 text-white" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '3px 3px 5px rgba(0,0,0,0.5)' }}>{tipoEvento}</h3>
        </div>
      </header>

      <main className="relative z-10 flex-grow grid grid-cols-2 gap-x-2 gap-y-4 px-2 mt-4">
        {defaultStaticTragos.map((item) => (
          <div key={item.id} className="text-center">
            <h4 className="font-extrabold text-[0.6rem] uppercase tracking-wide text-purple-900" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>{item.nombre}</h4>
            <div className="mt-1 aspect-[3/4] rounded-lg shadow-md overflow-hidden border-2 border-white">
                <NextImage src={item.imageUrl} alt={item.nombre} width={200} height={300} className="w-full h-full object-cover" data-ai-hint={item.aiHint}/>
            </div>
          </div>
        ))}
      </main>

       <footer className="relative z-10 mt-auto flex justify-center pb-8 pt-4">
            {logoUrl && (
                <div className="w-16 h-16">
                  <NextImage src={logoUrl} alt="AK Producciones Logo" width={64} height={64} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
        </footer>
    </div>
  );
};

export default function CartaTragosPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cartaTragos, setCartaTragos] = useState<CartaTragosData>(defaultCartaTragosData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([getFiestaActual(), getInvoiceTemplateSettings()]);
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl);
      const mergedData = { 
        ...defaultCartaTragosData, 
        ...(fiestaData.cartaTragos || {}),
        items: defaultStaticTragos // Always use static list
      };
      if (!mergedData.protagonistaNombre && fiestaData.configuracion.protagonista1Nombre) {
        mergedData.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre;
      }
      setCartaTragos(mergedData);
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos del evento.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSaveChanges = async () => {
    if (!fiesta) return;
    setIsSaving(true);
    try {
      const dataToSave: CartaTragosData = {
          ...cartaTragos,
          items: defaultStaticTragos // Ensure we always save the static list, not any dynamic version
      };
      const result = await updateCartaTragosAction(fiesta.id, dataToSave);
      if (result.success) {
        toast({ title: "Guardado", description: "La carta de tragos ha sido actualizada." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiesta) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiesta.id, file);
      if(result.success && result.url) {
        setCartaTragos(prev => ({ ...prev, protagonistaFotoUrl: result.url }));
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

  const handleUpdate = (field: keyof CartaTragosData, value: any) => {
    setCartaTragos(prev => ({...prev, [field]: value}));
  };
  
  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    setCartaTragos(prev => ({
        ...prev,
        paletaColores: {
            ...(prev.paletaColores || { primary: '', secondary: '', accent: '' }),
            [colorType]: value,
        }
    }));
  };

  const handlePrint = () => window.print();
  const handleShare = () => { /* ... (implement if needed) ... */ };

  if (isLoading || !fiesta) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="bg-gray-100 print:bg-white font-sans">
      <div className="py-4 px-8 print:hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-white shadow-sm sticky top-0 z-50">
            <h1 className="font-headline text-xl">Editor de Carta de Tragos</h1>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="space-y-1">
                <Label htmlFor="protagonista-foto" className="text-xs">Foto Protagonista</Label>
                <Input id="protagonista-foto" type="file" accept="image/*" onChange={handleFileChange} className="text-xs w-48" disabled={isUploading}/>
              </div>
              <div className="space-y-1">
                 <Label className="text-xs">Color Título</Label>
                 <Input type="color" value={cartaTragos.paletaColores?.primary || '#9333ea'} onChange={e => handleColorChange('primary', e.target.value)} className="w-10 h-9 p-0.5"/>
              </div>
              <div className="space-y-1">
                 <Label className="text-xs">Nombre</Label>
                 <Input value={cartaTragos.protagonistaNombre || ''} onChange={e => handleUpdate('protagonistaNombre', e.target.value)} className="h-9 w-32"/>
              </div>
               <div className="flex items-end gap-2">
                 <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                 </Button>
                 <Button onClick={handlePrint} size="sm" variant="outline"><PrinterIcon className="w-4 h-4"/></Button>
                 <Link href={`/fiestas/nueva?fiestaId=${fiesta.id}`} passHref>
                    <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4"/></Button>
                 </Link>
               </div>
            </div>
      </div>
      
      <div className="w-[297mm] h-[210mm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto flex gap-4 p-4 border-2 border-dashed print:border-none">
        <div className="w-1/2 h-full border border-gray-300 print:border-none">
            <MenuComponent fiesta={fiesta} carta={cartaTragos} logoUrl={logoUrl}/>
        </div>
         <div className="w-1/2 h-full border border-gray-300 print:border-none">
            <MenuComponent fiesta={fiesta} carta={cartaTragos} logoUrl={logoUrl}/>
        </div>
      </div>

       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
         @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
            @page { size: A4 landscape; margin: 0; }
        }
       `}</style>
    </div>
  );
}
