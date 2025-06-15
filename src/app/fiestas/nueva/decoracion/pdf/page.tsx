
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Palette, CakeSlice, ClipboardList, MapPin, StickyNote, Image as ImageIconLucide, Building, PartyPopper, Gift, Camera } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, DecoracionData, DecorationItem, ZonaPersonalizada, ColorPalette } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

const companyLogoUrl = "https://placehold.co/150x60.png?text=AK+Prod"; 
const companyName = "AK Producciones"; 

function DecorationPdfPage() {
  const { toast } = useToast();
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

  const decoracion: DecoracionData | undefined = fiesta?.decoracion;
  const configuracion = fiesta?.configuracion;

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-white">
        <div className="flex justify-between items-center mb-6 print:hidden">
            <Skeleton className="h-10 w-40" /> <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-12 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-8 w-1/3 mb-2" /><Skeleton className="h-20 w-full mb-6" />
        <Skeleton className="h-8 w-1/3 mb-2" /><Skeleton className="h-20 w-full mb-6" />
      </div>
    );
  }

  if (!fiesta || !decoracion || !configuracion) {
    return <div className="p-8 text-center text-red-600">Error: No se pudieron cargar los datos de decoración.</div>;
  }
  
  const renderColorBox = (color?: string, label?: string, descriptiveName?: string) => {
    if (!color) return null;
    return (
        <div className="flex items-center gap-2 print:gap-1">
            <div style={{ backgroundColor: color }} className="w-5 h-5 print:w-4 print:h-4 rounded-sm border border-gray-400 print:border-gray-600 shadow-sm"></div>
            <span className="text-xs print:text-[8pt] text-gray-700 print:text-black">
                {label && <strong className="font-medium">{label}: </strong>}
                {descriptiveName || color}
                {descriptiveName && <span className="text-gray-500 print:text-gray-700"> ({color})</span>}
            </span>
        </div>
    );
  };
  
  const getCategoryIcon = (category?: string): React.ElementType => {
    if (!category) return ClipboardList;
    const catLower = category.toLowerCase();
    if (catLower.includes("entrada")) return Building; // Placeholder, can be more specific
    if (catLower.includes("mesa")) return PartyPopper; // Placeholder
    if (catLower.includes("regalo")) return Gift;
    if (catLower.includes("firma") || catLower.includes("foto")) return Camera;
    return ClipboardList;
  }

  const renderItemsByCategory = (filterKeywords: string[], sectionTitle: string, Icon: React.ElementType) => {
    const items = decoracion.items?.filter(item => 
        filterKeywords.some(keyword => 
            item.name.toLowerCase().includes(keyword) || (item.category && item.category.toLowerCase().includes(keyword))
        )
    );
    if (!items || items.length === 0) return null;

    return (
      <section className="mb-4 print:mb-2 print:break-inside-avoid">
        <h3 className="text-md font-semibold mb-1.5 text-gray-800 print:text-sm flex items-center gap-1.5"><Icon className="w-4 h-4 print:w-3 print:h-3 text-primary"/>{sectionTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 print:gap-1">
          {items.map(item => (
            <div key={item.id} className="p-2 border border-gray-200 rounded bg-white print:p-1 print:border-gray-400">
              <p className="font-medium text-xs print:text-[9pt]">{item.name} {item.quantity > 1 ? `(x${item.quantity})`: ''}</p>
              {item.notes && <p className="text-xs text-gray-600 print:text-[8pt] mt-0.5 whitespace-pre-line">{item.notes}</p>}
              {item.imageUrl && (
                <div className="mt-1">
                  <NextImage src={item.imageUrl} alt={item.name} width={120} height={90} className="rounded-sm object-cover border print:w-20 print:h-16" data-ai-hint={item.dataAiHint || "decoration detail"}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };


  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-body">
      <div id="decoration-pdf-preview-page" className="max-w-3xl mx-auto bg-white shadow-2xl print:shadow-none p-6 md:p-8 print:p-0">
        <div className="mb-4 flex justify-between items-center print:hidden">
          <Link href="/fiestas/nueva/decoracion" passHref>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button>
          </Link>
          <Button onClick={() => window.print()} size="sm"><Printer className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
        </div>

        <header className="mb-4 print:mb-2 text-center print:text-left">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-300 print:border-gray-400 pb-2 print:pb-1 mb-2 print:mb-1">
            <NextImage src={companyLogoUrl} alt="Logo Organizador" width={100} height={40} className="object-contain print:w-20 print:h-8" data-ai-hint="company event logo"/>
            <h1 className="text-xl font-bold text-primary print:text-lg mt-1 sm:mt-0 font-headline">Plan de Decoración del Evento</h1>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs print:text-[9pt]">
            <p><strong className="font-medium text-gray-600 print:text-black">Cliente:</strong> {cliente?.name || cliente?.companyName || configuracion.nombreEvento}</p>
            <p><strong className="font-medium text-gray-600 print:text-black">Tipo:</strong> {configuracion.tipoCelebracion}</p>
            <p><strong className="font-medium text-gray-600 print:text-black">Fecha:</strong> {formatDate(configuracion.fechaEvento)}</p>
            <p><strong className="font-medium text-gray-600 print:text-black">Lugar:</strong> {configuracion.nombreLugar}</p>
          </div>
        </header>
        <Separator className="my-3 print:my-1.5 print:border-gray-400"/>

        <section className="mb-4 print:mb-2 print:break-inside-avoid">
          <h2 className="text-lg font-semibold mb-1.5 text-primary print:text-base flex items-center gap-1.5"><Palette className="w-5 h-5 print:w-4 print:h-4"/>Paleta de Colores</h2>
          <div className="p-2 border border-gray-200 rounded bg-gray-50 print:p-1 print:border-gray-400 print:bg-white space-y-1">
            {renderColorBox(decoracion.paletaColores?.primary, "Principal", decoracion.tema === 'Boda Noelia Damaceno' ? 'Lavanda Pastel' : undefined)}
            {renderColorBox(decoracion.paletaColores?.secondary, "Secundario/Globos", decoracion.tema === 'Boda Noelia Damaceno' ? 'Rosa Suave' : undefined)}
            {renderColorBox(decoracion.paletaColores?.accent, "Acento/Detalles", decoracion.tema === 'Boda Noelia Damaceno' ? 'Beige Claro' : undefined)}
          </div>
        </section>

        {decoracion.moodboardImageUrl && (
          <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold mb-1.5 text-primary print:text-base flex items-center gap-1.5"><ImageIconLucide className="w-5 h-5 print:w-4 print:h-4"/>Inspiración General</h2>
            <div className="border border-gray-200 p-2 rounded inline-block print:p-1 print:border-gray-400">
              <NextImage src={decoracion.moodboardImageUrl} alt="Moodboard General" width={300} height={200} className="rounded-sm object-contain max-h-[15rem] print:max-h-[10rem] w-auto mx-auto" data-ai-hint="event decoration moodboard"/>
            </div>
          </section>
        )}
        
        <section className="mb-4 print:mb-2 print:break-inside-avoid">
          <h2 className="text-lg font-semibold mb-1.5 text-primary print:text-base flex items-center gap-1.5"><Palette className="w-5 h-5 print:w-4 print:h-4"/>Decoración General</h2>
          <div className="p-2 border border-gray-200 rounded bg-gray-50 space-y-0.5 print:p-1 print:border-gray-400 print:bg-white">
            {decoracion.colorCubremantel && <p className="text-xs print:text-[9pt]"><strong className="font-medium text-gray-600 print:text-black">Color Cubremantel:</strong> {decoracion.colorCubremantel}</p>}
            {decoracion.generalNotes && <div className="text-xs text-gray-600 print:text-[9pt] whitespace-pre-line"><strong className="font-medium text-gray-600 print:text-black">Descripción General:</strong> {decoracion.generalNotes}</div>}
            {!decoracion.colorCubremantel && !decoracion.generalNotes && <p className="text-xs text-gray-500 italic print:text-[9pt]">No hay detalles especificados.</p>}
          </div>
        </section>

        {decoracion.decoracionTorta && (decoracion.decoracionTorta.descripcion || decoracion.decoracionTorta.imageUrl) && (
          <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold mb-1.5 text-primary print:text-base flex items-center gap-1.5"><CakeSlice className="w-5 h-5 print:w-4 print:h-4"/>Decoración de Torta</h2>
            <div className="p-2 border border-gray-200 rounded bg-gray-50 space-y-1 print:p-1 print:border-gray-400 print:bg-white">
              {decoracion.decoracionTorta.descripcion && <p className="text-xs text-gray-600 print:text-[9pt] whitespace-pre-line">{decoracion.decoracionTorta.descripcion}</p>}
              {decoracion.decoracionTorta.imageUrl && (
                <div className="mt-1">
                  <NextImage src={decoracion.decoracionTorta.imageUrl} alt="Decoración Torta" width={150} height={110} className="rounded-sm object-cover border print:w-28 print:h-20" data-ai-hint={decoracion.decoracionTorta.dataAiHint || "cake design"}/>
                </div>
              )}
            </div>
          </section>
        )}
        
        {renderItemsByCategory(['entrada', 'entradas'], 'Detalles de Entradas', Building)}
        {renderItemsByCategory(['centro de mesa', 'centros de mesa'], 'Centros de Mesa', PartyPopper)}
        {renderItemsByCategory(['regalo', 'regalos'], 'Zona de Regalos', Gift)}
        {renderItemsByCategory(['firma', 'fotos', 'photocall'], 'Cuadro de Firmas / Photocall', Camera)}

        {decoracion.zonasPersonalizadas && decoracion.zonasPersonalizadas.length > 0 && (
          <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold mb-1.5 text-primary print:text-base flex items-center gap-1.5"><MapPin className="w-5 h-5 print:w-4 print:h-4"/>Zonas Personalizadas</h2>
            <div className="space-y-2 print:space-y-1">
              {decoracion.zonasPersonalizadas.map(zona => (
                <div key={zona.id} className="p-2 border border-gray-200 rounded bg-gray-50 print:p-1 print:border-gray-400 print:bg-white">
                  <h4 className="font-medium text-sm text-gray-700 print:text-[10pt]">{zona.nombreZona}</h4>
                  {zona.descripcion && <p className="text-xs text-gray-600 print:text-[8pt] mt-0.5 whitespace-pre-line">{zona.descripcion}</p>}
                  {zona.imageUrl && (
                    <div className="mt-1">
                      <NextImage src={zona.imageUrl} alt={zona.nombreZona} width={180} height={135} className="rounded-sm object-cover border print:w-32 print:h-24" data-ai-hint={zona.dataAiHint || "custom event zone"}/>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
        
        {decoracion.pdfNotasAdicionales && (
          <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold mb-1.5 text-primary print:text-base flex items-center gap-1.5"><StickyNote className="w-5 h-5 print:w-4 print:h-4"/>Notas Adicionales (PDF)</h2>
            <div className="p-2 border border-gray-200 rounded bg-yellow-50 text-yellow-800 print:p-1 print:border-gray-400 print:bg-white print:text-black">
              <p className="text-xs whitespace-pre-line print:text-[9pt]">{decoracion.pdfNotasAdicionales}</p>
            </div>
          </section>
        )}

        <footer className="mt-6 pt-3 border-t border-gray-300 print:mt-3 print:pt-1.5 print:border-gray-400 text-xs text-center text-gray-500 print:text-[8pt]">
          <p>Documento generado el: {new Date().toLocaleString('es-ES')}</p>
          {fiesta.id && <p>ID Evento: {fiesta.id.substring(0,12)}</p>}
          <p className="mt-0.5">&copy; {new Date().getFullYear()} {companyName}.</p>
        </footer>
      </div>
    </div>
  );
}

export default function Page() {
  return <DecorationPdfPage />;
}

    