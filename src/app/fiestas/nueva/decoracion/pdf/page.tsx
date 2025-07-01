
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Palette, CakeSlice, ClipboardList, MapPin, StickyNote, Image as ImageIconLucide, Building, PartyPopper, Gift, Camera, Sparkles as SparklesIcon, Flower, Wand2, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, DecoracionData, DecorationItem, ZonaContratada, ColorPalette, Invitado } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import React from 'react';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

const companyLogoUrl = "https://placehold.co/150x60.png?text=AK+Prod"; 
const companyName = "AK Producciones"; 

function DecorationPdfPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const showLayout = searchParams.get('layout') === 'true';

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      if (fiestaData.configuracion.clienteId) {
        const clienteData = await getCustomerById(fiestaData.configuracion.clienteId);
        setCliente(clienteData);
      }
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos para el PDF.", variant: "destructive" });
      console.error("Error loading data for PDF:", err);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePrint = () => {
    window.print();
  };

  const decoracion: DecoracionData | undefined = fiesta?.decoracion;
  const configuracion = fiesta?.configuracion;
  const invitados: Invitado[] = fiesta?.invitados || [];

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Skeleton className="h-10 w-40" /> <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-12 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-8 w-1/3 mb-2" /><Skeleton className="h-20 w-full mb-6" />
      </div>
    );
  }

  if (!fiesta || !decoracion || !configuracion) {
    return <div className="p-8 text-center text-red-600">Error: No se pudieron cargar los datos de decoración.</div>;
  }
  
  const getZonaIcon = (zonaId: ZonaContratada['id']): React.ElementType => {
    switch (zonaId) {
        case 'atras_torta': return CakeSlice;
        case 'frente_salon': return Building;
        case 'zona_regalos': return Gift;
        case 'zona_fotografia': return Camera;
        case 'centro_salon': return SparklesIcon;
        default: return LayoutDashboard;
    }
  };

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/fiestas/nueva/decoracion" passHref>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button>
          </Link>
          <Button onClick={handlePrint} size="sm"><Printer className="w-4 h-4 mr-1.5" />Imprimir / Guardar PDF</Button>
        </div>

        <header className="mb-6 print:mb-3 text-center border-b pb-3 print:pb-2">
          <h1 className="text-xl font-bold text-primary print:text-lg flex items-center justify-center gap-2">
            <Palette className="w-6 h-6 print:w-5 print:h-5" /> 
            {showLayout ? "Plano del Salón" : "Plan de Decoración"}
          </h1>
          <p className="text-md text-gray-700 print:text-sm mt-1">{fiesta.configuracion.nombreEvento}</p>
          <p className="text-xs text-gray-500 print:text-[8pt]">{formatDate(fiesta.configuracion.fechaEvento)}</p>
        </header>
        
        {showLayout ? (
           <section className="mb-4 print:mb-2 print:break-inside-avoid">
             <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 print:pb-0.5 print:mb-1.5">
                Disposición del Salón
              </h2>
             <div className="relative w-full h-[600px] border rounded-lg bg-muted/30 overflow-hidden">
                {decoracion.salonPlanBackgroundImageUrl && <NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" data-ai-hint="event floor plan"/>}
                {(decoracion.salonElements || []).map(element => {
                    const assignedGuests = invitados.filter(inv => inv.tableNumber === element.name);
                    return (
                        <div key={element.id} 
                             className="absolute border border-gray-500 bg-white/70 p-1 flex flex-col items-center justify-center"
                             style={{ left: `${element.x}px`, top: `${element.y}px`, width: `${element.width}px`, height: `${element.height}px`, transform: `rotate(${element.rotation}deg)`}}>
                           <p className="text-[8px] font-bold">{element.name}</p>
                           {assignedGuests.length > 0 && (
                               <ul className="text-[6px] list-disc list-inside mt-1">
                                   {assignedGuests.map(g => <li key={g.id} className="truncate">{g.nombre}</li>)}
                               </ul>
                           )}
                        </div>
                    )
                })}
            </div>
          </section>
        ) : (
          <>
            {/* Contenido original de decoración aquí */}
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
    return (
        <React.Suspense fallback={<div>Cargando...</div>}>
            <DecorationPdfPageContent />
        </React.Suspense>
    );
}

