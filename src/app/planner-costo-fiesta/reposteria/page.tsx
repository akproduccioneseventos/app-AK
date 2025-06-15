
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2, AlertTriangle, Cake, PlusCircle, Image as ImageIconLucide, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import type { FiestaEnPlanificacion, ReposteriaData, ReposteriaCategoria } from '@/types/fiesta';
import { getFiestaActual, updateReposteriaFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultReposteriaCategorias } from '@/lib/fiesta-defaults';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function GestionReposteriaPage() {
  const { toast } = useToast();
  const [reposteriaData, setReposteriaData] = useState<ReposteriaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({}); // Record<categoryId, boolean>

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFailedImageUrls({});
    try {
      const fiestaData = await getFiestaActual();
      // Ensure all default categories are present by merging
      const mergedCategorias = defaultReposteriaCategorias.map(defaultCat => {
        const savedCat = fiestaData.reposteria?.categorias?.find(sc => sc.id === defaultCat.id);
        return savedCat ? { ...defaultCat, ...savedCat, items: savedCat.items || [] } : { ...defaultCat, items: [] };
      });
      setReposteriaData({
        categorias: mergedCategorias,
        notasGenerales: fiestaData.reposteria?.notasGenerales || '',
      });
    } catch (err: any) {
      console.error("Error loading reposteria data:", err);
      setError("No se pudieron cargar los datos de repostería.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryChange = (
    categoryId: ReposteriaCategoria['id'],
    field: keyof Omit<ReposteriaCategoria, 'id' | 'items' | 'nombreDisplay'>,
    value: string | number | boolean
  ) => {
    setReposteriaData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categorias: prev.categorias.map(cat =>
          cat.id === categoryId ? { ...cat, [field]: value } : cat
        ),
      };
    });
    if (field === 'imagenReferenciaUrl') {
        setFailedImageUrls(prevFailed => ({...prevFailed, [categoryId]: false}));
    }
  };
  
  const handleNotasGeneralesChange = (value: string) => {
    setReposteriaData(prev => prev ? ({ ...prev, notasGenerales: value }) : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reposteriaData) return;
    setIsSaving(true);
    try {
      const result = await updateReposteriaFiestaActual(reposteriaData);
      if (result.success && result.updatedData) {
        toast({ title: "¡Repostería Guardada!", description: "Los detalles de repostería se han actualizado." });
        // Re-merge with defaults to ensure structure consistency after save
        const mergedCategorias = defaultReposteriaCategorias.map(defaultCat => {
            const savedCat = result.updatedData?.categorias?.find(sc => sc.id === defaultCat.id);
            return savedCat ? { ...defaultCat, ...savedCat, items: savedCat.items || [] } : { ...defaultCat, items: [] };
        });
        setReposteriaData({
            categorias: mergedCategorias,
            notasGenerales: result.updatedData?.notasGenerales || '',
        });
      } else {
        throw new Error(result.error || "Error desconocido al guardar la repostería.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !reposteriaData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando datos de repostería...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadData} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cake className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Repostería del Evento</h1>
        </div>
        <Link href="/planner-costo-fiesta" passHref>
          <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Planificador</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Categorías de Repostería</CardTitle>
            <CardDescription>Activa y configura las categorías de repostería para tu evento.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={reposteriaData.categorias.filter(c=>c.activada).map(c => c.id)} className="w-full space-y-3">
              {reposteriaData.categorias.map(cat => (
                <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg shadow-sm bg-card">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
                    <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary/80"/>{cat.nombreDisplay}</span>
                        <Checkbox
                            checked={cat.activada}
                            onCheckedChange={(checked) => handleCategoryChange(cat.id, 'activada', !!checked)}
                            onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking checkbox
                            className="ml-auto mr-2"
                            aria-label={`Activar ${cat.nombreDisplay}`}
                        />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-0 pb-4 space-y-4 border-t">
                    {cat.activada && (
                      <>
                        <div className="space-y-2 mt-3">
                          <Label htmlFor={`desc-${cat.id}`}>Descripción de {cat.nombreDisplay}</Label>
                          <Textarea id={`desc-${cat.id}`} value={cat.descripcion || ''} onChange={(e) => handleCategoryChange(cat.id, 'descripcion', e.target.value)} rows={2} placeholder="Detalles específicos, sabores, estilos..." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`personas-${cat.id}`}>Personas a cubrir con esta categoría (aprox.)</Label>
                          <Input type="number" id={`personas-${cat.id}`} value={cat.cantidadEstimadaPersonas || ''} onChange={(e) => handleCategoryChange(cat.id, 'cantidadEstimadaPersonas', parseInt(e.target.value) || 0)} min="0" placeholder="Ej: 50" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`img-${cat.id}`}>Imagen de Referencia (URL)</Label>
                          <Input type="url" id={`img-${cat.id}`} value={cat.imagenReferenciaUrl || ''} onChange={(e) => handleCategoryChange(cat.id, 'imagenReferenciaUrl', e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" />
                           {cat.imagenReferenciaUrl && !failedImageUrls[cat.id] ? (
                                <div className="mt-1 p-1 border rounded inline-block"><NextImage src={cat.imagenReferenciaUrl} alt={cat.nombreDisplay} width={100} height={75} className="rounded object-contain max-h-[75px]" data-ai-hint={cat.dataAiHint || "pastry category"} onError={() => setFailedImageUrls(prev => ({...prev, [cat.id]: true}))}/></div>
                           ) : (cat.imagenReferenciaUrl && failedImageUrls[cat.id] && <p className="text-xs text-destructive mt-1">Error al cargar imagen.</p>)}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`aihint-${cat.id}`}>AI Hint (para imagen en PDF)</Label>
                            <Input id={`aihint-${cat.id}`} value={cat.dataAiHint || ''} onChange={(e) => handleCategoryChange(cat.id, 'dataAiHint', e.target.value)} placeholder="Ej: wedding cake rustic flowers" />
                        </div>
                        <div className="mt-3 p-3 border-dashed border-muted-foreground/50 rounded-md text-center">
                          <p className="text-sm text-muted-foreground">La gestión detallada de productos dentro de "{cat.nombreDisplay}" se habilitará próximamente.</p>
                          <Button type="button" variant="outline" size="sm" className="mt-2" disabled><PlusCircle className="w-4 h-4 mr-1.5" /> Añadir Productos</Button>
                        </div>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
             <div className="space-y-2 pt-6 border-t mt-6">
                <Label htmlFor="notas-generales-reposteria">Notas Generales de Repostería</Label>
                <Textarea id="notas-generales-reposteria" value={reposteriaData.notasGenerales || ''} onChange={(e) => handleNotasGeneralesChange(e.target.value)} placeholder="Anotaciones generales sobre el servicio de repostería, preferencias, etc." rows={3} />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
              {isSaving ? 'Guardando...' : 'Guardar Cambios de Repostería'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
