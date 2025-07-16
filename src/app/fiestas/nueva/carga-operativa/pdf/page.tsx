
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, PackageSearch, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ListaDeCargaOperativa, CargaOperativaCategoria, CargaOperativaItem } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Info } from 'lucide-react';


const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

export default function CargaOperativaPdfPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [listaDeCarga, setListaDeCarga] = useState<ListaDeCargaOperativa | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      setListaDeCarga(fiestaData.listaDeCargaOperativa || { categorias: [], notasGenerales: '' });
    } catch (err: any) {
      setError("No se pudieron cargar los datos para el PDF de carga.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
  
  const handleShareWhatsApp = () => {
    const pageUrl = window.location.href;
    const message = `¡Hola! Aquí tienes la lista de carga operativa para el evento "${fiesta?.configuracion.nombreEvento}":\n\n${pageUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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

  if (error || !fiesta || !listaDeCarga) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white text-center">
         <div className="flex justify-between items-center mb-6 print:hidden">
             <Link href="/fiestas/nueva/carga-operativa" passHref>
                <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button>
            </Link>
        </div>
        <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />
        <p className="font-semibold text-lg text-destructive">Error al Cargar</p>
        <p className="text-sm text-muted-foreground">{error || "No se pudieron cargar los datos necesarios."}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/fiestas/nueva/carga-operativa" passHref>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleShareWhatsApp} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / Guardar PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-3 text-center border-b pb-3 print:pb-2">
          <h1 className="text-xl font-bold text-primary print:text-lg flex items-center justify-center gap-2">
            <PackageSearch className="w-6 h-6 print:w-5 print:h-5" /> Lista de Carga Operativa
          </h1>
          <p className="text-md text-gray-700 print:text-sm mt-1">{fiesta.configuracion.nombreEvento}</p>
          <p className="text-xs text-gray-500 print:text-[8pt]">{formatDate(fiesta.configuracion.fechaEvento)}</p>
        </header>
        
        {(listaDeCarga.categorias || []).length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
                 <Info className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                <p>No hay categorías ni ítems en la lista de carga.</p>
            </div>
        )}

        {(listaDeCarga.categorias || []).map(categoria => (
          <section key={categoria.id} className="mb-5 print:mb-3 print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 print:pb-0.5 print:mb-1.5">
              {categoria.nombre}
            </h2>
            {categoria.items && categoria.items.length > 0 ? (
              <ul className="space-y-1.5 print:space-y-1">
                {categoria.items.map(item => (
                  <li key={item.id} className="flex items-start gap-2 p-1.5 border border-gray-200 rounded-md print:p-1 print:border-gray-300">
                    <div className="w-5 h-5 border border-gray-400 rounded-sm mt-0.5 print:w-3.5 print:h-3.5 print:border-gray-500"></div> {/* Checkbox visual */}
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-700 print:text-xs">
                        {item.nombre}
                        <span className="text-gray-500 print:text-gray-600 text-xs ml-1">
                          (Cant: {item.cantidad} {item.unidad && `(${item.unidad})`})
                        </span>
                      </p>
                      {item.notas && <p className="text-xs text-gray-500 italic print:text-[8pt] mt-0.5 whitespace-pre-wrap">Nota: {item.notas}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic print:text-[9pt] px-1">No hay ítems en esta categoría.</p>
            )}
          </section>
        ))}

        {listaDeCarga.notasGenerales && (
          <section className="mt-6 pt-3 border-t print:mt-4 print:pt-2 print:border-gray-300 print:break-before-page">
            <h2 className="text-md font-semibold text-gray-800 mb-1.5 print:text-sm">Notas Generales de Carga:</h2>
            <div className="p-2 border border-gray-200 rounded bg-yellow-50 text-yellow-800 print:p-1 print:border-gray-300 print:bg-white print:text-black">
              <p className="text-xs whitespace-pre-line print:text-[9pt]">{listaDeCarga.notasGenerales}</p>
            </div>
          </section>
        )}

        <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400 print:mt-5 print:pt-2 print:border-gray-300">
          <p>Generado el: {new Date().toLocaleString('es-ES')}</p>
        </footer>
      </div>
    </div>
  );
}
