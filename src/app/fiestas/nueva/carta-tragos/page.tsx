
'use client';

import React, { useState, useEffect, useCallback, type ChangeEvent, use } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Share2, Edit, Upload, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CartaTragosData, Trago } from '@/types/fiesta';
import { getFiestaById, updateCartaTragos as updateCartaTragosAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
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
     <div className="w-full h-full flex flex-col p-2 relative overflow-hidden bg-white">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: carta.backgroundImageUrl || `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: carta.backgroundImageUrl ? 'cover' : 'auto'
        }}
      ></div>

      <div className="flex-1 grid grid-cols-2 gap-2">
        {/* Parte Izquierda (Tragos) */}
        <div className="text-center p-2">
            <h3 className="font-extrabold text-sm uppercase tracking-wider" style={{ color: carta.paletaColores?.secondary }}>Nuestros Tragos</h3>
            <div className="mt-2 space-y-1 text-left">
              {carta.items.map((trago, index) => (
                <div key={index} className="text-xs font-serif leading-tight">
                    <span className="font-bold">{trago.nombre}</span>
                </div>
              ))}
            </div>
        </div>

        {/* Parte Derecha (Portada) */}
        <div className="flex flex-col items-center justify-center text-center p-2">
          {carta.protagonistaFotoUrl && (
            <div className="w-20 h-20 rounded-full border-2 overflow-hidden shadow-md mb-3" style={{borderColor: carta.paletaColores?.primary}}>
              <NextImage src={carta.protagonistaFotoUrl} alt={`Foto de ${protagonistaNombre}`} width={80} height={80} className="object-cover w-full h-full" data-ai-hint="protagonist photo" />
            </div>
          )}
          <h1 className="font-extrabold text-lg uppercase tracking-wider" style={{ color: carta.paletaColores?.primary }}>Carta de Tragos</h1>
          <h2 className="font-extrabold text-3xl mt-1" style={{ fontFamily: "'Dancing Script', cursive", color: carta.paletaColores?.secondary }}>{protagonistaNombre}</h2>
          <h3 className="font-extrabold text-xl mt-0" style={{ fontFamily: "'Dancing Script', cursive", color: carta.paletaColores?.secondary }}>{tipoEvento}</h3>
        </div>
      </div>

       <footer className="mt-auto flex justify-center pb-1 pt-1">
            {logoUrl && (
                <div className="w-10 h-10">
                  <NextImage src={logoUrl} alt="AK Producciones Logo" width={40} height={40} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
        </footer>
    </div>
  );
};

export default function CartaTragosPage() {
  const params = useSearchParams();
  const fiestaId = params.get('fiestaId');
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cartaTragos, setCartaTragos] = useState<CartaTragosData>(defaultCartaTragosData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([getFiestaById(fiestaId), getInvoiceTemplateSettings()]);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl);
      const mergedData = { 
        ...defaultCartaTragosData, 
        ...(fiestaData.cartaTragos || {}),
        items: defaultStaticTragos
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
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSaveChanges = async () => {
    if (!fiesta) return;
    setIsSaving(true);
    try {
      const dataToSave: CartaTragosData = {
          ...cartaTragos,
          items: defaultStaticTragos
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
  
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, field: 'protagonistaFotoUrl' | 'backgroundImageUrl') => {
    const file = event.target.files?.[0];
    if (!file || !fiesta) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiesta.id, file);
      if(result.success && result.url) {
        setCartaTragos(prev => ({ ...prev, [field]: result.url }));
        toast({title: "Imagen actualizada"});
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
                <Input id="protagonista-foto" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'protagonistaFotoUrl')} className="text-xs w-48" disabled={isUploading}/>
              </div>
               <div className="space-y-1">
                <Label className="text-xs">Color Principal</Label>
                 <Input type="color" value={cartaTragos.paletaColores?.primary || '#9333ea'} onChange={e => handleColorChange('primary', e.target.value)} className="w-10 h-9 p-0.5"/>
              </div>
               <div className="space-y-1">
                 <Label className="text-xs">Color Secundario</Label>
                 <Input type="color" value={cartaTragos.paletaColores?.secondary || '#363636'} onChange={e => handleColorChange('secondary', e.target.value)} className="w-10 h-9 p-0.5"/>
              </div>
              <div className="space-y-1">
                 <Label className="text-xs">Nombre</Label>
                 <Input value={cartaTragos.protagonistaNombre || ''} onChange={e => handleUpdate('protagonistaNombre', e.target.value)} className="h-9 w-32"/>
              </div>
               <div className="flex items-end gap-2">
                 <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}</Button>
                 <Button onClick={handlePrint} size="sm" variant="outline"><PrinterIcon className="w-4 h-4"/></Button>
                 <Link href={`/fiestas/nueva/catering?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4"/></Button></Link>
               </div>
            </div>
        </div>
      
        <div className="w-[297mm] h-[210mm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto flex gap-4 p-4 border-2 border-dashed print:border-none">
            <div className="w-1/2 h-full border border-dashed border-gray-400">
                <MenuComponent fiesta={fiesta} carta={cartaTragos} logoUrl={logoUrl}/>
            </div>
            <div className="w-1/2 h-full border border-dashed border-gray-400">
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
