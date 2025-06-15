
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, AlertTriangle, GlassWater, PlusCircle, Droplets } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, BebidasData, BebidaCategoria, TipoEventoAjusteBebidas } from '@/types/fiesta';
import { getFiestaActual, updateBebidasFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultBebidasCategorias } from '@/lib/fiesta-defaults';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const tiposEventoAjusteDisponibles: { value: TipoEventoAjusteBebidas; label: string }[] = [
    { value: 'formal', label: 'Formal / Adultos' },
    { value: 'juvenil', label: 'Juvenil / Fiesta Joven' },
    { value: 'corporativo', label: 'Corporativo / Empresarial' },
    { value: 'mixto_estandar', label: 'Mixto / Estándar' },
];

export default function GestionBebidasPage() {
  const { toast } = useToast();
  const [bebidasData, setBebidasData] = useState<BebidasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      // Ensure all default categories are present by merging
      const mergedCategorias = defaultBebidasCategorias.map(defaultCat => {
        const savedCat = fiestaData.bebidas?.categorias?.find(sc => sc.id === defaultCat.id);
        return savedCat ? { ...defaultCat, ...savedCat, items: savedCat.items || [] } : { ...defaultCat, items: [] };
      });
      setBebidasData({
        categorias: mergedCategorias,
        tipoEventoAjuste: fiestaData.bebidas?.tipoEventoAjuste || 'mixto_estandar',
        notasGenerales: fiestaData.bebidas?.notasGenerales || '',
      });
    } catch (err: any) {
      console.error("Error loading bebidas data:", err);
      setError("No se pudieron cargar los datos de bebidas.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryChange = (
    categoryId: BebidaCategoria['id'],
    field: keyof Omit<BebidaCategoria, 'id' | 'items' | 'nombreDisplay'>,
    value: string | boolean
  ) => {
    setBebidasData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categorias: prev.categorias.map(cat =>
          cat.id === categoryId ? { ...cat, [field]: value } : cat
        ),
      };
    });
  };

  const handleTipoEventoAjusteChange = (value: TipoEventoAjusteBebidas) => {
    setBebidasData(prev => prev ? ({ ...prev, tipoEventoAjuste: value }) : null);
  };
  
  const handleNotasGeneralesChange = (value: string) => {
    setBebidasData(prev => prev ? ({ ...prev, notasGenerales: value }) : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bebidasData) return;
    setIsSaving(true);
    try {
      const result = await updateBebidasFiestaActual(bebidasData);
      if (result.success && result.updatedData) {
        toast({ title: "¡Bebidas Guardadas!", description: "La configuración de bebidas se ha actualizado." });
         // Re-merge with defaults to ensure structure consistency after save
        const mergedCategorias = defaultBebidasCategorias.map(defaultCat => {
            const savedCat = result.updatedData?.categorias?.find(sc => sc.id === defaultCat.id);
            return savedCat ? { ...defaultCat, ...savedCat, items: savedCat.items || [] } : { ...defaultCat, items: [] };
        });
        setBebidasData({
            categorias: mergedCategorias,
            tipoEventoAjuste: result.updatedData?.tipoEventoAjuste || 'mixto_estandar',
            notasGenerales: result.updatedData?.notasGenerales || '',
        });
      } else {
        throw new Error(result.error || "Error desconocido al guardar la configuración de bebidas.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !bebidasData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando datos de bebidas...</p>
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
          <GlassWater className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Bebidas del Evento</h1>
        </div>
        <Link href="/planner-costo-fiesta" passHref>
          <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Planificador</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Configuración de Bebidas</CardTitle>
            <CardDescription>Activa y personaliza las categorías de bebidas para tu evento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="tipo-evento-ajuste" className="text-base">Tipo de Evento (para cálculo automático)</Label>
                <Select value={bebidasData.tipoEventoAjuste} onValueChange={(value) => handleTipoEventoAjusteChange(value as TipoEventoAjusteBebidas)}>
                    <SelectTrigger id="tipo-evento-ajuste" className="text-base p-3 h-auto">
                        <SelectValue placeholder="Seleccionar tipo de evento..." />
                    </SelectTrigger>
                    <SelectContent>
                        {tiposEventoAjusteDisponibles.map(tipo => (
                            <SelectItem key={tipo.value} value={tipo.value} className="text-base">{tipo.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Esto ayudará a estimar cantidades (funcionalidad futura).</p>
            </div>

            <Accordion type="multiple" defaultValue={bebidasData.categorias.filter(c=>c.activada).map(c => c.id)} className="w-full space-y-3">
              {bebidasData.categorias.map(cat => (
                <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg shadow-sm bg-card">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
                     <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-2"><Droplets className="w-5 h-5 text-primary/80"/>{cat.nombreDisplay}</span>
                        <Checkbox
                            checked={cat.activada}
                            onCheckedChange={(checked) => handleCategoryChange(cat.id, 'activada', !!checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto mr-2"
                            aria-label={`Activar ${cat.nombreDisplay}`}
                        />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-0 pb-4 space-y-4 border-t">
                    {cat.activada && (
                      <>
                        <div className="space-y-2 mt-3">
                          <Label htmlFor={`desc-bebida-${cat.id}`}>Descripción de {cat.nombreDisplay}</Label>
                          <Textarea id={`desc-bebida-${cat.id}`} value={cat.descripcion || ''} onChange={(e) => handleCategoryChange(cat.id, 'descripcion', e.target.value)} rows={2} placeholder="Preferencias, marcas específicas, etc." />
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
                <Label htmlFor="notas-generales-bebidas">Notas Generales de Bebidas</Label>
                <Textarea id="notas-generales-bebidas" value={bebidasData.notasGenerales || ''} onChange={(e) => handleNotasGeneralesChange(e.target.value)} placeholder="Observaciones sobre el servicio de bebidas, horarios de barra, etc." rows={3} />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
              {isSaving ? 'Guardando...' : 'Guardar Cambios de Bebidas'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

