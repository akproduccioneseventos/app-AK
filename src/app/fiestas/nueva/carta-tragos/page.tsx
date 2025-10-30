
'use client';

import React, { useState, useEffect, useCallback, type ChangeEvent, use } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Edit, Upload, Loader2, Save, Wand2 } from 'lucide-react';
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

  return (
     <div className="w-full h-full p-4 relative overflow-hidden bg-white text-center" style={{ backgroundColor: carta.backgroundColor || 'white' }}>
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-contain bg-no-repeat" style={{ backgroundImage: "url('/wave-top.svg')" }}></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-contain bg-no-repeat" style={{ backgroundImage: "url('/wave-bottom.svg')" }}></div>

        <div className="relative z-10 flex flex-col h-full">
            {logoUrl && (
                <div className="absolute top-2 right-2 w-12 h-12">
                  <NextImage src={logoUrl} alt="AK Producciones Logo" width={48} height={48} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
            
            <header className="pt-10">
                {carta.headerImageUrl && (
                     <div className="relative w-24 h-16 mx-auto mb-2">
                        <NextImage src={carta.headerImageUrl} alt="Header image" layout="fill" objectFit="contain" data-ai-hint="birthday number balloons"/>
                     </div>
                )}
                <h1 className="text-3xl font-bold tracking-wider" style={{ fontFamily: 'Belleza, serif', color: carta.paletaColores?.primary }}>{protagonistaNombre}</h1>
                <h2 className="text-xl tracking-widest mt-1" style={{color: carta.paletaColores?.secondary}}>CARTA DE TRAGOS</h2>
            </header>

            <main className="flex-grow grid grid-cols-5 gap-2 px-2 mt-4">
                {carta.items.map(trago => (
                    <div key={trago.id} className="text-center">
                        <div className="aspect-square relative rounded-full overflow-hidden border-2 border-white shadow-lg mx-auto w-16 h-16">
                            <NextImage src={trago.imageUrl} alt={trago.nombre} layout="fill" objectFit="cover" data-ai-hint="cocktail photo"/>
                        </div>
                        <p className="text-[0.5rem] font-bold mt-1 uppercase" style={{color: carta.paletaColores?.secondary}}>{trago.nombre}</p>
                    </div>
                ))}
            </main>
        </div>
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

      const cartaData = fiestaData.cartaTragos || {};
      
      const mergedData: CartaTragosData = { 
        ...defaultCartaTragosData, 
        ...cartaData,
        items: defaultStaticTragos, // Always use static list
        protagonistaNombre: cartaData.protagonistaNombre || fiestaData.configuracion.protagonista1Nombre || 'Protagonista',
        headerImageUrl: cartaData.headerImageUrl || '/70.png',
        backgroundImageUrl: cartaData.backgroundImageUrl || '/brushed-background.png',
        backgroundColor: cartaData.backgroundColor || '#FBF8F0',
        paletaColores: {
            primary: cartaData.paletaColores?.primary || '#B99D75',
            secondary: cartaData.paletaColores?.secondary || '#363636',
            accent: cartaData.paletaColores?.accent || '#D4AF37'
        }
      };
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

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    setCartaTragos(prev => ({
        ...prev,
        paletaColores: {
            ...(prev.paletaColores || { primary: '', secondary: '', accent: '' }),
            [colorType]: value,
        }
    }));
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
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="bg-gray-100 print:bg-white font-sans">
        <div className="py-4 px-8 print:hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-white shadow-sm sticky top-0 z-50">
            <h1 className="font-headline text-xl">Editor de Carta de Tragos</h1>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="space-y-1"><Label className="text-xs">Imagen Cabecera</Label><Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'headerImageUrl')} className="text-xs w-48" disabled={isUploading}/></div>
              <div className="space-y-1"><Label className="text-xs">Imagen Fondo</Label><Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'backgroundImageUrl')} className="text-xs w-48" disabled={isUploading}/></div>
              <div className="space-y-1"><Label className="text-xs">Color Principal</Label><Input type="color" value={cartaTragos.paletaColores?.primary || ''} onChange={e => handleColorChange('primary', e.target.value)} className="w-10 h-9 p-0.5"/></div>
              <div className="space-y-1"><Label className="text-xs">Nombre</Label><Input value={cartaTragos.protagonistaNombre || ''} onChange={e => handleUpdate('protagonistaNombre', e.target.value)} className="h-9 w-32"/></div>
              <div className="flex items-end gap-2">
                 <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}</Button>
                 <Button onClick={handlePrint} size="sm" variant="outline"><PrinterIcon className="w-4 h-4"/></Button>
                 <Link href={`/fiestas/nueva/catering?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4"/></Button></Link>
               </div>
            </div>
        </div>
      
        <div className="w-[210mm] h-[297mm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto p-4 flex flex-col gap-4 border border-dashed print:border-none">
            <div className="w-1/2 h-full self-center">
                 <MenuComponent fiesta={fiesta} carta={cartaTragos} logoUrl={logoUrl}/>
            </div>
        </div>

       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
         @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
            .page-container {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 210mm;
                height: 297mm;
            }
            .menu-card {
                width: 100mm;
                height: 297mm; /* Adjust to fit content or specific size */
                margin: 0;
                box-shadow: none;
                border: 1px solid #ccc; /* Optional: for cutting guide */
            }
            @page { size: A4 portrait; margin: 0; }
        }
       `}</style>
    </div>
  );
}

