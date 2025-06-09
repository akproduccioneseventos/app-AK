
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2, AlertTriangle, LayoutGrid, ImageOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, SalonLayoutData, LayoutElement } from '@/types/fiesta';
import { getFiestaActual, updateSalonLayoutFiestaActual } from '@/app/actions/fiesta-actual';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DisenoSalonPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [layoutData, setLayoutData] = useState<SalonLayoutData>({
    backgroundImageUrl: '',
    elements: [],
    generalNotes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // For adding new elements
  const [newElementName, setNewElementName] = useState('');
  const [newElementQuantity, setNewElementQuantity] = useState<number | string>(1);
  const [newElementNotes, setNewElementNotes] = useState('');

  const loadLayoutData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      if (fiestaData.salonLayout) {
        setLayoutData(fiestaData.salonLayout);
      } else {
        // Initialize with default if not present
        setLayoutData({ backgroundImageUrl: '', elements: [], generalNotes: '' });
      }
    } catch (err: any) {
      console.error("Error loading salon layout data:", err);
      toast({ title: "Error", description: "No se pudo cargar la configuración del diseño del salón.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLayoutData();
  }, [loadLayoutData]);

  const handleInputChange = (field: keyof SalonLayoutData, value: string) => {
    setLayoutData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddElement = () => {
    if (!newElementName.trim() || (typeof newElementQuantity === 'string' && !newElementQuantity.trim()) || Number(newElementQuantity) <= 0) {
      toast({ title: "Datos del Elemento Inválidos", description: "El nombre no puede estar vacío y la cantidad debe ser un número positivo.", variant: "destructive" });
      return;
    }
    const newElement: LayoutElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newElementName.trim(),
      quantity: Number(newElementQuantity),
      notes: newElementNotes.trim() || undefined,
    };
    setLayoutData(prev => ({ ...prev, elements: [...prev.elements, newElement] }));
    setNewElementName('');
    setNewElementQuantity(1);
    setNewElementNotes('');
    toast({ title: "Elemento Añadido", description: `${newElement.name} (x${newElement.quantity}) añadido a la lista.`});
  };

  const handleRemoveElement = (elementId: string) => {
    setLayoutData(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId),
    }));
    toast({ title: "Elemento Eliminado", variant: "destructive" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updateSalonLayoutFiestaActual(layoutData);
      if (result.success && result.updatedData) {
        toast({ title: "¡Diseño Guardado!", description: "La configuración del diseño del salón ha sido guardada." });
        setLayoutData(result.updatedData); // Update local state with potentially processed data
      } else {
        throw new Error(result.error || "Error desconocido al guardar el diseño del salón.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando diseño del salón...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Diseño del Salón y Disposición
          </h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Configuración del Plano del Salón</CardTitle>
            <CardDescription>Sube una imagen del plano, añade elementos y notas para la disposición.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Imagen de Fondo */}
            <div className="space-y-2">
              <Label htmlFor="background-image-url" className="text-base">URL de Imagen del Plano del Salón</Label>
              <Input
                id="background-image-url"
                type="url"
                value={layoutData.backgroundImageUrl || ''}
                onChange={(e) => handleInputChange('backgroundImageUrl', e.target.value)}
                placeholder="Pega aquí la URL de una imagen del plano (ej: https://.../plano.jpg)"
                className="text-base p-3"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Sube tu imagen a un servicio como Imgur o Google Photos y pega el enlace directo aquí. La subida directa de archivos se implementará en el futuro.
              </p>
              {layoutData.backgroundImageUrl && (
                <div className="mt-3 p-2 border rounded-md inline-block bg-muted/50 max-w-full overflow-hidden">
                  <Image
                    src={layoutData.backgroundImageUrl}
                    alt="Vista previa del plano del salón"
                    width={600}
                    height={400}
                    className="rounded object-contain max-h-[400px] w-auto"
                    data-ai-hint="floor plan layout"
                    onError={(e) => { e.currentTarget.style.display = 'none'; /* Hide broken image icon */ }}
                  />
                </div>
              )}
               {!layoutData.backgroundImageUrl && (
                <div className="mt-3 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[200px] bg-muted/30">
                    <ImageOff className="w-12 h-12 mb-2" />
                    <p className="text-sm">Pega una URL para ver la imagen del plano aquí.</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Elementos del Salón */}
            <div>
              <h3 className="text-lg font-medium mb-3 font-headline">Elementos del Salón</h3>
              <Card className="p-4 bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="new-element-name" className="text-xs">Nombre del Elemento</Label>
                    <Input id="new-element-name" value={newElementName} onChange={(e) => setNewElementName(e.target.value)} placeholder="Ej: Mesa Redonda (8 pax), Pista de Baile" className="h-9" disabled={isSaving}/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-element-qty" className="text-xs">Cantidad</Label>
                    <Input id="new-element-qty" type="number" value={newElementQuantity} onChange={(e) => setNewElementQuantity(e.target.value === '' ? '' : parseInt(e.target.value))} min="1" className="h-9" disabled={isSaving}/>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <Label htmlFor="new-element-notes" className="text-xs">Notas para este Elemento (Opcional)</Label>
                    <Input id="new-element-notes" value={newElementNotes} onChange={(e) => setNewElementNotes(e.target.value)} placeholder="Ej: Ubicar cerca de la entrada, Necesita toma de corriente" className="h-9" disabled={isSaving}/>
                  </div>
                </div>
                <Button type="button" onClick={handleAddElement} variant="outline" size="sm" disabled={isSaving}>
                  <PlusCircle className="w-4 h-4 mr-1.5" />Añadir Elemento a la Lista
                </Button>
              </Card>

              {layoutData.elements.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Lista de Elementos Añadidos:</h4>
                  <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/30">
                    <ul className="text-sm divide-y divide-border">
                      {layoutData.elements.map(el => (
                        <li key={el.id} className="flex justify-between items-start py-2">
                          <div>
                            <p className="font-medium">{el.name} (x{el.quantity})</p>
                            {el.notes && <p className="text-xs text-muted-foreground pl-2">- {el.notes}</p>}
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveElement(el.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={isSaving} aria-label={`Eliminar ${el.name}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
               {layoutData.elements.length === 0 && (
                 <p className="text-sm text-muted-foreground mt-3 text-center py-3 bg-muted/20 rounded-md">No hay elementos añadidos a la lista.</p>
               )}
            </div>
            
            <Separator />

            {/* Notas Generales */}
            <div className="space-y-2">
              <Label htmlFor="general-layout-notes" className="text-base">Notas Generales de Disposición</Label>
              <Textarea
                id="general-layout-notes"
                value={layoutData.generalNotes || ''}
                onChange={(e) => handleInputChange('generalNotes', e.target.value)}
                placeholder="Describe aquí la distribución general, zonas importantes, flujos de movimiento, etc."
                rows={5}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando Diseño...' : 'Guardar Diseño del Salón'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
