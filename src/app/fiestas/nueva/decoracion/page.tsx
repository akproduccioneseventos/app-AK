
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Palette, Save, Loader2, AlertTriangle, Image as ImageIconLucide, Trash2, PlusCircle, Wand2, Settings2, StickyNote, CakeSlice, Building, Gift, Camera, Sparkles as SparklesIcon, ChevronDown, ListPlus, FileText, RefreshCw, Heart, Paintbrush } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, DecoracionData, DecorationItem, ColorPalette, ZonaContratada, MoodboardItem } from '@/types/fiesta';
import { defaultDecoracion, defaultZonasContratadas } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Switch } from '@/components/ui/switch';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { UploadButton } from '@/components/invitacion/edit/UploadButton';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { addMoodboardItem, deleteMoodboardItem } from '@/app/actions/fiesta/decoracion.actions';
import VistaDecorativaEditor from '@/components/decoracion/VistaDecorativaEditor';


const ALL_DECORATION_ITEM_CATEGORIES = [
  'Detalle Entrada', 'Centro de Mesa', 'Detalle Zona Regalos', 'Detalle Cuadro Firmas', 'Mobiliario', 'Flores y Plantas', 'Iluminación', 'Textiles', 'Vajilla y Cristalería', 'Señalética', 'Globos', 'Otro'
];

const predefinedPalettes: { name: string; colors: ColorPalette }[] = [
  { name: 'Sueño Lavanda', colors: { primary: '#D9B8FF', secondary: '#E6BFB2', accent: '#DCDCDC' } },
  { name: 'Atardecer Cálido', colors: { primary: '#FCD3DE', secondary: '#F0E6CC', accent: '#F1C40F' } },
  { name: 'Oasis Sereno', colors: { primary: '#A2D2B0', secondary: '#DCDCDC', accent: '#F0E6CC' } },
];


interface ItemSectionProps {
  title: string;
  category: string;
  items: DecorationItem[];
  onAddItem: (prefill: Partial<DecorationItem>) => void;
  onEditItem: (item: DecorationItem) => void;
  onDeleteItem: (itemId: string) => void;
  failedImageUrls: Record<string, boolean>;
  setFailedImageUrls: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const ItemSection: React.FC<ItemSectionProps> = ({ title, category, items, onAddItem, onEditItem, onDeleteItem, failedImageUrls, setFailedImageUrls }) => {
  const filteredItems = items.filter(item => item.category === category);
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <Button type="button" variant="outline" size="sm" onClick={() => onAddItem({ category })}>
          <PlusCircle className="w-4 h-4 mr-1.5"/> Añadir
        </Button>
      </div>
      {filteredItems.length > 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map(item => (
            <div key={item.id} className="p-2.5 border rounded-md bg-muted/40">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{item.name}</p>
                   {item.imageUrl && !failedImageUrls[item.id] && <NextImage src={item.imageUrl} alt={item.name} width={80} height={60} className="rounded border object-contain max-h-[60px]" data-ai-hint={item.dataAiHint || "decoration item"} onError={()=>setFailedImageUrls(p=>({...p, [item.id]:true}))}/>}
                  {item.notes && <p className="text-xs italic text-muted-foreground/80 mt-0.5 whitespace-pre-line">{item.notes}</p>}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditItem(item)}><Settings2 className="w-3.5 h-3.5"/></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onDeleteItem(item.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-xs text-muted-foreground text-center py-2">No hay elementos añadidos para esta sección.</p>}
    </div>
  );
};

function DecoracionYDisenoEventoContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [decoracionData, setDecoracionData] = useState<DecoracionData>(defaultDecoracion);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<DecorationItem> | null>(null);
  
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({});

  
  const loadDecoracionData = useCallback(async (showLoading = true) => {
    if (!fiestaId) {
      setError("No se especificó ID de fiesta");
      setIsLoading(false);
      return;
    }
    if (showLoading) setIsLoading(true);
    setError(null);
    setFailedImageUrls({});
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada");

      let loadedDecoracion = fiestaData.decoracion || defaultDecoracion;
      
      // Sincronizar items de decoración desde el presupuesto si están vacíos
      if ((!loadedDecoracion.items || loadedDecoracion.items.length === 0) && fiestaData.presupuestoId) {
          const budget = await getPresupuestoById(fiestaData.presupuestoId);
          if (budget) {
              const decoBudgetItems = budget.itemsPresupuestados.filter(item => 
                item.categoriaServicio?.toLowerCase().includes('decoración') ||
                item.categoriaServicio?.toLowerCase().includes('ambientación')
              );
              if (decoBudgetItems.length > 0) {
                  const newItems: DecorationItem[] = decoBudgetItems.map(bi => ({
                      id: `budget_${bi.idServicioCatalogo}`,
                      name: bi.nombreServicio,
                      quantity: bi.cantidad,
                      estimatedCost: bi.precioUnitarioPresupuesto,
                      category: 'Otro'
                  }));
                  loadedDecoracion = { ...loadedDecoracion, items: newItems };
              }
          }
      }

      const mergedZonas = defaultZonasContratadas.map(defaultZona => {
        const savedZona = loadedDecoracion.zonasContratadas?.find(sz => sz.id === defaultZona.id);
        return savedZona ? { ...defaultZona, ...savedZona } : { ...defaultZona };
      });

      setDecoracionData({
        ...defaultDecoracion,
        ...loadedDecoracion,
        items: loadedDecoracion.items || [],
        moodboardItems: loadedDecoracion.moodboardItems || [],
        zonasContratadas: mergedZonas,
        salonElements: loadedDecoracion.salonElements || [],
        paletaColores: {
          ...defaultDecoracion.paletaColores,
          ...(loadedDecoracion.paletaColores || {})
        } as ColorPalette,
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
  }, [toast, fiestaId]);

  useEffect(() => {
    loadDecoracionData();
  }, [loadDecoracionData]);

  const handleInputChange = <K extends keyof DecoracionData>(field: K, value: DecoracionData[K]) => {
    setDecoracionData(prev => ({ ...prev, [field]: value } as DecoracionData));
  };

  const handleColorChange = (colorType: keyof ColorPalette, value: string) => {
    setDecoracionData(prev => ({
      ...prev,
      paletaColores: {
        ...(prev.paletaColores || defaultDecoracion.paletaColores),
        [colorType]: value,
      } as ColorPalette,
    } as DecoracionData));
  };
  
  const handleSelectPalette = (palette: ColorPalette) => {
    setDecoracionData(prev => ({
      ...prev,
      paletaColores: palette,
    }));
    toast({ title: 'Paleta Aplicada', description: 'Los colores del evento han sido actualizados.' });
  };

  const handleTortaChange = (field: keyof NonNullable<DecoracionData['decoracionTorta']>, value: string) => {
    setDecoracionData(prev => ({
      ...prev,
      decoracionTorta: {
        ...(prev.decoracionTorta || defaultDecoracion.decoracionTorta),
        [field]: value,
      },
    }));
  };

  const handleZonaChange = (zonaId: ZonaContratada['id'], field: keyof ZonaContratada, value: string | boolean) => {
    setDecoracionData(prev => ({
      ...prev,
      zonasContratadas: (prev.zonasContratadas || []).map(zona =>
        zona.id === zonaId ? { ...zona, [field]: value } : zona
      ),
    }));
  };
  
  const openItemModal = (prefillData?: Partial<DecorationItem>) => {
    setCurrentItem(prefillData?.id ? { ...prefillData } : { id: '', name: '', quantity: 1, category: prefillData?.category || 'Otro', ...prefillData });
    setIsItemModalOpen(true);
  };

  const handleItemModalChange = (field: keyof DecorationItem, value: string | number) => {
    setCurrentItem(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleItemModalSave = () => {
    if (!currentItem || !currentItem.name?.trim()) {
      toast({ title: "Nombre requerido", description: "El nombre del elemento es obligatorio.", variant: "destructive" });
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

  const handleAddMoodboardPhoto = async (url: string) => {
      if (!fiestaId) return;
      const res = await addMoodboardItem(fiestaId, url);
      if (res.success) {
          toast({ title: "Foto de inspiración añadida" });
          loadDecoracionData(false);
      } else {
          toast({ title: "Error", description: res.error, variant: "destructive" });
      }
  };

  const handleDeleteMoodboardPhoto = async (itemId: string) => {
      if (!fiestaId) return;
      const res = await deleteMoodboardItem(fiestaId, itemId);
      if (res.success) {
          toast({ title: "Foto eliminada" });
          loadDecoracionData(false);
      }
  };
  
  const handleSaveDecoracion = async (e: FormEvent) => {
    e.preventDefault();
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateDecoracionFiestaActual(fiestaId, decoracionData);
      if (result.success && result.updatedData) {
        toast({ title: "¡Decoración Guardada!", description: "Los detalles de decoración se han actualizado." });
        loadDecoracionData(false);
      } else {
        throw new Error(result.error || "Error desconocido al guardar la decoración.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVistaDecorativa = useCallback(async (data: NonNullable<DecoracionData['vistaDecorativa']>) => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const updated: DecoracionData = { ...decoracionData, vistaDecorativa: data };
      const result = await updateDecoracionFiestaActual(fiestaId, updated);
      if (result.success) {
        setDecoracionData(updated);
        toast({ title: "¡Vista Decorativa Guardada!" });
      } else {
        throw new Error(result.error || "Error desconocido");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [fiestaId, decoracionData, toast]);


  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando decoración...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Palette className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Decoración y Diseño</h1></div>
        <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => loadDecoracionData(true)} title="Sincronizar con presupuesto">
                <RefreshCw className="w-4 h-4 mr-2"/> Sincronizar
            </Button>
            <Link href={`/fiestas/nueva/decoracion/pdf?fiestaId=${fiestaId}`}>
                <Button variant="outline" disabled={isSaving}><FileText className="w-4 h-4 mr-2"/>Ver PDF</Button>
            </Link>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      <Tabs defaultValue="decoracion">
        <TabsList className="mb-4">
          <TabsTrigger value="decoracion" className="gap-2">
            <Wand2 className="w-4 h-4" /> Decoración
          </TabsTrigger>
          <TabsTrigger value="vista-decorativa" className="gap-2">
            <Paintbrush className="w-4 h-4" /> Vista Decorativa
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Decoración (existing content) ── */}
        <TabsContent value="decoracion">
      <form onSubmit={handleSaveDecoracion}>
        <Card className="shadow-lg mb-6 border-primary/20">
          <CardHeader className="bg-primary/5">
              <div className="flex items-center gap-3">
                  <Wand2 className="w-6 h-6 text-primary" />
                  <CardTitle className="font-headline text-xl">Módulo 3: Dream Designer (Moodboard)</CardTitle>
              </div>
              <CardDescription>Sube fotos de inspiración. El cliente podrá darles "like" desde su portal para definir el estilo final.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="p-6 border-2 border-dashed rounded-2xl bg-muted/20 flex flex-col items-center justify-center text-center">
                <ImageIconLucide className="w-10 h-10 text-muted-foreground/40 mb-2"/>
                <Label className="mb-4">Añadir foto de inspiración al Moodboard</Label>
                <UploadButton onUrlChange={handleAddMoodboardPhoto} fiestaId={fiestaId || undefined} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(decoracionData.moodboardItems || []).map((item) => (
                    <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border group shadow-sm bg-white">
                        <NextImage src={item.url} alt="inspiración" layout="fill" objectFit="cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <div className="flex justify-end">
                                <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteMoodboardPhoto(item.id)}>
                                    <Trash2 className="w-4 h-4"/>
                                </Button>
                            </div>
                            {item.likedByClient && (
                                <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg flex items-center justify-center gap-1.5 animate-in fade-in zoom-in">
                                    <Heart className="w-4 h-4 text-rose-500 fill-current" />
                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">¡Favorito!</span>
                                </div>
                            )}
                        </div>
                        {item.likedByClient && !isSaving && (
                            <div className="absolute top-2 left-2 bg-rose-500 text-white p-1 rounded-full shadow-lg">
                                <Heart className="w-3 h-3 fill-current" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {(!decoracionData.moodboardItems || decoracionData.moodboardItems.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-10 italic">Aún no hay fotos en el tablero de sueños.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><Settings2 className="text-primary"/>Configuración General</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="tema-evento">Tema del Evento</Label><Input id="tema-evento" value={decoracionData.tema || ''} onChange={e => handleInputChange('tema', e.target.value)} placeholder="Ej: Rústico Chic, Tropical, Años 80" /></div>
              <div className="space-y-2"><Label htmlFor="color-cubremantel">Color Cubremantel</Label><Input id="color-cubremantel" value={decoracionData.colorCubremantel || ''} onChange={e => handleInputChange('colorCubremantel', e.target.value)} placeholder="Ej: Blanco, Azul Marino" /></div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Label className="font-medium">Paleta de Colores Principal (Manual)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 border rounded-md bg-muted/20">
                {(Object.keys(defaultDecoracion.paletaColores!) as Array<keyof ColorPalette>).map(key => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`color-${key}`} className="text-xs capitalize">{key}</Label>
                    <div className="flex items-center gap-2">
                        <Input type="color" id={`color-picker-${key}`} value={decoracionData.paletaColores?.[key] || defaultDecoracion.paletaColores![key]} onChange={e => handleColorChange(key, e.target.value)} className="w-10 h-10 p-0.5 aspect-square"/>
                        <Input type="text" value={decoracionData.paletaColores?.[key] || defaultDecoracion.paletaColores![key]} onChange={e => handleColorChange(key, e.target.value)} className="h-9 text-sm" placeholder="#RRGGBB"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="font-medium">Paletas de Colores Predefinidas</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {predefinedPalettes.map((palette) => (
                  <Button
                    key={palette.name}
                    type="button"
                    variant="outline"
                    className="h-auto p-3 text-left flex flex-col items-start gap-2"
                    onClick={() => handleSelectPalette(palette.colors)}
                  >
                    <div className="flex gap-1.5">
                      <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: palette.colors.primary }} />
                      <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: palette.colors.secondary }} />
                      <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: palette.colors.accent }} />
                    </div>
                    <span className="text-sm">{palette.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2"><Label htmlFor="general-notes-decoracion">Notas Generales de Decoración</Label><Textarea id="general-notes-decoracion" value={decoracionData.generalNotesDecoracion || ''} onChange={e => handleInputChange('generalNotesDecoracion', e.target.value)} rows={3} placeholder="Ideas, conceptos, elementos clave..."/></div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><CakeSlice className="text-primary"/>Decoración de la Torta</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="torta-desc">Descripción</Label><Textarea id="torta-desc" value={decoracionData.decoracionTorta?.descripcion || ''} onChange={e => handleTortaChange('descripcion', e.target.value)} rows={2} placeholder="Estilo, colores, detalles especiales..." /></div>
            <div className="space-y-2">
                <Label htmlFor="torta-img">Imagen de Referencia Torta</Label>
                <UploadButton 
                    currentUrl={decoracionData.decoracionTorta?.imageUrl}
                    onUrlChange={(url) => handleTortaChange('imageUrl', url)}
                    fiestaId={fiestaId || undefined}
                />
            {decoracionData.decoracionTorta?.imageUrl && !failedImageUrls['tortaImageUrl'] && <NextImage src={decoracionData.decoracionTorta.imageUrl} alt="Torta Preview" width={150} height={100} className="mt-1 rounded border object-contain max-h-[100px]" data-ai-hint={decoracionData.decoracionTorta.dataAiHint || "cake design style"} onError={()=>setFailedImageUrls(p=>({...p, tortaImageUrl:true}))}/>}
            </div>
            <div className="space-y-2"><Label htmlFor="torta-aihint">AI Hint (para imagen en PDF)</Label><Input id="torta-aihint" value={decoracionData.decoracionTorta?.dataAiHint || ''} onChange={e => handleTortaChange('dataAiHint', e.target.value)} placeholder="Ej: wedding cake rustic flowers" /></div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2">
              <ListPlus className="text-primary"/>Elementos Decorativos Clave (Catálogo Interno)
            </CardTitle>
            <CardDescription>Añade y detalla los elementos físicos específicos que se usarán en el salón.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ItemSection
                title="Entradas"
                category="Detalle Entrada"
                items={decoracionData.items || []}
                onAddItem={openItemModal}
                onEditItem={openItemModal}
                onDeleteItem={handleDeleteItem}
                failedImageUrls={failedImageUrls}
                setFailedImageUrls={setFailedImageUrls}
            />
            <Separator/>
            <ItemSection
                title="Centros de Mesa"
                category="Centro de Mesa"
                items={decoracionData.items || []}
                onAddItem={openItemModal}
                onEditItem={openItemModal}
                onDeleteItem={handleDeleteItem}
                failedImageUrls={failedImageUrls}
                setFailedImageUrls={setFailedImageUrls}
            />
             <Separator/>
             <ItemSection
                title="Detalles para Zona de Regalos"
                category="Detalle Zona Regalos"
                items={decoracionData.items || []}
                onAddItem={openItemModal}
                onEditItem={openItemModal}
                onDeleteItem={handleDeleteItem}
                failedImageUrls={failedImageUrls}
                setFailedImageUrls={setFailedImageUrls}
            />
             <Separator/>
              <ItemSection
                title="Detalles para Cuadro de Firmas / Photocall"
                category="Detalle Cuadro Firmas"
                items={decoracionData.items || []}
                onAddItem={openItemModal}
                onEditItem={openItemModal}
                onDeleteItem={handleDeleteItem}
                failedImageUrls={failedImageUrls}
                setFailedImageUrls={setFailedImageUrls}
            />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><ImageIconLucide className="text-primary"/>Zonas Decorativas Específicas Contratadas</CardTitle></CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full space-y-3" defaultValue={(decoracionData.zonasContratadas || []).filter(z => z.activada).map(z => z.id)}>
              {(decoracionData.zonasContratadas || defaultZonasContratadas).map(zona => (
                <AccordionItem key={zona.id} value={zona.id} className="border rounded-lg shadow-sm bg-card">
                  <AccordionPrimitive.Header className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-t-lg">
                    <AccordionPrimitive.Trigger
                      className={cn(
                        "flex flex-1 items-center gap-2 text-lg font-medium text-primary hover:no-underline",
                        "[&[data-state=open]>svg:last-child]:rotate-180" 
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
                        onClick={e => e.stopPropagation()} 
                        className="ml-4 flex-shrink-0"
                        aria-label={`Activar ${zona.nombreDisplay}`}
                    />
                  </AccordionPrimitive.Header>
                  <AccordionContent className="px-4 pb-4 space-y-4 border-t">
                    {zona.activada && (<>
                        <div className="space-y-2 mt-2"><Label htmlFor={`zona-desc-${zona.id}`}>Descripción</Label><Textarea id={`zona-desc-${zona.id}`} value={zona.descripcion || ''} onChange={e => handleZonaChange(zona.id, 'descripcion', e.target.value)} rows={2} placeholder="Detalles de decoración para esta zona"/></div>
                        <div className="space-y-2">
                          <Label htmlFor={`zona-img-${zona.id}`}>Imagen de Referencia</Label>
                          <UploadButton 
                              currentUrl={zona.imagenReferenciaUrl}
                              onUrlChange={url => handleZonaChange(zona.id, 'imagenReferenciaUrl', url)}
                              fiestaId={fiestaId || undefined}
                          />
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
        </TabsContent>

        {/* ── Tab: Vista Decorativa ── */}
        <TabsContent value="vista-decorativa">
          <Card className="shadow-lg">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center gap-3">
                <Paintbrush className="w-6 h-6 text-primary" />
                <CardTitle className="font-headline text-xl">Vista Decorativa</CardTitle>
              </div>
              <CardDescription>
                Diseñá visualmente el salón: arrastrá elementos decorativos, asignales colores y exportá el resultado como imagen.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <VistaDecorativaEditor
                vistaDecorativa={decoracionData.vistaDecorativa ?? { elementos: [] }}
                paletaColores={decoracionData.paletaColores ?? { primary: '#D9B8FF', secondary: '#E6BFB2', accent: '#DCDCDC' }}
                fiestaId={fiestaId ?? ''}
                onSave={handleSaveVistaDecorativa}
                isSaving={isSaving}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Item Modal */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Añadir'} Elemento Decorativo</DialogTitle>{currentItem?.category && <DialogDescription>Añadiendo a la categoría: <span className="font-semibold text-primary">{currentItem.category}</span></DialogDescription>}</DialogHeader>
          {currentItem && (
            <div className="py-4 space-y-4">
              <div className="space-y-1"><Label htmlFor="item-name">Nombre *</Label><Input id="item-name" value={currentItem.name || ''} onChange={e => handleItemModalChange('name', e.target.value)} required /></div>
              <div className="space-y-1"><Label htmlFor="item-category">Categoría</Label><Select value={currentItem.category || 'Otro'} onValueChange={val => handleItemModalChange('category', val)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ALL_DECORATION_ITEM_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="item-qty">Cantidad</Label><Input id="item-qty" type="number" value={currentItem.quantity ?? 1} onChange={e => handleItemModalChange('quantity', Number(e.target.value) || 1)} min="1"/></div><div className="space-y-1"><Label htmlFor="item-cost">Costo Est. ($)</Label><Input id="item-cost" type="number" value={currentItem.estimatedCost ?? 0} onChange={e => handleItemModalChange('estimatedCost', e.target.value === '' ? 0 : Number(e.target.value))} placeholder="0.00" min="0" step="any"/></div></div>
              <div className="space-y-1"><Label htmlFor="item-supplier">Proveedor (Opcional)</Label><Input id="item-supplier" value={currentItem.supplier || ''} onChange={e => handleItemModalChange('supplier', e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="item-notes">Notas (Opcional)</Label><Textarea id="item-notes" value={currentItem.notes || ''} onChange={e => handleItemModalChange('notes', e.target.value)} rows={2}/></div>
              <div className="space-y-1">
                  <Label htmlFor="item-img-url">Imagen (Opcional)</Label>
                  <UploadButton 
                    currentUrl={currentItem.imageUrl} 
                    onUrlChange={(url) => handleItemModalChange('imageUrl', url)}
                    fiestaId={fiestaId || undefined}
                  />
              </div>
              <div className="space-y-1"><Label htmlFor="item-aihint">AI Hint (para imagen en PDF)</Label><Input id="item-aihint" value={currentItem.dataAiHint || ''} onChange={e => handleItemModalChange('dataAiHint', e.target.value)} placeholder="Ej: vintage table centerpiece" /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => { setIsItemModalOpen(false); setCurrentItem(null); }}>Cancelar</Button><Button onClick={handleItemModalSave}>Guardar Elemento</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}

export default function DecoracionPageWrapper() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <DecoracionYDisenoEventoContent/>
        </Suspense>
    )
}
