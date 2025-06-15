
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Palette, Save, Loader2, Image as ImageIcon, AlertTriangle, ImageOff, PlusCircle, Edit3, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import type { ColorPalette, DecoracionData, DecorationItem, ZonaPersonalizada } from '@/types/fiesta';
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
  AlertDialogContent as AlertDialogContentConfirm, 
  AlertDialogDescription as AlertDialogDescriptionConfirm,
  AlertDialogFooter as AlertDialogFooterConfirm,
  AlertDialogHeader as AlertDialogHeaderConfirm,
  AlertDialogTitle as AlertDialogTitleConfirm,
} from "@/components/ui/alert-dialog";


const defaultColorPalette: ColorPalette = {
  primary: '#D9B8FF', 
  secondary: '#FCD3DE', 
  accent: '#F0E6CC', 
};

const defaultNotasDecoracion = "Detalles pendientes de definir: colores de la fiesta, cubre mantel, decoración de torta, centros de mesa, zona de regalos, cuadro de firmas, gigantografía, alfombra roja, globos, telas, paneles shimmer, flores, tipo de mesas de torta, mobiliario, arreglos florales, números y letras.";


export default function DecoracionEventoPage() {
  const { toast } = useToast();
  const [decoracionData, setDecoracionData] = useState<DecoracionData>({
    tema: '',
    paletaColores: { ...defaultColorPalette },
    moodboardImageUrl: '',
    colorCubremantel: '',
    decoracionTorta: { descripcion: '', imageUrl: '', dataAiHint: '' },
    items: [],
    zonasPersonalizadas: [],
    generalNotes: defaultNotasDecoracion,
    pdfNotasAdicionales: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<DecorationItem> | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const [isZonaModalOpen, setIsZonaModalOpen] = useState(false);
  const [currentZona, setCurrentZona] = useState<Partial<ZonaPersonalizada> | null>(null);
  const [deletingZonaId, setDeletingZonaId] = useState<string | null>(null);

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
          colorCubremantel: fiestaData.decoracion.colorCubremantel || '',
          decoracionTorta: fiestaData.decoracion.decoracionTorta || { descripcion: '', imageUrl: '', dataAiHint: '' },
          items: (fiestaData.decoracion.items || []).map(item => ({
            ...item,
            quantity: item.quantity || 1,
            estimatedCost: Number(item.estimatedCost) || undefined
          })),
          zonasPersonalizadas: fiestaData.decoracion.zonasPersonalizadas || [],
          generalNotes: fiestaData.decoracion.generalNotes === undefined ? defaultNotasDecoracion : fiestaData.decoracion.generalNotes,
          pdfNotasAdicionales: fiestaData.decoracion.pdfNotasAdicionales || '',
        });
      } else {
        setDecoracionData({
            tema: 'Boda Noelia Damaceno',
            paletaColores: { ...defaultColorPalette },
            moodboardImageUrl: '',
            colorCubremantel: '',
            decoracionTorta: { descripcion: '', imageUrl: '', dataAiHint: '' },
            items: [],
            zonasPersonalizadas: [],
            generalNotes: defaultNotasDecoracion,
            pdfNotasAdicionales: '',
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

  const handleInputChange = (field: keyof Omit<DecoracionData, 'items' | 'paletaColores' | 'decoracionTorta' | 'zonasPersonalizadas'>, value: string) => {
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
  
  const handleDecoracionTortaChange = (field: keyof NonNullable<DecoracionData['decoracionTorta']>, value: string) => {
    setDecoracionData(prev => ({
      ...prev,
      decoracionTorta: {
        ...(prev.decoracionTorta || { descripcion: '', imageUrl: '', dataAiHint: '' }),
        [field]: value,
      },
    }));
  };

  const openItemModal = (item?: DecorationItem) => {
    setCurrentItem(item ? { ...item } : { name: '', quantity: 1, category: '', estimatedCost: undefined, supplier: '', notes: '', imageUrl: '', dataAiHint: '' });
    setIsItemModalOpen(true);
  };
  const handleItemFormChange = (field: keyof DecorationItem, value: string | number) => {
    setCurrentItem(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  const handleSaveItem = (e: FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.name?.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre del elemento es obligatorio.", variant: "destructive"});
      return;
    }
    const finalItem: DecorationItem = {
        ...currentItem,
        id: currentItem.id || `decItem_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        name: currentItem.name.trim(),
        quantity: Number(currentItem.quantity) || 1,
        estimatedCost: currentItem.estimatedCost !== undefined ? Number(currentItem.estimatedCost) : undefined,
        dataAiHint: currentItem.dataAiHint || undefined,
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
    setDecoracionData(prev => ({ ...prev, items: prev.items?.filter(it => it.id !== itemId) }));
    toast({ title: "Elemento Eliminado", variant: "destructive" });
    setDeletingItemId(null);
  };

  const openZonaModal = (zona?: ZonaPersonalizada) => {
    setCurrentZona(zona ? { ...zona } : { nombreZona: '', descripcion: '', imageUrl: '', dataAiHint: '' });
    setIsZonaModalOpen(true);
  };
  const handleZonaFormChange = (field: keyof ZonaPersonalizada, value: string) => {
    setCurrentZona(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  const handleSaveZona = (e: FormEvent) => {
    e.preventDefault();
    if (!currentZona || !currentZona.nombreZona?.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre de la zona es obligatorio.", variant: "destructive"});
      return;
    }
    const finalZona: ZonaPersonalizada = {
        ...currentZona,
        id: currentZona.id || `zona_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        nombreZona: currentZona.nombreZona.trim(),
        dataAiHint: currentZona.dataAiHint || undefined,
    };
    setDecoracionData(prev => {
        const newZonas = currentZona.id 
            ? (prev.zonasPersonalizadas || []).map(z => z.id === finalZona.id ? finalZona : z) 
            : [...(prev.zonasPersonalizadas || []), finalZona];
        return { ...prev, zonasPersonalizadas: newZonas };
    });
    setIsZonaModalOpen(false);
    setCurrentZona(null);
    toast({ title: currentZona.id ? "Zona Actualizada" : "Zona Añadida" });
  };
  const handleDeleteZona = (zonaId: string) => {
    setDecoracionData(prev => ({ ...prev, zonasPersonalizadas: (prev.zonasPersonalizadas || []).filter(z => z.id !== zonaId) }));
    toast({ title: "Zona Eliminada", variant: "destructive" });
    setDeletingZonaId(null);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updateDecoracionFiestaActual(decoracionData);
      if (result.success && result.updatedData) {
        toast({ title: "¡Decoración Guardada!", description: "Los detalles de diseño y decoración se han guardado."});
        setDecoracionData({
            ...result.updatedData,
            items: (result.updatedData.items || []).map(item => ({...item, quantity: item.quantity || 1, estimatedCost: Number(item.estimatedCost) || undefined})),
            zonasPersonalizadas: result.updatedData.zonasPersonalizadas || [],
            decoracionTorta: result.updatedData.decoracionTorta || {descripcion: '', imageUrl: '', dataAiHint: ''},
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

  if (isLoading) return ( <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando datos...</p></div>);
  if (error) return ( <div className="flex flex-col items-center justify-center min-h-[400px] text-center"><AlertTriangle className="w-12 h-12 text-destructive mb-4" /><h2 className="text-xl font-semibold mb-2">Error</h2><p className="text-muted-foreground">{error}</p><Button onClick={loadDecoracionData} className="mt-4">Reintentar</Button></div>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Palette className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Diseño y Decoración</h1></div>
        <div className="flex gap-2">
            <Link href="/fiestas/nueva/decoracion/pdf" passHref><Button variant="outline" disabled={isSaving}><FileText className="w-4 h-4 mr-2"/>Ver PDF Decoración</Button></Link>
            <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="font-headline text-xl">Configuración General</CardTitle><CardDescription>Tema, colores, inspiración y notas generales.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label htmlFor="tema-evento">Tema</Label><Input id="tema-evento" value={decoracionData.tema || ''} onChange={(e) => handleInputChange('tema', e.target.value)} placeholder="Ej: Fiesta Tropical" disabled={isSaving}/></div>
            <div className="space-y-3"><Label>Paleta de Colores Principal</Label><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{([['primary', 'Color Principal (cubremantel)'], ['secondary', 'Color Globos / Secundario'], ['accent', 'Color Acentos / Detalles']] as [keyof ColorPalette, string][]).map(([key, label]) => (<div key={key} className="space-y-1"><Label htmlFor={`color-${key}`} className="text-xs">{label}</Label><div className="flex items-center gap-2"><Input id={`color-${key}`} type="color" value={decoracionData.paletaColores?.[key] || '#FFFFFF'} onChange={(e) => handleColorChange(key, e.target.value)} className="w-10 h-9 p-0.5" disabled={isSaving}/><Input type="text" value={decoracionData.paletaColores?.[key] || '#FFFFFF'} onChange={(e) => handleColorChange(key, e.target.value)} className="text-xs p-1.5 h-9" placeholder="#RRGGBB" disabled={isSaving}/></div></div>))}</div></div>
            <div className="space-y-2"><Label htmlFor="moodboard-url">Imagen de Portada / Moodboard (URL)</Label><Input id="moodboard-url" type="url" value={decoracionData.moodboardImageUrl || ''} onChange={(e) => handleInputChange('moodboardImageUrl', e.target.value)} placeholder="https://ejemplo.com/moodboard.jpg" disabled={isSaving}/><p className="text-xs text-muted-foreground">Sube tu imagen y pega el enlace.</p>{decoracionData.moodboardImageUrl ? (<div className="mt-2 p-1 border rounded inline-block"><NextImage src={decoracionData.moodboardImageUrl} alt="Moodboard" width={150} height={100} className="rounded object-contain max-h-[100px]" data-ai-hint="event moodboard"/></div>) : (<div className="mt-2 p-3 border-dashed rounded flex items-center justify-center text-xs text-muted-foreground h-[80px] bg-muted/50"><ImageIcon className="w-6 h-6 mr-1.5"/><p>Sin imagen de portada.</p></div>)}</div>
            <div className="space-y-2"><Label htmlFor="color-cubremantel">Color Cubremantel</Label><Input id="color-cubremantel" value={decoracionData.colorCubremantel || ''} onChange={(e) => handleInputChange('colorCubremantel', e.target.value)} placeholder="Ej: Blanco Hueso" disabled={isSaving}/></div>
            <div className="space-y-2"><Label htmlFor="torta-descripcion">Descripción Decoración Torta</Label><Textarea id="torta-descripcion" value={decoracionData.decoracionTorta?.descripcion || ''} onChange={(e) => handleDecoracionTortaChange('descripcion', e.target.value)} placeholder="Ej: Torta de 3 pisos, estilo rústico con flores." rows={2} disabled={isSaving}/></div>
            <div className="space-y-2"><Label htmlFor="torta-imagen-url">Imagen Referencial Torta (URL)</Label><Input id="torta-imagen-url" type="url" value={decoracionData.decoracionTorta?.imageUrl || ''} onChange={(e) => handleDecoracionTortaChange('imageUrl', e.target.value)} placeholder="https://ejemplo.com/torta.jpg" disabled={isSaving}/></div>
            <div className="space-y-2"><Label htmlFor="torta-aihint">AI Hint Torta (para PDF)</Label><Input id="torta-aihint" value={decoracionData.decoracionTorta?.dataAiHint || ''} onChange={(e) => handleDecoracionTortaChange('dataAiHint', e.target.value)} placeholder="Ej: wedding cake rustic" disabled={isSaving}/></div>
            <div className="space-y-2"><Label htmlFor="general-notes-decoracion">Notas Generales (Planificación)</Label><Textarea id="general-notes-decoracion" value={decoracionData.generalNotes || ''} onChange={(e) => handleInputChange('generalNotes', e.target.value)} rows={3} disabled={isSaving}/></div>
            <div className="space-y-2"><Label htmlFor="pdf-notas-adicionales">Notas Adicionales (Para PDF)</Label><Textarea id="pdf-notas-adicionales" value={decoracionData.pdfNotasAdicionales || ''} onChange={(e) => handleInputChange('pdfNotasAdicionales', e.target.value)} placeholder="Aclaraciones para el reporte PDF." rows={2} disabled={isSaving}/></div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mt-6">
            <CardHeader><div className="flex justify-between items-center"><div><CardTitle className="font-headline text-xl">Elementos Decorativos Generales</CardTitle><CardDescription>Lista de ítems como centros de mesa, detalles de entrada, etc.</CardDescription></div><Button type="button" onClick={() => openItemModal()} disabled={isSaving}><PlusCircle className="w-4 h-4 mr-2" />Añadir Elemento</Button></div></CardHeader>
            <CardContent>{(decoracionData.items?.length || 0) > 0 ? (<ScrollArea className="h-auto max-h-[300px] pr-2"><div className="space-y-2">{decoracionData.items?.map(item => (<Card key={item.id} className="bg-muted/40 p-2"><div className="flex justify-between items-start gap-1"><div className="flex-grow"><h4 className="font-semibold text-sm">{item.name} ({item.quantity}x)</h4>{item.category && <p className="text-xs text-muted-foreground">Cat: {item.category}</p>}{item.estimatedCost !== undefined && <p className="text-xs">Costo: ${item.estimatedCost.toFixed(2)}</p>}{item.notes && <p className="text-xs italic">Notas: {item.notes}</p>}</div><div className="flex gap-1 flex-shrink-0"><Button type="button" variant="ghost" size="icon" onClick={() => openItemModal(item)} className="h-6 w-6"><Edit3 className="w-3 h-3" /></Button><AlertDialogConfirm open={deletingItemId === item.id} onOpenChange={(open) => !open && setDeletingItemId(null)}><AlertDialogTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => setDeletingItemId(item.id)} className="h-6 w-6 text-destructive"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger><AlertDialogContentConfirm><AlertDialogHeaderConfirm><AlertDialogTitleConfirm>Eliminar Elemento</AlertDialogTitleConfirm><AlertDialogDescriptionConfirm>¿Seguro?</AlertDialogDescriptionConfirm></AlertDialogHeaderConfirm><AlertDialogFooterConfirm><AlertDialogCancel>No</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive">Sí</AlertDialogAction></AlertDialogFooterConfirm></AlertDialogContentConfirm></AlertDialogConfirm></div></div></Card>))}</div></ScrollArea>) : (<p className="text-center text-sm text-muted-foreground py-3">No hay elementos generales.</p>)}</CardContent>
        </Card>
        
        <Card className="shadow-lg mt-6">
            <CardHeader><div className="flex justify-between items-center"><div><CardTitle className="font-headline text-xl">Zonas Personalizadas / Activadas</CardTitle><CardDescription>Define áreas específicas del evento (ej. Photocall, Mesa Dulces).</CardDescription></div><Button type="button" onClick={() => openZonaModal()} disabled={isSaving}><PlusCircle className="w-4 h-4 mr-2" />Añadir Zona</Button></div></CardHeader>
            <CardContent>{(decoracionData.zonasPersonalizadas?.length || 0) > 0 ? (<ScrollArea className="h-auto max-h-[300px] pr-2"><div className="space-y-2">{decoracionData.zonasPersonalizadas?.map(zona => (<Card key={zona.id} className="bg-muted/40 p-2"><div className="flex justify-between items-start gap-1"><div className="flex-grow"><h4 className="font-semibold text-sm">{zona.nombreZona}</h4>{zona.descripcion && <p className="text-xs text-muted-foreground">{zona.descripcion}</p>}</div><div className="flex gap-1 flex-shrink-0"><Button type="button" variant="ghost" size="icon" onClick={() => openZonaModal(zona)} className="h-6 w-6"><Edit3 className="w-3 h-3" /></Button><AlertDialogConfirm open={deletingZonaId === zona.id} onOpenChange={(open) => !open && setDeletingZonaId(null)}><AlertDialogTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => setDeletingZonaId(zona.id)} className="h-6 w-6 text-destructive"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger><AlertDialogContentConfirm><AlertDialogHeaderConfirm><AlertDialogTitleConfirm>Eliminar Zona</AlertDialogTitleConfirm><AlertDialogDescriptionConfirm>¿Seguro?</AlertDialogDescriptionConfirm></AlertDialogHeaderConfirm><AlertDialogFooterConfirm><AlertDialogCancel>No</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteZona(zona.id)} className="bg-destructive">Sí</AlertDialogAction></AlertDialogFooterConfirm></AlertDialogContentConfirm></AlertDialogConfirm></div></div></Card>))}</div></ScrollArea>) : (<p className="text-center text-sm text-muted-foreground py-3">No hay zonas personalizadas.</p>)}</CardContent>
        </Card>

        <CardFooter className="border-t pt-6 mt-6"><Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}{isSaving ? 'Guardando...' : 'Guardar Configuración'}</Button></CardFooter>
      </form>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-headline text-lg">{currentItem?.id ? 'Editar' : 'Añadir'} Elemento</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1"><Label htmlFor="item-name">Nombre*</Label><Input id="item-name" value={currentItem?.name || ''} onChange={(e) => handleItemFormChange('name', e.target.value)} required /></div>
            <div className="space-y-1"><Label htmlFor="item-category">Categoría</Label><Input id="item-category" placeholder="Ej: Centro de Mesa" value={currentItem?.category || ''} onChange={(e) => handleItemFormChange('category', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="item-quantity">Cantidad</Label><Input id="item-quantity" type="number" value={currentItem?.quantity ?? 1} onChange={(e) => handleItemFormChange('quantity', Number(e.target.value))} min="1" /></div><div className="space-y-1"><Label htmlFor="item-cost">Costo Est. (c/u)</Label><Input id="item-cost" type="number" value={currentItem?.estimatedCost ?? ''} placeholder="0.00" onChange={(e) => handleItemFormChange('estimatedCost', e.target.value === '' ? undefined : Number(e.target.value))} step="any" /></div></div>
            <div className="space-y-1"><Label htmlFor="item-supplier">Proveedor</Label><Input id="item-supplier" value={currentItem?.supplier || ''} onChange={(e) => handleItemFormChange('supplier', e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="item-imageUrl">URL Imagen</Label><Input id="item-imageUrl" type="url" value={currentItem?.imageUrl || ''} onChange={(e) => handleItemFormChange('imageUrl', e.target.value)} placeholder="https://..."/></div>
            <div className="space-y-1"><Label htmlFor="item-aihint">AI Hint (imagen)</Label><Input id="item-aihint" value={currentItem?.dataAiHint || ''} onChange={(e) => handleItemFormChange('dataAiHint', e.target.value)} placeholder="Ej: floral arrangement"/></div>
            <div className="space-y-1"><Label htmlFor="item-notes">Notas</Label><Textarea id="item-notes" value={currentItem?.notes || ''} onChange={(e) => handleItemFormChange('notes', e.target.value)} rows={2} /></div>
            <DialogFooter className="pt-3"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">{currentItem?.id ? 'Guardar' : 'Añadir'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isZonaModalOpen} onOpenChange={setIsZonaModalOpen}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-headline text-lg">{currentZona?.id ? 'Editar' : 'Añadir'} Zona</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveZona} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1"><Label htmlFor="zona-nombre">Nombre Zona*</Label><Input id="zona-nombre" value={currentZona?.nombreZona || ''} onChange={(e) => handleZonaFormChange('nombreZona', e.target.value)} placeholder="Ej: Rincón Fotográfico" required /></div>
            <div className="space-y-1"><Label htmlFor="zona-descripcion">Descripción</Label><Textarea id="zona-descripcion" value={currentZona?.descripcion || ''} onChange={(e) => handleZonaFormChange('descripcion', e.target.value)} rows={3} /></div>
            <div className="space-y-1"><Label htmlFor="zona-imageUrl">URL Imagen</Label><Input id="zona-imageUrl" type="url" value={currentZona?.imageUrl || ''} onChange={(e) => handleZonaFormChange('imageUrl', e.target.value)} placeholder="https://..."/></div>
            <div className="space-y-1"><Label htmlFor="zona-aihint">AI Hint (imagen)</Label><Input id="zona-aihint" value={currentZona?.dataAiHint || ''} onChange={(e) => handleZonaFormChange('dataAiHint', e.target.value)} placeholder="Ej: photo booth wedding"/></div>
            <DialogFooter className="pt-3"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">{currentZona?.id ? 'Guardar' : 'Añadir'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
    