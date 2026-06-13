
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Printer as PrinterIcon, PackageSearch, Share2, AlertTriangle, Info, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { ListaDeCargaOperativa } from '@/types/fiesta';
import {
  getCargaOperativaAccessView,
  getOrCreateCargaOperativaShareToken,
  updateCargaOperativaItemState,
  type CargaOperativaAccessView,
} from '@/app/actions/fiesta/carga-operativa.actions';
import { Skeleton } from '@/components/ui/skeleton';
import { WatermarkedImage } from '@/components/watermarked-image';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

function CargaOperativaPdfContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const accessToken = searchParams.get('token') || undefined;
  const operatorName = searchParams.get('operatorName') || 'Encargado de carga';

  const [accessView, setAccessView] = useState<CargaOperativaAccessView | null>(null);
  const [listaDeCarga, setListaDeCarga] = useState<ListaDeCargaOperativa | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resolvedOperatorName = accessView?.operatorName || operatorName;

  const loadData = useCallback(async (showLoading = true) => {
    if (!fiestaId) {
        setError("Falta el ID del evento.");
        setIsLoading(false);
        return;
    }
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const result = await getCargaOperativaAccessView(fiestaId, accessToken);
      if (!result.success || !result.data) throw new Error(result.error || 'Evento no encontrado.');
      setAccessView(result.data);
      setListaDeCarga(result.data.lista);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los datos.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [accessToken, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isUpdating) void loadData(false);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [isUpdating, loadData]);

  const handleToggleItem = async (categoryId: string, itemId: string, field: 'cargado' | 'retornado') => {
    if (!fiestaId || !listaDeCarga || isUpdating) return;

    const currentItem = listaDeCarga.categorias
      .find((category) => category.id === categoryId)
      ?.items.find((item) => item.id === itemId);
    if (!currentItem) return;
    const nextValue = !currentItem[field];
    setIsUpdating(itemId);
    setListaDeCarga((current) => current ? ({
      ...current,
      categorias: current.categorias.map((category) => category.id === categoryId ? ({
        ...category,
        items: category.items.map((item) => item.id === itemId ? ({
          ...item,
          [field]: nextValue,
          ...(field === 'cargado' && !nextValue ? { retornado: false } : {}),
          ...(field === 'retornado' && nextValue ? { cargado: true } : {}),
        }) : item),
      }) : category),
    }) : current);

    try {
        const result = await updateCargaOperativaItemState({
          fiestaId,
          categoryId,
          itemId,
          patch: { [field]: nextValue },
          operatorName: resolvedOperatorName,
          accessToken,
        });
        if (!result.success) throw new Error(result.error);
        if (result.updatedData) setListaDeCarga(result.updatedData);
    } catch (updateError) {
        toast({
          title: "Error al actualizar",
          description: updateError instanceof Error ? updateError.message : 'No se pudo guardar.',
          variant: "destructive",
        });
        await loadData(false);
    } finally {
        setIsUpdating(null);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleShare = async () => {
    let shareUrl = window.location.href;
    if (!accessToken && fiestaId) {
      const result = await getOrCreateCargaOperativaShareToken(fiestaId);
      if (!result.success || !result.token) {
        toast({
          title: 'No se pudo crear el enlace',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.set('token', result.token);
      url.searchParams.set('operatorName', 'Equipo de carga');
      shareUrl = url.toString();
    }

    const shareData = {
      title: `Lista de Carga - ${accessView?.nombreEvento || 'AK Producciones'}`,
      text: `Lista de carga y devolución para el equipo.`,
      url: shareUrl,
    };
    if (
      typeof navigator.share === 'function'
      && (typeof navigator.canShare !== 'function' || navigator.canShare(shareData))
    ) {
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

  if (error || !accessView || !listaDeCarga) {
    return (
      <div className="p-8 max-w-3xl mx-auto bg-white text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />
        <p className="font-semibold text-lg text-destructive">Error al Cargar</p>
        <p className="text-sm text-muted-foreground">{error || "No se pudieron cargar los datos necesarios."}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto space-y-4 print:space-y-0">
        {/* Secure operational link */}
        <Card className="bg-green-50 border-green-200 print:hidden shadow-sm">
            <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-4 h-4"/> Lista sincronizada en línea
                </CardTitle>
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
                <p className="text-xs text-green-700 mb-3">
                    Cada tilde de carga o devolución se guarda al instante. El enlace compartido permite entrar solamente a esta lista operativa.
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
                <WatermarkedImage src={accessView.logoUrl || null} alt="Logo" containerClassName='w-full h-full'/>
            </div>
            <div className="flex flex-wrap justify-between gap-2 items-center mb-6 print:hidden">
            {!accessToken ? (
              <Button asChild variant="outline" size="sm"><Link href={`/fiestas/nueva/carga-operativa?fiestaId=${fiestaId}`}><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Editar</Link></Button>
            ) : <span className="text-xs font-semibold text-slate-500">Responsable: {resolvedOperatorName}</span>}
            <div className="flex gap-2">
                <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
                <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
            </div>
            </div>

            <header className="mb-6 print:mb-3 text-center border-b pb-3 print:pb-2">
            <div className="flex items-center justify-center gap-3 mb-1">
                <PackageSearch className="w-6 h-6 print:w-5 print:h-5 text-primary" />
                <h1 className="text-xl font-bold text-primary print:text-lg">
                    Planilla de Carga Operativa
                </h1>
            </div>
            <p className="text-md text-gray-700 print:text-sm mt-1 font-semibold">{accessView.nombreEvento}</p>
            <div className="flex items-center justify-center gap-4 mt-1">
                <p className="text-xs text-gray-500 print:text-[8pt]">Evento: {formatDate(accessView.fechaEvento)}</p>
                <span className="text-gray-300 print:text-gray-300">|</span>
                <p className="text-xs text-gray-500 print:text-[8pt]">Impresión: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
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
                                        onCheckedChange={() => handleToggleItem(categoria.id, item.id, 'cargado')}
                                        className="w-6 h-6 border-2 border-gray-400 rounded-md print:w-5 print:h-5 print:border-gray-600 bg-white"
                                        disabled={Boolean(isUpdating)}
                                        aria-label={`Marcar ${item.nombre} como cargado`}
                                    />
                                    {isUpdating === item.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                                            <Loader2 className="w-3 h-3 animate-spin text-primary"/>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-baseline gap-2">
                                    <p className={cn(
                                        "min-w-0 break-words text-sm font-bold print:text-xs",
                                        item.cargado ? "text-green-700 line-through opacity-70" : "text-gray-800"
                                    )}>
                                        {item.nombre}
                                    </p>
                                    <span className="shrink-0 text-sm font-black text-primary print:text-xs bg-primary/5 px-2 rounded print:bg-transparent">
                                        CANT: {item.cantidad} {item.unit || item.unidad || 'Uds.'}
                                    </span>
                                </div>
                                {item.notas && <p className="text-[10px] text-gray-500 italic print:text-[7pt] mt-0.5">Nota: {item.notas}</p>}
                                {(item.actualizadoPor || item.actualizadoAt) && (
                                  <p className="mt-1 text-[10px] text-gray-400 print:hidden">
                                    Último cambio: {item.actualizadoPor || 'Equipo AK'}
                                    {item.actualizadoAt ? ` · ${new Date(item.actualizadoAt).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}` : ''}
                                  </p>
                                )}
                                {item.cargado && (
                                  <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 print:hidden">
                                    <Checkbox
                                      checked={item.retornado}
                                      onCheckedChange={() => handleToggleItem(categoria.id, item.id, 'retornado')}
                                      disabled={Boolean(isUpdating)}
                                      aria-label={`Marcar ${item.nombre} como retornado`}
                                    />
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Devuelto
                                  </label>
                                )}
                                {item.cargado && (
                                  <p className="hidden print:block print:text-[8pt]">
                                    Devolución: {item.retornado ? 'completa' : 'pendiente'}
                                  </p>
                                )}
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
