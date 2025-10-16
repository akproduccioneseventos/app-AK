
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Share2, GlassWater } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const drinks = [
  { name: 'DAIQUIRI DE DURAZNO', img: 'https://picsum.photos/seed/peach-daiquiri/400/600', aiHint: 'peach daiquiri' },
  { name: 'CAIPIRINHA', img: 'https://picsum.photos/seed/caipirinha/400/600', aiHint: 'caipirinha cocktail' },
  { name: 'ARIZONA', img: 'https://picsum.photos/seed/arizona-cocktail/400/600', aiHint: 'arizona cocktail' },
  { name: 'DAIQUIRI DE ANANA', img: 'https://picsum.photos/seed/pineapple-daiquiri/400/600', aiHint: 'pineapple daiquiri' },
  { name: 'DAIQUIRI DE FRUTILLA', img: 'https://picsum.photos/seed/strawberry-daiquiri/400/600', aiHint: 'strawberry daiquiri' },
  { name: 'ATOMIC GREEN', img: 'https://picsum.photos/seed/atomic-green/400/600', aiHint: 'atomic green cocktail' },
  { name: 'DAIQUIRI PRIMAVERA', img: 'https://picsum.photos/seed/spring-daiquiri/400/600', aiHint: 'spring daiquiri' },
  { name: 'FERNET CON COCA', img: 'https://picsum.photos/seed/fernet-coke/400/600', aiHint: 'fernet with coke' },
  { name: 'ATARDECER', img: 'https://picsum.photos/seed/sunset-cocktail/400/600', aiHint: 'sunset cocktail' },
  { name: 'DESTORNILLADOR', img: 'https://picsum.photos/seed/screwdriver/400/600', aiHint: 'screwdriver cocktail' },
];

export default function CartaTragosPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([getFiestaActual(), getInvoiceTemplateSettings()]);
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl);
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos del evento.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => window.print();
  const handleShare = () => {
    const message = `¡Mira la carta de tragos para el evento de ${fiesta?.configuracion.protagonista1Nombre}!`;
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(message + '\n' + url)}`, '_blank');
  };

  if (isLoading || !fiesta) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  const protagonistaNombre = fiesta.configuracion.protagonista1Nombre || 'Protagonista';
  const tipoEvento = fiesta.configuracion.tipoCelebracion || 'Mi Evento';

  return (
    <div className="bg-gray-100 print:bg-white font-sans">
      <div className="py-4 px-8 print:hidden flex justify-between items-center bg-white shadow-sm sticky top-0 z-50">
        <h1 className="font-headline text-xl">Carta de Tragos Imprimible</h1>
        <div className="flex gap-2">
            <Link href={`/fiestas/nueva/catering?fiestaId=${fiesta.id}`} passHref>
                <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver a Catering</Button>
            </Link>
            <Button variant="outline" onClick={handleShare}><Share2 className="w-4 h-4 mr-2"/>Compartir</Button>
            <Button onClick={handlePrint}><PrinterIcon className="w-4 h-4 mr-2"/>Imprimir</Button>
        </div>
      </div>
      
      <div className="w-[210mm] h-[297mm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto flex flex-col p-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #e9d5ff 0%, #f3e8ff 100%)' }}>
        
        {/* Wavy background shapes */}
        <div className="absolute top-0 left-0 w-full h-24" style={{ background: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%239333ea" fill-opacity="1" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,138.7C960,117,1056,107,1152,117.3C1248,128,1344,160,1392,176L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>\')', backgroundSize: 'cover' }}></div>
        <div className="absolute bottom-0 left-0 w-full h-24" style={{ background: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%239333ea" fill-opacity="1" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,138.7C960,117,1056,107,1152,117.3C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>\')', backgroundSize: 'cover' }}></div>
        
        <header className="relative z-10 grid grid-cols-2 gap-4 items-center px-8 mt-16">
            <div className="w-48 h-48 rounded-full border-4 border-white bg-gray-200 shadow-xl overflow-hidden justify-self-center">
                <NextImage src="https://picsum.photos/seed/quinceanera-main/300/300" alt={`Foto de ${protagonistaNombre}`} width={192} height={192} className="object-cover w-full h-full" data-ai-hint="quinceanera portrait"/>
            </div>
            <div className="text-center">
                <h1 className="font-bold text-4xl text-white uppercase tracking-wider" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Carta de Tragos</h1>
                <h2 className="font-extrabold text-7xl mt-2 text-white" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '3px 3px 5px rgba(0,0,0,0.5)' }}>{protagonistaNombre}</h2>
                <h3 className="font-extrabold text-5xl mt-1 text-white" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '3px 3px 5px rgba(0,0,0,0.5)' }}>{tipoEvento}</h3>
            </div>
        </header>

        <main className="relative z-10 flex-grow grid grid-cols-5 gap-x-4 gap-y-8 px-4 mt-8">
            {drinks.map((drink, index) => (
                <div key={index} className="text-center">
                    <h4 className="font-extrabold text-lg uppercase tracking-wide text-purple-900" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>{drink.name}</h4>
                    <div className="mt-2 aspect-[3/4] rounded-lg shadow-lg overflow-hidden border-4 border-white">
                        <NextImage src={drink.img} alt={drink.name} width={400} height={600} className="w-full h-full object-cover" data-ai-hint={drink.aiHint}/>
                    </div>
                </div>
            ))}
        </main>
        
        <footer className="relative z-10 mt-auto flex justify-center pb-12">
            {logoUrl && (
                <div className="w-24 h-24">
                  <NextImage src={logoUrl} alt="AK Producciones Logo" width={96} height={96} className="object-contain" />
                </div>
            )}
        </footer>
        <style jsx global>{`
             @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
             @media print {
                body {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
            }
        `}</style>
      </div>
    </div>
  );
}
