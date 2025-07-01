

'use client';

import React, { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Palette, Save, Loader2, AlertTriangle, Image as ImageIconLucide, Trash2, PlusCircle, Wand2, Settings2, StickyNote, CakeSlice, Building, Gift, Camera, Sparkles as SparklesIcon, Flower, ChevronDown, ListPlus, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, DecoracionData, DecorationItem, ColorPalette, ZonaContratada } from '@/types/fiesta';
import { defaultDecoracion, defaultZonasContratadas } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { suggestPalette, type ColorPalette as SuggestedPalette } from '@/ai/flows/suggest-palette-flow';


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
}

const ItemSection: React.FC<ItemSectionProps> = ({ title, category, items, onAddItem, onEditItem, onDeleteItem, failedImageUrls }) => {
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
                   {item.imageUrl && !failedImageUrls[item.id] && <NextImage src={item.imageUrl} alt={item.name} width={80} height={60} className="rounded border object-contain max-h-[60px]" data-ai-hint={item.dataAiHint || "decoration item"} />}
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

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiThemeInput, setAiThemeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedPalette, setSuggestedPalette] = useState<SuggestedPalette | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  
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
    if (field === 'moodboardImageUrl') {
        setFailedImageUrls(prevFailed => ({...prevFailed, moodboardImageUrl: false}));
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
  
  const openItemModal = (prefillData?: Partial<DecorationItem>) => {
    setCurrentItem(prefillData?.id ? { ...prefillData } : { id: '', name: '', quantity: 1, category: prefillData?.category || 'Otro', ...prefillData });
    setItemImagePreview(prefillData?.imageUrl || null);
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

  const handleGeneratePalette = async () => {
    if (!aiThemeInput.trim()) {
      setAiError("Por favor, ingresa un tema o descripción.");
      return;
    }
    setIsGenerating(true);
    setAiError(null);
    setSuggestedPalette(null);
    try {
      const result = await suggestPalette({ themeDescription: aiThemeInput });
      if (result) {
        setSuggestedPalette(result);
      } else {
        throw new Error("La IA no pudo generar una paleta. Intenta con otra descripción.");
      }
    } catch (err: any) {
      console.error("Error generating palette:", err);
      setAiError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySuggestedPalette = () => {
    if (suggestedPalette) {
      handleSelectPalette(suggestedPalette);
      setIsAiModalOpen(false);
      setSuggestedPalette(null);
      setAiThemeInput('');
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
            
            <Separator />
            
            <div className="space-y-3">
              <Label className="font-medium">Paleta de Colores Principal (Manual)</Label>
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
            
            <div className="space-y-2"><Label htmlFor="moodboard-url">URL de Moodboard/Imagen de Portada General</Label><Input id="moodboard-url" type="url" value={decoracionData.moodboardImageUrl || ''} onChange={e => handleInputChange('moodboardImageUrl', e.target.value)} placeholder="https://ejemplo.com/moodboard.jpg"/>
             {decoracionData.moodboardImageUrl && !failedImageUrls['moodboardImageUrl'] && <NextImage src={decoracionData.moodboardImageUrl} alt="Moodboard Preview" width={200} height={120} className="mt-1 rounded border object-contain max-h-[120px]" data-ai-hint="event moodboard inspiration" onError={()=>setFailedImageUrls(p=>({...p, moodboardImageUrl:true}))}/>}
            </div>
            <div className="space-y-2"><Label htmlFor="general-notes-decoracion">Notas Generales de Decoración</Label><Textarea id="general-notes-decoracion" value={decoracionData.generalNotesDecoracion || ''} onChange={e => handleInputChange('generalNotesDecoracion', e.target.value)} rows={3} placeholder="Ideas, conceptos, elementos clave..."/></div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2"><Wand2 className="text-primary"/>Consejos de IA</CardTitle></CardHeader>
          <CardContent className="text-center text-muted-foreground space-y-3">
              <p className="text-sm">Obtén sugerencias de combinaciones de colores y estilos basadas en el tema de tu evento.</p>
              <Dialog open={isAiModalOpen} onOpenChange={(open) => {
                  setIsAiModalOpen(open);
                  if (!open) {
                      setAiError(null);
                      setSuggestedPalette(null);
                  }
              }}>
                <DialogTrigger asChild>
                  <Button variant="secondary"><Wand2 className="w-4 h-4 mr-2"/>Generar Paleta de Colores con IA</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generador de Paleta de Colores</DialogTitle>
                    <DialogDescription>Describe el tema o la atmósfera de tu evento y la IA sugerirá una paleta de colores armoniosa.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1">
                      <Label htmlFor="ai-theme-input">Tema o Descripción del Evento</Label>
                      <Input id="ai-theme-input" value={aiThemeInput} onChange={(e) => setAiThemeInput(e.target.value)} placeholder="Ej: Boda rústica en el bosque, fiesta de los 80 neón"/>
                    </div>
                    {isGenerating && (
                      <div className="flex items-center justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary mr-2" /> <p>Generando...</p></div>
                    )}
                    {aiError && (
                      <p className="text-sm text-destructive">{aiError}</p>
                    )}
                    {suggestedPalette && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-sm font-medium">Sugerencia de la IA:</h4>
                        <div className="flex justify-around items-center p-3 border rounded-md">
                          <div className="text-center"><div className="w-12 h-12 rounded-full mx-auto border" style={{backgroundColor: suggestedPalette.primary}}></div><p className="text-xs mt-1">Principal</p><p className="text-xs font-mono">{suggestedPalette.primary}</p></div>
                          <div className="text-center"><div className="w-12 h-12 rounded-full mx-auto border" style={{backgroundColor: suggestedPalette.secondary}}></div><p className="text-xs mt-1">Secundario</p><p className="text-xs font-mono">{suggestedPalette.secondary}</p></div>
                          <div className="text-center"><div className="w-12 h-12 rounded-full mx-auto border" style={{backgroundColor: suggestedPalette.accent}}></div><p className="text-xs mt-1">Acento</p><p className="text-xs font-mono">{suggestedPalette.accent}</p></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={handleGeneratePalette} disabled={isGenerating || !aiThemeInput.trim()}>
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Generar'}
                    </Button>
                    <Button type="button" onClick={handleApplySuggestedPalette} disabled={isGenerating || !suggestedPalette}>Aplicar Paleta</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
          <CardHeader><CardTitle className="font-headline text-xl flex items-center gap-2">
              <ListPlus className="text-primary"/>Elementos Decorativos Clave
            </CardTitle>
            <CardDescription>Añade y detalla los elementos específicos para las áreas principales del evento.</CardDescription>
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
                  <AccordionContent className="px-4 pt-2 pb-4 space-y-4 border-t">
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

      {/* Item Modal */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Añadir'} Elemento Decorativo</DialogTitle>{currentItem?.category && <DialogDescription>Añadiendo a la categoría: <span className="font-semibold text-primary">{currentItem.category}</span></DialogDescription>}</DialogHeader>
          {currentItem && (
            <div className="py-4 space-y-4">
              <div className="space-y-1"><Label htmlFor="item-name">Nombre *</Label><Input id="item-name" value={currentItem.name || ''} onChange={e => handleItemModalChange('name', e.target.value)} required /></div>
              <div className="space-y-1"><Label htmlFor="item-category">Categoría</Label><Select value={currentItem.category || 'Otro'} onValueChange={val => handleItemModalChange('category', val)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ALL_DECORATION_ITEM_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="item-qty">Cantidad</Label><Input id="item-qty" type="number" value={currentItem.quantity ?? 1} onChange={e => handleItemModalChange('quantity', Number(e.target.value) || 1)} min="1"/></div><div className="space-y-1"><Label htmlFor="item-cost">Costo Est. ($)</Label><Input id="item-cost" type="number" value={currentItem.estimatedCost ?? ''} onChange={e => handleItemModalChange('estimatedCost', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="0.00" min="0" step="any"/></div></div>
              <div className="space-y-1"><Label htmlFor="item-supplier">Proveedor (Opcional)</Label><Input id="item-supplier" value={currentItem.supplier || ''} onChange={e => handleItemModalChange('supplier', e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="item-notes">Notas (Opcional)</Label><Textarea id="item-notes" value={currentItem.notes || ''} onChange={e => handleItemModalChange('notes', e.target.value)} rows={2}/></div>
              <div className="space-y-1"><Label htmlFor="item-img-url">URL Imagen (Opcional)</Label><Input id="item-img-url" type="url" value={currentItem.imageUrl || ''} onChange={e => handleItemModalChange('imageUrl', e.target.value)} />{itemImagePreview && <NextImage src={itemImagePreview} alt="Preview" width={100} height={70} className="mt-1 rounded border object-contain max-h-[70px]" data-ai-hint={currentItem.dataAiHint || "decoration item photo"} onError={()=>setItemImagePreview(null)}/>}</div>
              <div className="space-y-1"><Label htmlFor="item-aihint">AI Hint (para imagen en PDF)</Label><Input id="item-aihint" value={currentItem.dataAiHint || ''} onChange={e => handleItemModalChange('dataAiHint', e.target.value)} placeholder="Ej: vintage table centerpiece" /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => { setIsItemModalOpen(false); setCurrentItem(null); }}>Cancelar</Button><Button onClick={handleItemModalSave}>Guardar Elemento</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
