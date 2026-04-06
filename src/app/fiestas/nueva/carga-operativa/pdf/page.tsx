
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Printer as PrinterIcon, PackageSearch, Share2, KeyRound, AlertTriangle, Info, Loader2, Save, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ListaDeCargaOperativa, CargaOperativaCategoria, CargaOperativaItem } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getActivosFijos } from '@/app/actions/activos-fijos';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getCargaOperativaMasterTemplate, updateListaDeCargaOperativa } from '@/app/actions/fiesta/carga-operativa.actions';
import { Skeleton } from '@/components/ui/skeleton';
import { WatermarkedImage } from '@/components/watermarked-image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

const companyName = "AK Producciones";

function CargaOperativaPdfContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [listaDeCarga, setListaDeCarga] = useState<ListaDeCargaOperativa | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
        setError("Falta el ID del evento.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, catalogoData, masterTemplate, settings] = await Promise.all([
          getFiestaById(fiestaId),
          getActivosFijos(),
          getCargaOperativaMasterTemplate(),
          getInvoiceTemplateSettings()
      ]);

      if (!fiestaData) throw new Error("Evento no encontrado.");
      
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl || null);

      let loadedLista = fiestaData.listaDeCargaOperativa;
      
      const hasNoData = !loadedLista || !loadedLista.categorias || loadedLista.categorias.length === 0;
      
      if (hasNoData) {
          if (fiestaData.presupuestoId) {
              const presupuesto = await getPresupuestoById(fiestaData.presupuestoId);
              if (presupuesto) {
                  const totalInvitados = (presupuesto.invitadosAdultos || 0) + (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0) || presupuesto.invitadosCantidad || 100;
                  const budgetCategories = new Set(presupuesto.itemsPresupuestados.map(item => (item.categoriaServicio || '').toLowerCase()));
                  const budgetNames = new Set(presupuesto.itemsPresupuestados.map(item => (item.nombreServicio || '').toLowerCase()));

                  const targetAssetCategories = new Set<string>();
                  if (budgetCategories.has('servicio de discoteca') || budgetNames.has('discoteca') || budgetNames.has('dj')) targetAssetCategories.add('Discoteca');
                  if (budgetCategories.has('servicio de decoración') || budgetNames.has('decoración')) { targetAssetCategories.add('Decoración (Activo)'); targetAssetCategories.add('Mobiliario'); }
                  if (budgetCategories.has('servicio de catering') || budgetNames.has('vajilla')) { targetAssetCategories.add('Vajilla (Activo)'); targetAssetCategories.add('Mantelería'); targetAssetCategories.add('Equipamiento de Cocina'); }
                  if (budgetCategories.has('servicio de bebidas') || budgetNames.has('barra')) targetAssetCategories.add('Barra de Tragos');

                  const newCategories: CargaOperativaCategoria[] = [];
                  targetAssetCategories.forEach(catName => {
                    const matchingAssets = catalogoData.filter(a => a.categoria === catName);
                    if (matchingAssets.length > 0) {
                      newCategories.push({
                        id: `auto_pdf_${catName}`,
                        nombre: catName,
                        items: matchingAssets.map(asset => {
                          let qty = '1';
                          if (asset.calculationMethod === 'porPersona') qty = String(totalInvitados);
                          else if (asset.calculationMethod === 'ratio' && asset.invitadosPorUnidad) qty = String(Math.ceil(totalInvitados / asset.invitadosPorUnidad));
                          else if (asset.precioVenta && asset.precioVenta > 0) qty = String(asset.precioVenta);
                          return {
                            id: `item_pdf_${asset.id}`,
                            nombre: asset.nombre,
                            cantidad: qty,
                            unidad: asset.unidad || 'Uds.',
                            cargado: false,
                            origenId: asset.id
                          };
                        })
                      });
                    }
                  });

                  if (newCategories.length > 0) {
                      loadedLista = { categorias: newCategories, notasGenerales: '' };
                  } else {
                      loadedLista = masterTemplate;
                  }
              } else {
                  loadedLista = masterTemplate;
              }
          } else {
              loadedLista = masterTemplate;
          }
      }

      setListaDeCarga(loadedLista || { categorias: [], notasGenerales: '' });

    } catch (err: any) {
      setError("No se pudieron cargar los datos para el PDF de carga.");
      console.error("Error loading data for PDF:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleItem = async (categoryId: string, itemId: string) => {
    if (!fiestaId || !listaDeCarga) return;
    
    setIsUpdating(itemId);
    
    const updatedCategorias = listaDeCarga.categorias.map(cat => {
        if (cat.id === categoryId) {
            return {
                ...cat,
                items: cat.items.map(item => 
                    item.id === itemId ? { ...item, cargado: !item.cargado } : item
                )
            };
        }
        return cat;
    });
    
    const updatedLista = { ...listaDeCarga, categorias: updatedCategorias };
    setListaDeCarga(updatedLista);

    try {
        const result = await updateListaDeCargaOperativa(fiestaId, updatedLista);
        if (!result.success) throw new Error(result.error);
    } catch (e: any) {
        toast({ title: "Error al actualizar", description: e.message, variant: "destructive" });
        loadData(); // Revert on error
    } finally {
        setIsUpdating(null);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleShare = async () => {
    const shareData = {
      title: `Lista de Carga - ${fiesta?.configuracion.nombreEvento}`,
      text: `Aquí tienes la lista de carga interactiva para el equipo.`,
      url: window.location.href,
    };
    if (typeof navigator.share !== 'undefined' && navigator.canShare(shareData)) {
        navigator.share(shareData).catch(err => console.error("Error al compartir:", err));
    } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + '\n' + shareData.url)}`;
        window.open(whatsappUrl, '_blank');
    }
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
      </div>
    );
  }

  if (error || !fiesta || !listaDeCarga) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white text-center">
         <div className="flex justify-between items-center mb-6 print:hidden">
             <Link href={fiestaId ? `/fiestas/nueva/carga-operativa?fiestaId=${fiestaId}` : "/eventos"}>
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
      <div className="max-w-3xl mx-auto space-y-4 print:space-y-0">
        {/* MENSAJE DE COMPARTIR (Solo admin) */}
        <Card className="bg-green-50 border-green-200 print:hidden shadow-sm">
            <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-4 h-4"/> Enlace Listo para Compartir
                </CardTitle>
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
                <p className="text-xs text-green-700 mb-3">
                    <strong>¡Sí!</strong> Esta página es pública y segura. Puedes enviarle el enlace de arriba directamente al <strong>Jefe de Utileros</strong>. Él podrá marcar los ítems desde su celular y tú verás los cambios aquí.
                </p>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="bg-white border-green-300 text-green-700 hover:bg-green-100" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-1.5"/> Enviar enlace por WhatsApp
                    </Button>
                </div>
            </CardContent>
        </Card>

        <div className="bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2 relative min-h-screen">
            <div className="w-full h-24 print:h-20 mb-4 relative">
                <WatermarkedImage src={logoUrl} alt="Logo" containerClassName='w-full h-full'/>
            </div>
            <div className="flex justify-between items-center mb-6 print:hidden">
            <Link href={`/fiestas/nueva/carga-operativa?fiestaId=${fiestaId}`}>
                <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Button>
            </Link>
            <div className="flex gap-2">
                <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
                <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
            </div>
            </div>

            <header className="mb-6 print:mb-3 text-center border-b pb-3 print:pb-2">
            <h1 className="text-xl font-bold text-primary print:text-lg flex items-center justify-center gap-2 text-primary">
                <PackageSearch className="w-6 h-6 print:w-5 print:h-5" /> Lista de Carga Operativa
            </h1>
            <p className="text-md text-gray-700 print:text-sm mt-1 font-semibold">{fiesta.configuracion.nombreEvento}</p>
            <p className="text-xs text-gray-500 print:text-[8pt]">{formatDate(fiesta.configuracion.fechaEvento)}</p>
            </header>
            
            {(listaDeCarga.categorias || []).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Info className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                    <p className="font-medium">No hay una lista de carga generada aún.</p>
                    <p className="text-xs">Sincroniza con el presupuesto en la pantalla de edición para generar la lista.</p>
                </div>
            ) : (
                <div className="space-y-6 print:space-y-4">
                    {(listaDeCarga.categorias || []).map(categoria => (
                    <section key={categoria.id} className="print:break-inside-avoid">
                        <h2 className="text-lg font-bold text-gray-800 print:text-base border-b-2 border-gray-300 pb-1 mb-2 print:pb-0.5 print:mb-1.5 uppercase tracking-wide">
                        {categoria.nombre}
                        </h2>
                        <div className="grid grid-cols-1 gap-1.5 print:gap-1">
                            {categoria.items.map(item => (
                            <div key={item.id} className={cn(
                                "flex items-start gap-3 p-2 border border-gray-100 rounded transition-colors print:p-1 print:border-gray-200",
                                item.cargado ? "bg-green-50/50" : "bg-gray-50/30 print:bg-transparent"
                            )}>
                                <div className="relative flex-shrink-0 mt-0.5">
                                    <Checkbox 
                                        checked={item.cargado}
                                        onCheckedChange={() => handleToggleItem(categoria.id, item.id)}
                                        className="w-6 h-6 border-2 border-gray-400 rounded-md print:w-5 print:h-5 print:border-gray-600 bg-white"
                                        disabled={isUpdating === item.id}
                                    />
                                    {isUpdating === item.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                                            <Loader2 className="w-3 h-3 animate-spin text-primary"/>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow cursor-pointer" onClick={() => handleToggleItem(categoria.id, item.id)}>
                                <div className="flex justify-between items-baseline">
                                    <p className={cn(
                                        "text-sm font-bold print:text-xs",
                                        item.cargado ? "text-green-700 line-through opacity-70" : "text-gray-800"
                                    )}>
                                        {item.nombre}
                                    </p>
                                    <span className="text-sm font-black text-primary print:text-xs bg-primary/5 px-2 rounded print:bg-transparent">
                                        CANT: {item.cantidad} {item.unit || item.unidad || 'Uds.'}
                                    </span>
                                </div>
                                {item.notas && <p className="text-[10px] text-gray-500 italic print:text-[7pt] mt-0.5">Nota: {item.notas}</p>}
                                </div>
                            </div>
                            ))}
                        </div>
                    </section>
                    ))}
                </div>
            )}

            {listaDeCarga.notasGenerales && (
            <section className="mt-8 pt-4 border-t-2 border-gray-200 print:mt-6 print:pt-2 print:border-gray-300 print:break-inside-avoid">
                <h2 className="text-md font-bold text-gray-800 mb-2 print:text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary"/> Notas de Logística:
                </h2>
                <div className="p-3 border rounded bg-yellow-50/30 text-gray-700 print:p-2 print:border-gray-300 print:bg-white print:text-black">
                <p className="text-sm whitespace-pre-line print:text-[9pt]">{listaDeCarga.notasGenerales}</p>
                </div>
            </section>
            )}

            <footer className="mt-12 pt-4 border-t text-center text-[10px] text-gray-400 print:mt-8 print:pt-2 print:border-gray-300">
                <p>Documento Operativo de AK Producciones - Generado el: {new Date().toLocaleString('es-ES')}</p>
            </footer>
        </div>
      </div>
    </div>
  );
}

export default function CargaOperativaPdfPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-3xl mx-auto bg-white flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-primary"/></div>}>
      <CargaOperativaPdfContent />
    </Suspense>
  );
}
