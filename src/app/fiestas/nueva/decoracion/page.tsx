
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Palette, Save, Loader2, Image as ImageIcon, AlertTriangle, ImageOff, PlusCircle, Edit3, Trash2, FileText, Wand2, Sparkles, Flower, Gift, CameraIcon, Building, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import type { ColorPalette, DecoracionData, DecorationItem, ZonaContratada } from '@/types/fiesta';
import { getFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultDecoracion, defaultZonasContratadas, defaultColorPalette } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
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


export default function DecoracionEventoPage() {
  const { toast } = useToast();
  const [decoracionData, setDecoracionData] = useState<DecoracionData>(JSON.parse(JSON.stringify(defaultDecoracion)));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<DecorationItem> | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  
  const [failedMoodboardUrl, setFailedMoodboardUrl] = useState(false);
  const [failedTortaImageUrl, setFailedTortaImageUrl] = useState(false);
  const [failedItemImageUrls, setFailedItemImageUrls] = useState<Set<string>>(new Set());
  const [failedZonaImageUrls, setFailedZonaImageUrls] = useState<Set<string>>(new Set());


  const loadDecoracionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFailedMoodboardUrl(false);
    setFailedTortaImageUrl(false);
    setFailedItemImageUrls(new Set());
    setFailedZonaImageUrls(new Set());
    try {
      const fiestaData = await getFiestaActual();
      const currentDecoracion = fiestaData.decoracion || {};
      
      // Ensure all predefined zones are present, merging with saved data
      const mergedZonas = defaultZonasContratadas.map(defaultZona => {
        const savedZona = currentDecoracion.zonasContratadas?.find(sz => sz.id === defaultZona.id);
        return savedZona ? { ...defaultZona, ...savedZona } : { ...defaultZona };
      });

      setDecoracionData({
        ...defaultDecoracion, // Start with defaults to ensure all fields exist
        ...currentDecoracion, // Override with saved data
        paletaColores: currentDecoracion.paletaColores || { ...defaultColorPalette },
        items: (currentDecoracion.items || []).map(item => ({
          ...item,
          quantity: item.quantity || 1,
          estimatedCost: Number(item.estimatedCost) || undefined
        })),
        zonasContratadas: mergedZonas,
        decoracionTorta: currentDecoracion.decoracionTorta || { descripcion: '', imageUrl: '', dataAiHint: '' },
        generalNotes: currentDecoracion.generalNotes === undefined ? defaultDecoracion.generalNotes : currentDecoracion.generalNotes,
      });
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

  const handleInputChange = (field: keyof Omit<DecoracionData, 'items' | 'paletaColores' | 'decoracionTorta' | 'zonasContratadas'>, value: string) => {
    if (field === 'moodboardImageUrl') setFailedMoodboardUrl(false);
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
     if (field === 'imageUrl') setFailedTortaImageUrl(false);
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
    setFailedItemImageUrls(prev => { const newSet = new Set(prev); if(item?.imageUrl) newSet.delete(item.imageUrl); return newSet; });
    setIsItemModalOpen(true);
  };
  const handleItemFormChange = (field: keyof DecorationItem, value: string | number | undefined) => {
    if(field === 'imageUrl') setFailedItemImageUrls(prev => { const newSet = new Set(prev); if(typeof value === 'string') newSet.delete(value); return newSet; });
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
        estimatedCost: currentItem.estimatedCost !== undefined && currentItem.estimatedCost !== null && !isNaN(Number(currentItem.estimatedCost)) ? Number(currentItem.estimatedCost) : undefined,
        dataAiHint: currentItem.dataAiHint?.trim() || undefined,
        imageUrl: currentItem.imageUrl?.trim() || undefined,
    };
    setDecoracionData(prev => {
        const newItems = currentItem.id 
            ? (prev.items || []).map(it => it.id === finalItem.id ? finalItem : it) 
            : [...(prev.items || []), finalItem];
        return { ...prev, items: newItems };
    });
    setIsItemModalOpen(false);
    setCurrentItem(null);
    toast({ title: currentItem.id ? "Elemento Actualizado" : "Elemento Añadido" });
  };
  const handleDeleteItem = (itemId: string) => {
    setDecoracionData(prev => ({ ...prev, items: (prev.items || []).filter(it => it.id !== itemId) }));
    toast({ title: "Elemento Eliminado", variant: "destructive" });
    setDeletingItemId(null);
  };
  
  const handleZonaChange = (zonaId: ZonaContratada['id'], field: keyof Omit<ZonaContratada, 'id' | 'nombreDisplay' | 'activada'>, value: string) => {
    if (field === 'imagenReferenciaUrl') setFailedZonaImageUrls(prev => { const newSet = new Set(prev); newSet.delete(value); return newSet; });
    setDecoracionData(prev => ({
      ...prev,
      zonasContratadas: (prev.zonasContratadas || []).map(zona =>
        zona.id === zonaId ? { ...zona, [field]: value } : zona
      )
    }));
  };

  const toggleZonaActivada = (zonaId: ZonaContratada['id']) => {
    setDecoracionData(prev => ({
      ...prev,
      zonasContratadas: (prev.zonasContratadas || []).map(zona =>
        zona.id === zonaId ? { ...zona, activada: !zona.activada } : zona
      )
    }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Asegurar que las zonas no activadas no guarden descripciones o URLs
      const cleanZonas = (decoracionData.zonasContratadas || []).map(zona => 
          zona.activada ? zona : { ...zona, descripcion: '', imagenReferenciaUrl: '', dataAiHint: '' }
      );
      const dataToSave = { ...decoracionData, zonasContratadas: cleanZonas };

      const result = await updateDecoracionFiestaActual(dataToSave);
      if (result.success && result.updatedData) {
        toast({ title: "¡Decoración Guardada!", description: "Los detalles de diseño y decoración se han guardado."});
        
        const currentDecoracion = result.updatedData || {};
        const mergedZonas = defaultZonasContratadas.map(defaultZona => {
            const savedZona = currentDecoracion.zonasContratadas?.find(sz => sz.id === defaultZona.id);
            return savedZona ? { ...defaultZona, ...savedZona } : { ...defaultZona };
        });

        setDecoracionData({
            ...defaultDecoracion,
            ...currentDecoracion,
            paletaColores: currentDecoracion.paletaColores || { ...defaultColorPalette },
            items: (currentDecoracion.items || []).map(item => ({...item, quantity: item.quantity || 1, estimatedCost: Number(item.estimatedCost) || undefined})),
            zonasContratadas: mergedZonas,
            decoracionTorta: currentDecoracion.decoracionTorta || {descripcion: '', imageUrl: '', dataAiHint: ''},
            generalNotes: currentDecoracion.generalNotes === undefined ? defaultDecoracion.generalNotes : currentDecoracion.generalNotes,
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
        <div className="flex items-center gap-3"><Palette className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">🌸 Decoración del Evento</h1></div>
        <div className="flex gap-2">
            <Link href="/fiestas/nueva/decoracion/pdf" passHref><Button variant="outline" disabled={isSaving}><FileText className="w-4 h-4 mr-2"/>Ver PDF Decoración</Button></Link>
            <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Accordion type="multiple" defaultValue={['general', 'elementos', 'zonas']} className="w-full space-y-3">
          {/* Decoración General */}
          <AccordionItem value="general" className="border rounded-lg shadow-md bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary/80"/>Configuración General</div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0 pb-3 space-y-6">
              <div className="space-y-2 mt-2"><Label htmlFor="tema-evento">Tema del Evento</Label><Input id="tema-evento" value={decoracionData.tema || ''} onChange={(e) => handleInputChange('tema', e.target.value)} placeholder="Ej: Fiesta Tropical, Boda Rústica Chic" disabled={isSaving}/></div>
              <div className="space-y-3"><Label>Paleta de Colores Principal</Label><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{([['primary', 'Color Principal (ej. cubremantel)'], ['secondary', 'Color Secundario (ej. globos)'], ['accent', 'Color Acentos / Detalles']] as [keyof ColorPalette, string][]).map(([key, label]) => (<div key={key} className="space-y-1"><Label htmlFor={`color-${key}`} className="text-xs">{label}</Label><div className="flex items-center gap-2"><Input id={`color-${key}`} type="color" value={decoracionData.paletaColores?.[key] || '#FFFFFF'} onChange={(e) => handleColorChange(key, e.target.value)} className="w-10 h-9 p-0.5" disabled={isSaving}/><Input type="text" value={decoracionData.paletaColores?.[key] || '#FFFFFF'} onChange={(e) => handleColorChange(key, e.target.value)} className="text-xs p-1.5 h-9" placeholder="#RRGGBB" disabled={isSaving}/></div></div>))}</div></div>
              <div className="space-y-2"><Label htmlFor="moodboard-url">Imagen de Portada / Moodboard (URL)</Label><Input id="moodboard-url" type="url" value={decoracionData.moodboardImageUrl || ''} onChange={(e) => handleInputChange('moodboardImageUrl', e.target.value)} placeholder="https://ejemplo.com/moodboard.jpg" disabled={isSaving}/><p className="text-xs text-muted-foreground">Pega el enlace directo a tu imagen de inspiración.</p>{decoracionData.moodboardImageUrl && !failedMoodboardUrl ? (<div className="mt-2 p-1 border rounded inline-block"><NextImage src={decoracionData.moodboardImageUrl} alt="Moodboard" width={150} height={100} className="rounded object-contain max-h-[100px]" data-ai-hint="event moodboard" onError={() => setFailedMoodboardUrl(true)}/></div>) : (<div className="mt-2 p-3 border-dashed rounded flex items-center justify-center text-xs text-muted-foreground h-[80px] bg-muted/50"><ImageIcon className="w-6 h-6 mr-1.5"/><p>{decoracionData.moodboardImageUrl && failedMoodboardUrl ? 'Error al cargar imagen.' : 'Sin imagen de portada.'}</p></div>)}</div>
              <div className="space-y-2"><Label htmlFor="color-cubremantel">Color Cubremantel</Label><Input id="color-cubremantel" value={decoracionData.colorCubremantel || ''} onChange={(e) => handleInputChange('colorCubremantel', e.target.value)} placeholder="Ej: Blanco Hueso, Azul Marino" disabled={isSaving}/></div>
              <div className="space-y-2"><Label htmlFor="torta-descripcion">Descripción Decoración Torta</Label><Textarea id="torta-descripcion" value={decoracionData.decoracionTorta?.descripcion || ''} onChange={(e) => handleDecoracionTortaChange('descripcion', e.target.value)} placeholder="Ej: Torta de 3 pisos, estilo rústico con flores naturales y topper personalizado." rows={2} disabled={isSaving}/></div>
              <div className="space-y-2"><Label htmlFor="torta-imagen-url">Imagen Referencial Torta (URL)</Label><Input id="torta-imagen-url" type="url" value={decoracionData.decoracionTorta?.imageUrl || ''} onChange={(e) => handleDecoracionTortaChange('imageUrl', e.target.value)} placeholder="https://ejemplo.com/torta.jpg" disabled={isSaving}/>{decoracionData.decoracionTorta?.imageUrl && !failedTortaImageUrl ? (<div className="mt-1 p-1 border rounded inline-block"><NextImage src={decoracionData.decoracionTorta.imageUrl} alt="Torta" width={80} height={80} className="rounded object-contain max-h-[80px]" data-ai-hint={decoracionData.decoracionTorta.dataAiHint || "cake design"} onError={() => setFailedTortaImageUrl(true)}/></div>) : (decoracionData.decoracionTorta?.imageUrl && failedTortaImageUrl && <p className="text-xs text-destructive">Error al cargar imagen de torta.</p>)}</div>
              <div className="space-y-2"><Label htmlFor="torta-aihint">AI Hint Torta (para PDF)</Label><Input id="torta-aihint" value={decoracionData.decoracionTorta?.dataAiHint || ''} onChange={(e) => handleDecoracionTortaChange('dataAiHint', e.target.value)} placeholder="Ej: wedding cake rustic flowers" disabled={isSaving}/></div>
              <div className="space-y-2"><Label htmlFor="general-notes-decoracion">Notas Generales de Decoración (Planificación)</Label><Textarea id="general-notes-decoracion" value={decoracionData.generalNotes || ''} onChange={(e) => handleInputChange('generalNotes', e.target.value)} rows={3} disabled={isSaving} placeholder="Anotaciones para el equipo, ideas generales, etc."/></div>
              <div className="space-y-2"><Label htmlFor="pdf-notas-adicionales">Notas Adicionales (Para incluir en el PDF)</Label><Textarea id="pdf-notas-adicionales" value={decoracionData.pdfNotasAdicionales || ''} onChange={(e) => handleInputChange('pdfNotasAdicionales', e.target.value)} placeholder="Aclaraciones o detalles específicos para el cliente en el reporte PDF." rows={2} disabled={isSaving}/></div>
            </AccordionContent>
          </AccordionItem>

          {/* Elementos Decorativos Específicos */}
          <AccordionItem value="elementos" className="border rounded-lg shadow-md bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary/80"/>Elementos Decorativos Específicos</div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0 pb-3 space-y-3">
                <div className="flex justify-end mt-2">
                    <Button type="button" onClick={() => openItemModal()} disabled={isSaving} size="sm"><PlusCircle className="w-4 h-4 mr-2" />Añadir Elemento</Button>
                </div>
                {(decoracionData.items?.length || 0) > 0 ? (<ScrollArea className="h-auto max-h-[300px] pr-2"><div className="space-y-2">{decoracionData.items?.map(item => (<Card key={item.id} className="bg-muted/40 p-2"><div className="flex justify-between items-start gap-1"><div className="flex-grow"><h4 className="font-semibold text-sm">{item.name} ({item.quantity || 1}x)</h4>{item.category && <p className="text-xs text-muted-foreground">Cat: {item.category}</p>}{item.estimatedCost !== undefined && <p className="text-xs">Costo: ${item.estimatedCost.toFixed(2)}</p>}{item.notes && <p className="text-xs italic">Notas: {item.notes}</p>}</div><div className="flex gap-1 flex-shrink-0"><Button type="button" variant="ghost" size="icon" onClick={() => openItemModal(item)} className="h-6 w-6"><Edit3 className="w-3 h-3" /></Button><AlertDialogConfirm open={deletingItemId === item.id} onOpenChange={(open) => !open && setDeletingItemId(null)}><AlertDialogTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => setDeletingItemId(item.id)} className="h-6 w-6 text-destructive"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger><AlertDialogContentConfirm><AlertDialogHeaderConfirm><AlertDialogTitleConfirm>Eliminar Elemento</AlertDialogTitleConfirm><AlertDialogDescriptionConfirm>¿Seguro que deseas eliminar "{item.name}"?</AlertDialogDescriptionConfirm></AlertDialogHeaderConfirm><AlertDialogFooterConfirm><AlertDialogCancel>No</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive">Sí</AlertDialogAction></AlertDialogFooterConfirm></AlertDialogContentConfirm></AlertDialogConfirm></div></div></Card>))}</div></ScrollArea>) : (<p className="text-center text-sm text-muted-foreground py-3">No hay elementos específicos añadidos.</p>)}
            </AccordionContent>
          </AccordionItem>

          {/* Zonas del Evento */}
          <AccordionItem value="zonas" className="border rounded-lg shadow-md bg-card">
             <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-primary/80"/>Zonas del Evento</div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0 pb-3 space-y-4">
                <p className="text-sm text-muted-foreground mt-2">Activa y detalla las zonas que tendrán una decoración particular.</p>
                {(decoracionData.zonasContratadas || []).map(zona => (
                    <Card key={zona.id} className="bg-muted/30 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <Label htmlFor={`zona-check-${zona.id}`} className="text-md font-medium flex items-center gap-2 cursor-pointer">
                                <Checkbox id={`zona-check-${zona.id}`} checked={zona.activada} onCheckedChange={() => toggleZonaActivada(zona.id)} disabled={isSaving} className="w-5 h-5"/>
                                {zona.nombreDisplay}
                            </Label>
                        </div>
                        {zona.activada && (
                            <div className="space-y-3 pl-6 border-l-2 border-primary/30 ml-2">
                                <div className="space-y-1">
                                    <Label htmlFor={`zona-desc-${zona.id}`} className="text-xs">Descripción de la zona</Label>
                                    <Textarea id={`zona-desc-${zona.id}`} value={zona.descripcion || ''} onChange={(e) => handleZonaChange(zona.id, 'descripcion', e.target.value)} rows={2} placeholder={`Detalles para ${zona.nombreDisplay}...`} disabled={isSaving} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`zona-img-${zona.id}`} className="text-xs">URL Imagen de Referencia</Label>
                                    <Input id={`zona-img-${zona.id}`} type="url" value={zona.imagenReferenciaUrl || ''} onChange={(e) => handleZonaChange(zona.id, 'imagenReferenciaUrl', e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" disabled={isSaving} />
                                    {zona.imagenReferenciaUrl && !failedZonaImageUrls.has(zona.imagenReferenciaUrl) && (<div className="mt-1 p-1 border rounded inline-block"><NextImage src={zona.imagenReferenciaUrl} alt={zona.nombreDisplay} width={100} height={75} className="rounded object-contain max-h-[75px]" data-ai-hint={zona.dataAiHint || "event zone example"} onError={() => setFailedZonaImageUrls(prev => new Set(prev).add(zona.imagenReferenciaUrl!))}/></div>)}
                                    {zona.imagenReferenciaUrl && failedZonaImageUrls.has(zona.imagenReferenciaUrl) && <p className="text-xs text-destructive mt-1">Error al cargar imagen de zona.</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`zona-aihint-${zona.id}`} className="text-xs">AI Hint (para imagen en PDF)</Label>
                                    <Input id={`zona-aihint-${zona.id}`} value={zona.dataAiHint || ''} onChange={(e) => handleZonaChange(zona.id, 'dataAiHint', e.target.value)} placeholder="Ej: wedding arch flowers" disabled={isSaving} />
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <CardFooter className="border-t pt-6 mt-6"><Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}{isSaving ? 'Guardando...' : 'Guardar Configuración de Decoración'}</Button></CardFooter>
      </form>

      {/* Modal para Elementos Decorativos Específicos */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-headline text-lg">{currentItem?.id ? 'Editar' : 'Añadir'} Elemento Decorativo</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1"><Label htmlFor="item-name">Nombre*</Label><Input id="item-name" value={currentItem?.name || ''} onChange={(e) => handleItemFormChange('name', e.target.value)} required /></div>
            <div className="space-y-1"><Label htmlFor="item-category">Categoría</Label><Input id="item-category" placeholder="Ej: Centro de Mesa, Entrada, Detalle Torta" value={currentItem?.category || ''} onChange={(e) => handleItemFormChange('category', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="item-quantity">Cantidad</Label><Input id="item-quantity" type="number" value={currentItem?.quantity ?? 1} onChange={(e) => handleItemFormChange('quantity', Number(e.target.value))} min="1" /></div><div className="space-y-1"><Label htmlFor="item-cost">Costo Est. (Total)</Label><Input id="item-cost" type="number" value={currentItem?.estimatedCost === undefined ? '' : currentItem.estimatedCost} placeholder="0.00" onChange={(e) => handleItemFormChange('estimatedCost', e.target.value === '' ? undefined : parseFloat(e.target.value))} step="any" /></div></div>
            <div className="space-y-1"><Label htmlFor="item-supplier">Proveedor (Opcional)</Label><Input id="item-supplier" value={currentItem?.supplier || ''} onChange={(e) => handleItemFormChange('supplier', e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="item-imageUrl">URL Imagen Referencial</Label><Input id="item-imageUrl" type="url" value={currentItem?.imageUrl || ''} onChange={(e) => handleItemFormChange('imageUrl', e.target.value)} placeholder="https://..."/>{currentItem?.imageUrl && !failedItemImageUrls.has(currentItem.imageUrl) && <NextImage src={currentItem.imageUrl} alt="Preview" width={50} height={50} className="mt-1 border rounded object-contain" data-ai-hint={currentItem.dataAiHint || "decoration item"} onError={()=> setFailedItemImageUrls(prev => new Set(prev).add(currentItem!.imageUrl!))} />}</div>
            <div className="space-y-1"><Label htmlFor="item-aihint">AI Hint (para imagen en PDF)</Label><Input id="item-aihint" value={currentItem?.dataAiHint || ''} onChange={(e) => handleItemFormChange('dataAiHint', e.target.value)} placeholder="Ej: floral arrangement pink"/></div>
            <div className="space-y-1"><Label htmlFor="item-notes">Notas / Descripción Adicional</Label><Textarea id="item-notes" value={currentItem?.notes || ''} onChange={(e) => handleItemFormChange('notes', e.target.value)} rows={2} /></div>
            <DialogFooter className="pt-3"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">{currentItem?.id ? 'Guardar Cambios' : 'Añadir Elemento'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
    
