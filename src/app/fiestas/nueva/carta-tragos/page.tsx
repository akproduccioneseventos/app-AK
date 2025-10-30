
'use client';

import React, { useState, useEffect, useCallback, Suspense, use } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Edit, Upload, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CartaTragosData } from '@/types/fiesta';
import { getFiestaById, updateCartaTragos as updateCartaTragosAction } from '@/app/actions/fiesta/fiesta.actions';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';

const MenuComponent: React.FC<{
  fiesta: FiestaEnPlanificacion;
  carta: CartaTragosData;
  logoUrl: string | null;
}> = ({ fiesta, carta, logoUrl }) => {
  const protagonistaNombre = carta.protagonistaNombre || 'SILVIA';
  const numeroPrincipal = carta.numeroPrincipal || '70';

  return (
    <div className="w-full h-full p-4 relative overflow-hidden bg-white text-center" style={{ backgroundColor: '#FBF8F0' }}>
      {carta.backgroundImageUrl && (
        <NextImage
          src={carta.backgroundImageUrl}
          alt="Fondo de la carta"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 opacity-80"
          data-ai-hint="elegant texture background"
        />
      )}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-contain bg-no-repeat" style={{ backgroundImage: "url('https://i.imgur.com/kR1Z1zF.png')" }}></div>
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-contain bg-no-repeat" style={{ backgroundImage: "url('https://i.imgur.com/8aVp6G6.png')" }}></div>

      <div className="relative z-10 flex flex-col h-full items-center">
        {logoUrl && (
          <div className="absolute top-2 right-2 w-16 h-16">
            <NextImage src={logoUrl} alt="AK Producciones Logo" width={64} height={64} className="object-contain" data-ai-hint="company logo" />
          </div>
        )}

        <header className="pt-12 text-center">
          {carta.headerImageUrl && (
            <div className="relative w-28 h-20 mx-auto mb-1">
              <NextImage src={carta.headerImageUrl} alt="Header image" layout="fill" objectFit="contain" data-ai-hint="gold number balloons" />
            </div>
          )}
          <h1 className="text-5xl font-bold" style={{ fontFamily: 'Belleza, serif', color: '#363636' }}>{protagonistaNombre}</h1>
          <h2 className="text-xl tracking-widest mt-1" style={{ fontFamily: 'Belleza, serif', color: '#B99D75' }}>CARTA DE TRAGOS</h2>
        </header>

        <main className="flex-grow grid grid-cols-5 gap-2 px-2 mt-4 w-full">
          {carta.items.map((trago, index) => (
            <div key={trago.id} className="text-center">
              <p className="text-[0.4rem] font-bold uppercase" style={{ color: '#B99D75' }}>{trago.nombre}</p>
              <div className="aspect-square relative rounded-full overflow-hidden border-2 border-white shadow-lg mx-auto w-12 h-12 mt-1">
                <NextImage src={trago.imageUrl} alt={trago.nombre} layout="fill" objectFit="cover" data-ai-hint="cocktail photo" />
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};


function CartaTragosContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

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
      const mergedData = { ...defaultCartaTragosData, ...(fiestaData.cartaTragos || {}) };
      setCartaTragos(mergedData);
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos del evento.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [fiestaId, loadData]);

  const handleUpdate = (field: keyof CartaTragosData, value: string) => {
    setCartaTragos(prev => ({ ...prev, [field]: value }));
  };
  
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, field: 'backgroundImageUrl' | 'headerImageUrl') => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiestaId, file);
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


  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateCartaTragosAction(fiestaId, cartaTragos);
      if (result.success) {
        toast({ title: "Guardado!", description: "La carta de tragos ha sido actualizada." });
      } else { throw new Error(result.error); }
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
  
  return (
    <div className="bg-gray-100 print:bg-white">
        <div className="py-4 px-8 print:hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-white shadow-sm sticky top-0 z-50">
            <h1 className="font-headline text-xl">Editor de Carta de Tragos</h1>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="space-y-1">
                <Label className="text-xs">Número</Label>
                <Input value={cartaTragos.numeroPrincipal || ''} onChange={e => handleUpdate('numeroPrincipal', e.target.value)} className="h-9 w-20"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nombre Protagonista</Label>
                <Input value={cartaTragos.protagonistaNombre || ''} onChange={e => handleUpdate('protagonistaNombre', e.target.value)} className="h-9 w-32"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Imagen Fondo</Label>
                <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'backgroundImageUrl')} className="text-xs w-48" disabled={isUploading}/>
              </div>
              <div className="flex items-end gap-2">
                 <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}</Button>
                 <Button onClick={handlePrint} size="sm" variant="outline"><PrinterIcon className="w-4 h-4"/></Button>
                 <Link href={`/fiestas/nueva/catering?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4"/></Button></Link>
               </div>
            </div>
        </div>
      
        <div className="w-[210mm] h-[297mm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto flex flex-col gap-4 p-4 border-2 border-dashed print:border-none">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="border border-black/20 print:border-none">
              <MenuComponent fiesta={fiesta} carta={cartaTragos} logoUrl={logoUrl}/>
            </div>
            <div className="border border-black/20 print:border-none">
              <MenuComponent fiesta={fiesta} carta={cartaTragos} logoUrl={logoUrl}/>
            </div>
          </div>
        </div>

       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
        @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
            @page { size: A4 portrait; margin: 0; }
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
