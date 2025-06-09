
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Palette, Save, Loader2, Image as ImageIcon, AlertTriangle, ImageOff, PlusCircle, Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import type { ColorPalette, DecoracionData, DecorationItem } from '@/types/fiesta';
import { getFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const defaultColorPalette: ColorPalette = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  accent: '#FFFFFF',
};

const defaultNotasDecoracion = "Detalles pendientes de definir: colores de la fiesta, cubre mantel, decoración de torta, centros de mesa, zona de regalos, cuadro de firmas, gigantografía, alfombra roja, globos, telas, paneles shimmer, flores, tipo de mesas de torta, mobiliario, arreglos florales, números y letras.";


export default function DecoracionEventoPage() {
  const { toast } = useToast();
  const [decoracionData, setDecoracionData] = useState<DecoracionData>({
    tema: '',
    paletaColores: { ...defaultColorPalette },
    moodboardImageUrl: '',
    items: [],
    generalNotes: defaultNotasDecoracion,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<DecorationItem> | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const loadDecoracionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      if (fiestaData.decoracion) {
        setDecoracionData({
          tema: fiestaData.decoracion.tema || '',
          paletaColores: fiestaData.decoracion.paletaColores || { ...defaultColorPalette },
          moodboardImageUrl: fiestaData.decoracion.moodboardImageUrl || '',
          items: (fiestaData.decoracion.items || []).map(item => ({
            ...item,
            quantity: item.quantity || 1,
            estimatedCost: Number(item.estimatedCost) || undefined
          })),
          generalNotes: fiestaData.decoracion.generalNotes === undefined ? defaultNotasDecoracion : fiestaData.decoracion.generalNotes,
        });
      } else { // Fallback if decoracion object is missing
        setDecoracionData({
            tema: 'Boda Noelia Damaceno', // Default tema
            paletaColores: { ...defaultColorPalette },
            moodboardImageUrl: '',
            items: [],
            generalNotes: defaultNotasDecoracion,
        });
      }
    } catch (err: any) {
      console.error("Error loading decoration data:", err);
      setError("No se pudo cargar la configuración de decoración.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDecoracionData();
  }, [loadDecoracionData]);

  const handleInputChange = (field: keyof Omit<DecoracionData, 'items' | 'paletaColores'>, value: string) => {
    setDecoracionData(prev => ({ ...prev, [field]: value }));
  };

  const handleColorChange = (colorName: keyof ColorPalette, value: string) => {
    setDecoracionData(prev => ({
      ...prev,
      paletaColores: {
        ...(prev.paletaColores || defaultColorPalette),
        [colorName]: value,
      },
    }));
  };
  
  const openItemModal = (item?: DecorationItem) => {
    setCurrentItem(item ? { ...item } : { name: '', quantity: 1, category: '', estimatedCost: undefined, supplier: '', notes: '', imageUrl: '' });
    setIsItemModalOpen(true);
  };

  const handleItemFormChange = (field: keyof DecorationItem, value: string | number) => {
    setCurrentItem(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const handleSaveItem = (e: FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.name?.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre del elemento de decoración es obligatorio.", variant: "destructive"});
      return;
    }
    const finalItem: DecorationItem = {
        ...currentItem,
        id: currentItem.id || `decItem_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        name: currentItem.name.trim(),
        quantity: Number(currentItem.quantity) || 1,
        estimatedCost: currentItem.estimatedCost !== undefined ? Number(currentItem.estimatedCost) : undefined,
    };

    setDecoracionData(prev => {
        const newItems = currentItem.id 
            ? prev.items?.map(it => it.id === finalItem.id ? finalItem : it) 
            : [...(prev.items || []), finalItem];
        return { ...prev, items: newItems };
    });
    setIsItemModalOpen(false);
    setCurrentItem(null);
    toast({ title: currentItem.id ? "Elemento Actualizado" : "Elemento Añadido" });
  };

  const handleDeleteItem = (itemId: string) => {
    setDecoracionData(prev => ({
        ...prev,
        items: prev.items?.filter(it => it.id !== itemId)
    }));
    toast({ title: "Elemento Eliminado", variant: "destructive" });
    setDeletingItemId(null);
  };
  
  const totalEstimatedCost = decoracionData.items?.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0) * (Number(item.quantity) || 1), 0) || 0;


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updateDecoracionFiestaActual(decoracionData);
      if (result.success && result.updatedData) {
        toast({
          title: "¡Decoración Guardada!",
          description: "Los detalles de diseño y decoración se han guardado.",
        });
        setDecoracionData({ // Ensure we update with server-validated data
            ...result.updatedData,
            items: (result.updatedData.items || []).map(item => ({
              ...item,
              quantity: item.quantity || 1,
              estimatedCost: Number(item.estimatedCost) || undefined
            }))
        }); 
      } else {
        throw new Error(result.error || "Error desconocido al guardar la decoración.");
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
        <p className="ml-3 text-lg">Cargando datos de decoración...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al Cargar Decoración</h2>
        <p className="text-muted-foreground">{error}</p>
         <Button onClick={loadDecoracionData} className="mt-4">Intentar de Nuevo</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Diseño y Decoración del Evento
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
            <CardTitle className="font-headline text-xl">Configuración General de Decoración</CardTitle>
            <CardDescription>Establece el tema, colores, inspiración y notas generales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tema-evento" className="text-base">Tema del Evento</Label>
              <Input
                id="tema-evento"
                value={decoracionData.tema || ''}
                onChange={(e) => handleInputChange('tema', e.target.value)}
                placeholder="Ej: Fiesta Tropical, Noche de Gala, Años 80"
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base">Paleta de Colores Principal</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['primary', 'secondary', 'accent'] as const).map(colorKey => (
                  <div key={colorKey} className="space-y-1">
                    <Label htmlFor={`color-${colorKey}`} className="text-sm capitalize">{colorKey}</Label>
                    <div className="flex items-center gap-2">
                       <Input
                        id={`color-${colorKey}`}
                        type="color"
                        value={decoracionData.paletaColores?.[colorKey] || '#FFFFFF'}
                        onChange={(e) => handleColorChange(colorKey, e.target.value)}
                        className="w-12 h-10 p-1"
                        disabled={isSaving}
                      />
                      <Input
                        type="text"
                        value={decoracionData.paletaColores?.[colorKey] || '#FFFFFF'}
                        onChange={(e) => handleColorChange(colorKey, e.target.value)}
                        className="text-sm p-2 h-10"
                        placeholder="#RRGGBB"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moodboard-url" className="text-base">URL de Imagen de Inspiración / Moodboard General</Label>
              <Input
                id="moodboard-url"
                type="url"
                value={decoracionData.moodboardImageUrl || ''}
                onChange={(e) => handleInputChange('moodboardImageUrl', e.target.value)}
                placeholder="Pega aquí la URL de una imagen (ej: https://.../moodboard.jpg)"
                className="text-base p-3"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Sube tu imagen a un servicio como Imgur o Google Photos y pega el enlace directo aquí.
              </p>
              {decoracionData.moodboardImageUrl && (
                <div className="mt-3 p-2 border rounded-md inline-block bg-muted/50 max-w-full overflow-hidden">
                  <NextImage
                    src={decoracionData.moodboardImageUrl}
                    alt="Vista previa del Moodboard General"
                    width={300}
                    height={200}
                    className="rounded object-contain max-h-[200px] w-auto"
                    data-ai-hint="moodboard preview event"
                    onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.style.removeProperty('display'); }}
                  />
                   <div style={{display: 'none'}} className="p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[150px] bg-muted/30">
                        <ImageOff className="w-10 h-10 mb-2" /> <p className="text-sm">Error al cargar imagen.</p>
                    </div>
                </div>
              )}
              {!decoracionData.moodboardImageUrl && (
                <div className="mt-3 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[150px] bg-muted/30">
                    <ImageOff className="w-10 h-10 mb-2" />
                    <p className="text-sm">Pega una URL para ver la imagen de inspiración general.</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="general-notes-decoracion" className="text-base">Notas Generales de Decoración</Label>
              <Textarea
                id="general-notes-decoracion"
                value={decoracionData.generalNotes || ''}
                onChange={(e) => handleInputChange('generalNotes', e.target.value)}
                placeholder="Ideas generales, conceptos, o cualquier otra nota sobre la decoración en conjunto."
                rows={4}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mt-6">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-xl">Elementos de Decoración</CardTitle>
                        <CardDescription>Lista y detalla cada componente de la decoración.</CardDescription>
                    </div>
                    <Button type="button" onClick={() => openItemModal()} disabled={isSaving}>
                        <PlusCircle className="w-4 h-4 mr-2" /> Añadir Elemento
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {decoracionData.items && decoracionData.items.length > 0 ? (
                    <ScrollArea className="h-auto max-h-[500px] pr-2">
                        <div className="space-y-3">
                            {decoracionData.items.map(item => (
                                <Card key={item.id} className="bg-muted/40 p-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-grow">
                                            <h4 className="font-semibold">{item.name}</h4>
                                            {item.category && <p className="text-xs text-muted-foreground">Categoría: {item.category}</p>}
                                            <p className="text-xs">Cantidad: {item.quantity}</p>
                                            {item.estimatedCost !== undefined && <p className="text-xs">Costo Est.: ${item.estimatedCost.toFixed(2)} c/u</p>}
                                            {item.supplier && <p className="text-xs">Proveedor: {item.supplier}</p>}
                                            {item.imageUrl && 
                                                <NextImage 
                                                    src={item.imageUrl} alt={item.name} 
                                                    width={60} height={60} 
                                                    className="mt-1 rounded-sm border object-cover"
                                                    data-ai-hint="decoration item"
                                                />
                                            }
                                            {item.notes && <p className="text-xs mt-1 italic">Notas: {item.notes}</p>}
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0">
                                            <Button type="button" variant="outline" size="icon" onClick={() => openItemModal(item)} className="h-7 w-7" aria-label="Editar elemento">
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7" disabled={isSaving || deletingItemId === item.id} aria-label="Eliminar elemento">
                                                        {deletingItemId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esto eliminará permanentemente el elemento "{item.name}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel onClick={() => setDeletingItemId(null)}>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <p className="text-center text-muted-foreground py-4">No hay elementos de decoración añadidos. Comienza haciendo clic en "Añadir Elemento".</p>
                )}
                {decoracionData.items && decoracionData.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-lg font-semibold text-right">Costo Total Estimado de Decoración: ${totalEstimatedCost.toFixed(2)}</p>
                    </div>
                )}
            </CardContent>
        </Card>


        <CardFooter className="border-t pt-6 mt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Diseño y Decoración'}
            </Button>
        </CardFooter>
      </form>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">{currentItem?.id ? 'Editar Elemento' : 'Añadir Nuevo Elemento de Decoración'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1">
              <Label htmlFor="item-name">Nombre del Elemento</Label>
              <Input id="item-name" value={currentItem?.name || ''} onChange={(e) => handleItemFormChange('name', e.target.value)} required />
            </div>
             <div className="space-y-1">
              <Label htmlFor="item-category">Categoría</Label>
              <Input id="item-category" placeholder="Ej: Flores, Iluminación, Textil" value={currentItem?.category || ''} onChange={(e) => handleItemFormChange('category', e.target.value)} />
            </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="item-quantity">Cantidad</Label>
                  <Input id="item-quantity" type="number" value={currentItem?.quantity ?? 1} onChange={(e) => handleItemFormChange('quantity', Number(e.target.value))} min="1" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="item-cost">Costo Estimado (c/u)</Label>
                  <Input id="item-cost" type="number" value={currentItem?.estimatedCost ?? ''} placeholder="0.00" onChange={(e) => handleItemFormChange('estimatedCost', e.target.value === '' ? undefined : Number(e.target.value))} step="any" />
                </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="item-supplier">Proveedor (Opcional)</Label>
              <Input id="item-supplier" value={currentItem?.supplier || ''} onChange={(e) => handleItemFormChange('supplier', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="item-imageUrl">URL de Imagen de Referencia (Opcional)</Label>
              <Input id="item-imageUrl" type="url" value={currentItem?.imageUrl || ''} onChange={(e) => handleItemFormChange('imageUrl', e.target.value)} placeholder="https://ejemplo.com/imagen.png"/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="item-notes">Notas Específicas (Opcional)</Label>
              <Textarea id="item-notes" value={currentItem?.notes || ''} onChange={(e) => handleItemFormChange('notes', e.target.value)} rows={2} />
            </div>
            <DialogFooter className="pt-3">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">{currentItem?.id ? 'Guardar Cambios' : 'Añadir Elemento'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
