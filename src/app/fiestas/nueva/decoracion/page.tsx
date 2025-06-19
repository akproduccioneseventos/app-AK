
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// Checkbox import removed as it's not used in this version for Zonas, Switch is.
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Palette, Save, Loader2, AlertTriangle, Image as ImageIconLucide, Trash2, PlusCircle, Wand2, Settings2, LayoutDashboard, StickyNote, CakeSlice, Building, Gift, Camera, Sparkles as SparklesIcon, Flower, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, DecoracionData, DecorationItem, ColorPalette, ZonaContratada, LayoutElement } from '@/types/fiesta';
import { defaultDecoracion, defaultZonasContratadas } from '@/lib/fiesta-defaults';
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
  DialogClose
} from "@/components/ui/dialog";
import {
  Accordion, // Main Accordion from shadcn/ui
  AccordionContent, // From shadcn/ui
  AccordionItem, // From shadcn/ui
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion"; // For finer control
import { cn } from "@/lib/utils";

const ALL_DECORATION_ITEM_CATEGORIES = [
  'Mobiliario', 'Flores y Plantas', 'Iluminación', 'Textiles', 'Vajilla y Cristalería', 'Centros de Mesa', 'Señalética', 'Detalles Especiales', 'Globos', 'Otro'
];


export default function DecoracionYDisenoEventoPage() {
  const { toast } = useToast();
  const [decoracionData, setDecoracionData] = useState<DecoracionData>(defaultDecoracion);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<DecorationItem> | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({});

  const loadDecoracionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFailedImageUrls({});
    try {
      const fiestaData = await getFiestaActual();
      const loadedDecoracion = fiestaData.decoracion || defaultDecoracion;
      
      const mergedZonas = defaultZonasContratadas.map(defaultZona => {
        const savedZona = loadedDecoracion.zonasContratadas?.find(sz => sz.id === defaultZona.id);
        return savedZona ? { ...defaultZona, ...savedZona } : { ...defaultZona };
      });

      setDecoracionData({
        ...defaultDecoracion,
        ...loadedDecoracion,
        items: loadedDecoracion.items || [],
        zonasContratadas: mergedZonas,
        salonElements: loadedDecoracion.salonElements || [],
        paletaColores: {
          ...defaultDecoracion.paletaColores,
          ...(loadedDecoracion.paletaColores || {})
        },
        decoracionTorta: {
          ...defaultDecoracion.decoracionTorta,
          ...(loadedDecoracion.decoracionTorta || {})
        }
      });

    } catch (err: any) {
      console.error("Error loading decoration data:", err);
      setError("No se pudo cargar la configuración de decoración.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDecoracionData();
  }, [loadDecoracionData]);

  const handleInputChange = <K extends keyof DecoracionData>(field: K, value: DecoracionData[K]) => {
    setDecoracionData(prev => ({ ...prev, [field]: value }));
    if (field === 'moodboardImageUrl' || field === 'salonPlanBackgroundImageUrl') {
        setFailedImageUrls(prevFailed => ({...prevFailed, [field as string]: false}));
    }
  };

  const handleColorChange = (colorType: keyof ColorPalette, value: string) => {
    setDecoracionData(prev => ({
      ...prev,
      paletaColores: {
        ...(prev.paletaColores || defaultDecoracion.paletaColores),
        [colorType]: value,
      },
    }));
  };

  const handleTortaChange = (field: keyof NonNullable<DecoracionData['decoracionTorta']>, value: string) => {
    setDecoracionData(prev => ({
      ...prev,
      decoracionTorta: {
        ...(prev.decoracionTorta || defaultDecoracion.decoracionTorta),
        [field]: value,
      },
    }));
    if (field === 'imageUrl') {
        setFailedImageUrls(prevFailed => ({...prevFailed, 'tortaImageUrl': false}));
    }
  };

  const handleZonaChange = (zonaId: ZonaContratada['id'], field: keyof ZonaContratada, value: string | boolean) => {
    setDecoracionData(prev => ({
      ...prev,
      zonasContratadas: (prev.zonasContratadas || []).map(zona =>
        zona.id === zonaId ? { ...zona, [field]: value } : zona
      ),
    }));
    if (field === 'imagenReferenciaUrl') {
        setFailedImageUrls(prevFailed => ({...prevFailed, [zonaId]: false}));
    }
  };
  
  const handleImageFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    setImageCallback: (dataUrl: string) => void,
    imageKeyForFailure?: string
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageCallback(reader.result as string);
        if (imageKeyForFailure) setFailedImageUrls(prev => ({...prev, [imageKeyForFailure]: false}));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const openItemModal = (item?: DecorationItem) => {
    setCurrentItem(item ? { ...item } : { id: '', name: '', quantity: 1, category: 'Otro' });
    setItemImagePreview(item?.imageUrl || null);
    setIsItemModalOpen(true);
  };

  const handleItemModalChange = (field: keyof DecorationItem, value: string | number) => {
    setCurrentItem(prev => prev ? { ...prev, [field]: value } : null);
    if (field === 'imageUrl') setItemImagePreview(value as string);
  };

  const handleItemModalSave = () => {
    if (!currentItem || !currentItem.name?.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre del elemento es obligatorio.", variant: "destructive" });
      return;
    }
    setDecoracionData(prev => {
      const items = prev.items || [];
      if (currentItem.id && items.some(it => it.id === currentItem.id)) {
        return { ...prev, items: items.map(it => it.id === currentItem.id ? (currentItem as DecorationItem) : it) };
      } else {
        return { ...prev, items: [...items, { ...currentItem, id: `decItem_${Date.now()}` } as DecorationItem] };
      }
    });
    setIsItemModalOpen(false);
    setCurrentItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    setDecoracionData(prev => ({ ...prev, items: (prev.items || []).filter(it => it.id !== itemId) }));
  };
  
  const handleSaveDecoracion = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updateDecoracionFiestaActual(decoracionData);
      if (result.success && result.updatedData) {
        toast({ title: "¡Decoración Guardada!", description: "Los detalles de decoración se han actualizado." });
        const loadedDecoracion = result.updatedData || defaultDecoracion;
        const mergedZonas = defaultZonasContratadas.map(defaultZona => {
            const savedZona = loadedDecoracion.zonasContratadas?.find(sz => sz.id === defaultZona.id);
            return savedZona ? { ...defaultZona, ...savedZona } : { ...defaultZona };
        });
        setDecoracionData({
          ...defaultDecoracion, ...loadedDecoracion, items: loadedDecoracion.items || [], 
          zonasContratadas: mergedZonas, salonElements: loadedDecoracion.salonElements || [],
           paletaColores: {...defaultDecoracion.paletaColores, ...(loadedDecoracion.paletaColores || {})},
           decoracionTorta: {...defaultDecoracion.decoracionTorta, ...(loadedDecoracion.decoracionTorta || {})}
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
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando decoración...</p></div>;
  }
  if (error) {
    return <div className="py-10 text-center text-red-600"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p><Button onClick={loadDecoracionData} className="mt-4">Reintentar</Button></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Palette className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">🎨 Decoración y Diseño del Evento</h1></div>
        <div className="flex gap-2">
        <Link href="/fiestas/nueva/decoracion/pdf" passHref>
            <Button variant="outline" size="sm" disabled={isSaving}>Ver PDF Decoración</Button>
          </Link>
          <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      <form onSubmit={handleSaveDecoracion}>
        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><Settings2 className="text-primary"/>Configuración General de Decoración</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="tema-evento">Tema del Evento</Label><Input id="tema-evento" value={decoracionData.tema || ''} onChange={e => handleInputChange('tema', e.target.value)} placeholder="Ej: Rústico Chic, Tropical, Años 80" /></div>
              <div className="space-y-2"><Label htmlFor="color-cubremantel">Color Cubremantel</Label><Input id="color-cubremantel" value={decoracionData.colorCubremantel || ''} onChange={e => handleInputChange('colorCubremantel', e.target.value)} placeholder="Ej: Blanco, Azul Marino" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="color-globos">Combinación de Colores Globos (si aplica)</Label><Input id="color-globos" value={decoracionData.colorGlobos || ''} onChange={e => handleInputChange('colorGlobos', e.target.value)} placeholder="Ej: Dorado, Blanco y Rosa" /></div>
            
            <div className="space-y-3">
              <Label className="font-medium">Paleta de Colores Principal</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 border rounded-md bg-muted/20">
                {(Object.keys(defaultDecoracion.paletaColores!) as Array<keyof ColorPalette>).map(key => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`color-${key}`} className="text-xs capitalize">{key}</Label>
                    <div className="flex items-center gap-2">
                        <Input type="color" id={`color-${key}`} value={decoracionData.paletaColores?.[key] || defaultDecoracion.paletaColores![key]} onChange={e => handleColorChange(key, e.target.value)} className="w-10 h-10 p-0.5 aspect-square"/>
                        <Input type="text" value={decoracionData.paletaColores?.[key] || defaultDecoracion.paletaColores![key]} onChange={e => handleColorChange(key, e.target.value)} className="h-9 text-sm" placeholder="#RRGGBB"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="moodboard-url">URL de Moodboard/Imagen de Portada General</Label><Input id="moodboard-url" type="url" value={decoracionData.moodboardImageUrl || ''} onChange={e => handleInputChange('moodboardImageUrl', e.target.value)} placeholder="https://ejemplo.com/moodboard.jpg"/>
             {decoracionData.moodboardImageUrl && !failedImageUrls['moodboardImageUrl'] && <NextImage src={decoracionData.moodboardImageUrl} alt="Moodboard Preview" width={200} height={120} className="mt-1 rounded border object-contain max-h-[120px]" data-ai-hint="event moodboard inspiration" onError={()=>setFailedImageUrls(p=>({...p, moodboardImageUrl:true}))}/>}
            </div>
            <div className="space-y-2"><Label htmlFor="general-notes-decoracion">Notas Generales de Decoración</Label><Textarea id="general-notes-decoracion" value={decoracionData.generalNotesDecoracion || ''} onChange={e => handleInputChange('generalNotesDecoracion', e.target.value)} rows={3} placeholder="Ideas, conceptos, elementos clave..."/></div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><CakeSlice className="text-primary"/>Decoración de la Torta</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="torta-desc">Descripción</Label><Textarea id="torta-desc" value={decoracionData.decoracionTorta?.descripcion || ''} onChange={e => handleTortaChange('descripcion', e.target.value)} rows={2} placeholder="Estilo, colores, detalles especiales..." /></div>
            <div className="space-y-2"><Label htmlFor="torta-img">URL Imagen de Referencia Torta</Label><Input id="torta-img" type="url" value={decoracionData.decoracionTorta?.imageUrl || ''} onChange={e => handleTortaChange('imageUrl', e.target.value)} placeholder="https://ejemplo.com/torta.jpg"/>
            {decoracionData.decoracionTorta?.imageUrl && !failedImageUrls['tortaImageUrl'] && <NextImage src={decoracionData.decoracionTorta.imageUrl} alt="Torta Preview" width={150} height={100} className="mt-1 rounded border object-contain max-h-[100px]" data-ai-hint={decoracionData.decoracionTorta.dataAiHint || "cake design style"} onError={()=>setFailedImageUrls(p=>({...p, tortaImageUrl:true}))}/>}
            </div>
            <div className="space-y-2"><Label htmlFor="torta-aihint">AI Hint (para imagen en PDF)</Label><Input id="torta-aihint" value={decoracionData.decoracionTorta?.dataAiHint || ''} onChange={e => handleTortaChange('dataAiHint', e.target.value)} placeholder="Ej: wedding cake rustic flowers" /></div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Wand2 className="text-primary"/>Otros Elementos Decorativos Específicos</CardTitle>
            <Button type="button" onClick={() => openItemModal()} size="sm" className="mt-2"><PlusCircle className="w-4 h-4 mr-1.5"/>Añadir Elemento</Button>
          </CardHeader>
          <CardContent>
            {(decoracionData.items && decoracionData.items.length > 0) ? (
              <ScrollArea className="h-auto max-h-[400px] pr-2">
                <div className="space-y-3">
                  {decoracionData.items.map(item => (
                    <Card key={item.id} className="p-3 bg-muted/30 hover:shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{item.name} <span className="text-xs text-muted-foreground">({item.category || 'Sin categoría'})</span></p>
                          <p className="text-xs">Cantidad: {item.quantity} {item.supplier && `| Prov: ${item.supplier}`} {item.estimatedCost !== undefined && `| Costo: $${item.estimatedCost}`}</p>
                          {item.notes && <p className="text-xs italic text-muted-foreground/80 mt-0.5">Nota: {item.notes}</p>}
                           {item.imageUrl && !failedImageUrls[item.id] && <NextImage src={item.imageUrl} alt={item.name} width={80} height={60} className="mt-1 rounded border object-contain max-h-[60px]" data-ai-hint={item.dataAiHint || "decoration item"} onError={()=>setFailedImageUrls(p=>({...p, [item.id]: true}))}/>}
                        </div>
                        <div className="flex gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openItemModal(item)}><Settings2 className="w-3.5 h-3.5"/></Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : <p className="text-sm text-muted-foreground text-center py-3">No hay elementos decorativos específicos añadidos.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><LayoutDashboard className="text-primary"/>Zonas Decorativas Específicas</CardTitle></CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full space-y-3" defaultValue={(decoracionData.zonasContratadas || []).filter(z => z.activada).map(z => z.id)}>
              {(decoracionData.zonasContratadas || defaultZonasContratadas).map(zona => (
                <AccordionItem key={zona.id} value={zona.id} className="border rounded-lg shadow-sm bg-card">
                  <AccordionPrimitive.Header className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-t-lg">
                    <AccordionPrimitive.Trigger
                      className={cn(
                        "flex flex-1 items-center gap-2 text-lg font-medium text-primary hover:no-underline",
                        "[&[data-state=open]>svg:last-child]:rotate-180" // Ensure Chevron rotates
                      )}
                    >
                      {React.createElement(
                        zona.id === 'atras_torta' ? CakeSlice :
                        zona.id === 'frente_salon' ? Building :
                        zona.id === 'zona_regalos' ? Gift :
                        zona.id === 'zona_fotografia' ? Camera : SparklesIcon,
                        { className: 'w-5 h-5 text-primary/80'}
                      )}
                      {zona.nombreDisplay}
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-auto" />
                    </AccordionPrimitive.Trigger>
                    <Switch
                        checked={zona.activada}
                        onCheckedChange={value => handleZonaChange(zona.id, 'activada', value)}
                        onClick={e => e.stopPropagation()} // Prevent accordion toggle when clicking switch
                        className="ml-4 flex-shrink-0"
                        aria-label={`Activar ${zona.nombreDisplay}`}
                    />
                  </AccordionPrimitive.Header>
                  <AccordionContent className="px-4 pt-0 pb-4 space-y-4 border-t">
                    {zona.activada && (<>
                        <div className="space-y-2 mt-2"><Label htmlFor={`zona-desc-${zona.id}`}>Descripción</Label><Textarea id={`zona-desc-${zona.id}`} value={zona.descripcion || ''} onChange={e => handleZonaChange(zona.id, 'descripcion', e.target.value)} rows={2} placeholder="Detalles de decoración para esta zona"/></div>
                        <div className="space-y-2"><Label htmlFor={`zona-img-${zona.id}`}>URL Imagen de Referencia</Label><Input id={`zona-img-${zona.id}`} type="url" value={zona.imagenReferenciaUrl || ''} onChange={e => handleZonaChange(zona.id, 'imagenReferenciaUrl', e.target.value)} placeholder="https://ejemplo.com/imagen_zona.jpg"/>
                        {zona.imagenReferenciaUrl && !failedImageUrls[zona.id] && <NextImage src={zona.imagenReferenciaUrl} alt={zona.nombreDisplay} width={150} height={100} className="mt-1 rounded border object-contain max-h-[100px]" data-ai-hint={zona.dataAiHint || "event zone decoration"} onError={()=>setFailedImageUrls(p=>({...p, [zona.id]: true}))}/>}
                        </div>
                        <div className="space-y-2"><Label htmlFor={`zona-aihint-${zona.id}`}>AI Hint (para imagen en PDF)</Label><Input id={`zona-aihint-${zona.id}`} value={zona.dataAiHint || ''} onChange={e => handleZonaChange(zona.id, 'dataAiHint', e.target.value)} placeholder="Ej: elegant wedding entrance" /></div>
                    </>)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><LayoutDashboard className="text-primary"/>Diseño del Salón y Disposición de Elementos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="salon-plan-bg">URL Imagen de Fondo para Plano del Salón</Label><Input id="salon-plan-bg" type="url" value={decoracionData.salonPlanBackgroundImageUrl || ''} onChange={e => handleInputChange('salonPlanBackgroundImageUrl', e.target.value)} placeholder="https://ejemplo.com/plano_salon.png"/>
            {decoracionData.salonPlanBackgroundImageUrl && !failedImageUrls['salonPlanBackgroundImageUrl'] && <NextImage src={decoracionData.salonPlanBackgroundImageUrl} alt="Plano Salón Preview" width={300} height={200} className="mt-1 rounded border object-contain max-h-[200px]" data-ai-hint="event floor plan" onError={()=>setFailedImageUrls(p=>({...p, salonPlanBackgroundImageUrl:true}))}/>}
            </div>
            <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
              <p className="text-sm">El diseñador interactivo de planos estará disponible próximamente.</p>
              <p className="text-xs">Por ahora, puedes subir una imagen de fondo y añadir notas sobre la disposición.</p>
            </div>
            <div className="space-y-2"><Label htmlFor="general-notes-salonlayout">Notas Generales de Disposición del Salón</Label><Textarea id="general-notes-salonlayout" value={decoracionData.generalNotesSalonLayout || ''} onChange={e => handleInputChange('generalNotesSalonLayout', e.target.value)} rows={3} placeholder="Ubicación de mesas, pista de baile, áreas especiales..."/></div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><StickyNote className="text-primary"/>Notas Adicionales para el PDF de Decoración</CardTitle></CardHeader>
          <CardContent><Textarea value={decoracionData.pdfNotasAdicionales || ''} onChange={e => handleInputChange('pdfNotasAdicionales', e.target.value)} rows={3} placeholder="Aclaraciones, detalles importantes para el equipo, etc."/></CardContent>
        </Card>

        <CardFooter className="border-t pt-6">
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? 'Guardando Decoración...' : 'Guardar Toda la Decoración'}
          </Button>
        </CardFooter>
      </form>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Añadir'} Elemento Decorativo</DialogTitle>
          </DialogHeader>
          {currentItem && (
            <div className="py-4 space-y-4">
              <div className="space-y-1"><Label htmlFor="item-name">Nombre *</Label><Input id="item-name" value={currentItem.name || ''} onChange={e => handleItemModalChange('name', e.target.value)} required /></div>
              <div className="space-y-1"><Label htmlFor="item-category">Categoría</Label>
                <Select value={currentItem.category || 'Otro'} onValueChange={val => handleItemModalChange('category', val)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{ALL_DECORATION_ITEM_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label htmlFor="item-qty">Cantidad</Label><Input id="item-qty" type="number" value={currentItem.quantity ?? 1} onChange={e => handleItemModalChange('quantity', Number(e.target.value) || 1)} min="1"/></div>
                <div className="space-y-1"><Label htmlFor="item-cost">Costo Est. ($)</Label><Input id="item-cost" type="number" value={currentItem.estimatedCost ?? ''} onChange={e => handleItemModalChange('estimatedCost', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="0.00" min="0" step="any"/></div>
              </div>
              <div className="space-y-1"><Label htmlFor="item-supplier">Proveedor (Opcional)</Label><Input id="item-supplier" value={currentItem.supplier || ''} onChange={e => handleItemModalChange('supplier', e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="item-notes">Notas (Opcional)</Label><Textarea id="item-notes" value={currentItem.notes || ''} onChange={e => handleItemModalChange('notes', e.target.value)} rows={2}/></div>
              <div className="space-y-1"><Label htmlFor="item-img-url">URL Imagen (Opcional)</Label><Input id="item-img-url" type="url" value={currentItem.imageUrl || ''} onChange={e => handleItemModalChange('imageUrl', e.target.value)} />
              {itemImagePreview && <NextImage src={itemImagePreview} alt="Preview" width={100} height={70} className="mt-1 rounded border object-contain max-h-[70px]" data-ai-hint={currentItem.dataAiHint || "decoration item photo"} onError={()=>setItemImagePreview(null)}/>}
              </div>
              <div className="space-y-1"><Label htmlFor="item-aihint">AI Hint (para imagen en PDF)</Label><Input id="item-aihint" value={currentItem.dataAiHint || ''} onChange={e => handleItemModalChange('dataAiHint', e.target.value)} placeholder="Ej: vintage table centerpiece" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsItemModalOpen(false); setCurrentItem(null); }}>Cancelar</Button>
            <Button onClick={handleItemModalSave}>Guardar Elemento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    