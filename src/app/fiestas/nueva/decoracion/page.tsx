
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
import { ArrowLeft, Palette, Save, Loader2, AlertTriangle, Image as ImageIconLucide, Trash2, PlusCircle, Wand2, Settings2, StickyNote, CakeSlice, Building, Gift, Camera, Sparkles as SparklesIcon, ChevronDown, ListPlus, FileText, RefreshCw, Heart, Paintbrush, CheckSquare, ShoppingCart, DollarSign, MapPin, Star, Flower2, Music2, PartyPopper, BookOpen, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, DecoracionData, DecorationItem, ColorPalette, ZonaContratada, MoodboardItem, DecoItem, DecoZona, DecoChecklistItem } from '@/types/fiesta';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';


const ALL_DECORATION_ITEM_CATEGORIES = [
  'Detalle Entrada', 'Centro de Mesa', 'Detalle Zona Regalos', 'Detalle Cuadro Firmas', 'Mobiliario', 'Flores y Plantas', 'Iluminación', 'Textiles', 'Vajilla y Cristalería', 'Señalética', 'Globos', 'Otro'
];

// --- CREATOR PARTY CONSTANTS ---

const ESTILOS_DECORACION = [
  { id: 'elegante', label: 'Elegante Clásico', emoji: '✨', colors: { primary: '#c9a96e', secondary: '#f5f0e8', accent: '#2c2c2c' }, description: 'Sofisticado y atemporal con dorados y blancos' },
  { id: 'rustico', label: 'Rústico / Boho', emoji: '🌿', colors: { primary: '#8b6a3e', secondary: '#d4c5a9', accent: '#5c7a4e' }, description: 'Natural, madera, flores silvestres y tonos tierra' },
  { id: 'moderno', label: 'Moderno Minimalista', emoji: '🖤', colors: { primary: '#1a1a2e', secondary: '#e8e8e8', accent: '#4a90d9' }, description: 'Líneas limpias, colores neutros, espacios despejados' },
  { id: 'infantil', label: 'Infantil Colorido', emoji: '🎠', colors: { primary: '#ff6b9d', secondary: '#ffd93d', accent: '#6bcb77' }, description: 'Alegre, colorido, con personajes y juegos' },
  { id: 'tropical', label: 'Tropical', emoji: '🌺', colors: { primary: '#ff6b35', secondary: '#ffd700', accent: '#2ecc71' }, description: 'Vibrante, palmas, flores tropicales y colores vivos' },
  { id: 'romantico', label: 'Romántico', emoji: '🌹', colors: { primary: '#e91e8c', secondary: '#fce4ec', accent: '#9c27b0' }, description: 'Rosas, velas, tonos rosados y detalles delicados' },
  { id: 'industrial', label: 'Industrial', emoji: '🏭', colors: { primary: '#607d8b', secondary: '#455a64', accent: '#ff9800' }, description: 'Acero, ladrillo expuesto, madera oscura y luces colgantes' },
];

const CATALOGO_ITEMS: { categoria: string; emoji: string; items: string[] }[] = [
  { categoria: 'Centros de Mesa', emoji: '🌸', items: ['Flores naturales', 'Flores artificiales', 'Velas flotantes', 'Jarrones con ramas', 'Terrarios', 'Fanales con flores', 'Candelabros', 'Arreglo tropical'] },
  { categoria: 'Globos', emoji: '🎈', items: ['Arco de globos', 'Columna de globos', 'Bouquet de globos', 'Globos con confetti', 'Globos metálicos', 'Globos personalizados', 'Guirnalda de globos'] },
  { categoria: 'Guirnaldas', emoji: '✨', items: ['Fairy lights', 'Banderines de tela', 'Banderines de papel', 'Flores colgantes', 'Guirnalda de hojas', 'Luces LED', 'Tul colgante'] },
  { categoria: 'Fundas y Lazos', emoji: '🪑', items: ['Fundas de silla blancas', 'Fundas de silla de color', 'Lazos de organza', 'Lazos de raso', 'Fajas para silla', 'Telas para mesas'] },
  { categoria: 'Iluminación', emoji: '🕯️', items: ['Velas LED de mesa', 'Spots de color', 'Gobos personalizados', 'Luces de uplighting', 'Iluminación de piso', 'Disco ball', 'Lámpara araña'] },
  { categoria: 'Flores y Plantas', emoji: '🌿', items: ['Arreglo de entrada', 'Centro altar', 'Corona floral', 'Guirnalda de flores', 'Planta decorativa', 'Ramo para mesa principal', 'Pétalos en piso'] },
  { categoria: 'Mantelería', emoji: '🎀', items: ['Manteles blancos', 'Manteles de color', 'Caminos de mesa', 'Servilletas de tela', 'Cubrecaminos', 'Telas de organza', 'Hule de mesa'] },
  { categoria: 'Candy Bar', emoji: '🍬', items: ['Mesa de dulces', 'Torta principal', 'Cupcakes', 'Mesa de macarons', 'Souvenirs', 'Piruletas personalizadas', 'Alfajores', 'Chocolates'] },
  { categoria: 'Photobooth', emoji: '📸', items: ['Backdrop impreso', 'Marco de fotos', 'Props temáticos', 'Letras LED', 'Arco floral photobooth', 'Pizarra de nombres', 'Polaroid props'] },
  { categoria: 'Entrada / Recepción', emoji: '🚪', items: ['Cartel de bienvenida', 'Mesa de regalos', 'Libro de firmas', 'Seating chart', 'Señalética de mesas', 'Paragüero de sobres', 'Ambientación de acceso'] },
];

const ZONAS_DEFAULT: DecoZona[] = [
  { id: 'zona_entrada', nombre: 'Entrada', items: [] },
  { id: 'zona_mesas', nombre: 'Mesas', items: [] },
  { id: 'zona_principal', nombre: 'Mesa Principal', items: [] },
  { id: 'zona_pista', nombre: 'Pista de Baile', items: [] },
  { id: 'zona_candy', nombre: 'Candy Bar', items: [] },
  { id: 'zona_photobooth', nombre: 'Photobooth', items: [] },
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
  const [isDecoItemModalOpen, setIsDecoItemModalOpen] = useState(false);
  const [currentDecoItem, setCurrentDecoItem] = useState<Partial<DecoItem> | null>(null);
  const [newDecoItemName, setNewDecoItemName] = useState('');
  const [newDecoItemCat, setNewDecoItemCat] = useState('');
  const [newDecoItemQty, setNewDecoItemQty] = useState(1);
  const [newDecoItemPrice, setNewDecoItemPrice] = useState<number | undefined>(undefined);
  const [newDecoItemZona, setNewDecoItemZona] = useState('');

  
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

  const handleSaveClick = async () => {
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

  // --- Creator Party Handlers ---

  const handleSelectEstilo = (estiloId: string) => {
    const estilo = ESTILOS_DECORACION.find(e => e.id === estiloId);
    if (!estilo) return;
    setDecoracionData(prev => ({
      ...prev,
      estiloDecoracion: estiloId as DecoracionData['estiloDecoracion'],
      paletaColores: estilo.colors,
      colorPalette: estilo.colors,
      tema: prev.tema || estilo.label,
    }));
    toast({ title: `Estilo aplicado: ${estilo.label}`, description: 'Paleta de colores actualizada.' });
  };

  const handleAddDecoItem = (nombre: string, categoria: string, cantidad: number = 1, precio?: number, zona?: string) => {
    const newItem: DecoItem = {
      id: `di_${Date.now()}`,
      nombre,
      categoria,
      cantidad,
      precioUnitario: precio,
      zona: zona || '',
      estado: 'pendiente',
    };
    setDecoracionData(prev => ({
      ...prev,
      itemsDecoracion: [...(prev.itemsDecoracion || []), newItem],
    }));
  };

  const handleUpdateDecoItemEstado = (itemId: string, estado: DecoItem['estado']) => {
    setDecoracionData(prev => ({
      ...prev,
      itemsDecoracion: (prev.itemsDecoracion || []).map(it => it.id === itemId ? { ...it, estado } : it),
    }));
  };

  const handleDeleteDecoItem = (itemId: string) => {
    setDecoracionData(prev => ({
      ...prev,
      itemsDecoracion: (prev.itemsDecoracion || []).filter(it => it.id !== itemId),
    }));
  };

  const handleToggleChecklist = (itemId: string) => {
    setDecoracionData(prev => ({
      ...prev,
      checklistDecoracion: (prev.checklistDecoracion || []).map(ci =>
        ci.id === itemId ? { ...ci, completado: !ci.completado } : ci
      ),
    }));
  };

  const handleAddChecklistItem = (item: string, zona: string) => {
    const newCi: DecoChecklistItem = {
      id: `ci_${Date.now()}`,
      item,
      zona,
      completado: false,
    };
    setDecoracionData(prev => ({
      ...prev,
      checklistDecoracion: [...(prev.checklistDecoracion || []), newCi],
    }));
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    setDecoracionData(prev => ({
      ...prev,
      checklistDecoracion: (prev.checklistDecoracion || []).filter(ci => ci.id !== itemId),
    }));
  };

  const calcPresupuestoTotal = () => {
    return (decoracionData.itemsDecoracion || []).reduce((sum, it) => {
      return sum + ((it.precioUnitario || 0) * it.cantidad);
    }, 0);
  };

  const openDecoItemModal = (categoria: string, nombre: string) => {
    setNewDecoItemName(nombre);
    setNewDecoItemCat(categoria);
    setNewDecoItemQty(1);
    setNewDecoItemPrice(undefined);
    setNewDecoItemZona('');
    setIsDecoItemModalOpen(true);
  };

  const handleSaveDecoItemFromModal = () => {
    if (!newDecoItemName.trim()) return;
    handleAddDecoItem(newDecoItemName, newDecoItemCat, newDecoItemQty, newDecoItemPrice, newDecoItemZona);
    setIsDecoItemModalOpen(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando decoración...</p></div>;
  }

  return (
    <div className="space-y-6">

      {/* Deco Item Quick Add Modal */}
      <Dialog open={isDecoItemModalOpen} onOpenChange={setIsDecoItemModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Añadir al Catálogo</DialogTitle>
            <DialogDescription>Item: <span className="font-bold text-primary">{newDecoItemName}</span> — {newDecoItemCat}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Nombre</Label>
              <Input value={newDecoItemName} onChange={e => setNewDecoItemName(e.target.value)} className="rounded-xl h-12 bg-slate-50 border-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Cantidad</Label>
                <Input type="number" min={1} value={newDecoItemQty} onChange={e => setNewDecoItemQty(Number(e.target.value))} className="rounded-xl h-12 bg-slate-50 border-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Precio Unit. ($)</Label>
                <Input type="number" min={0} step="0.01" value={newDecoItemPrice ?? ''} onChange={e => setNewDecoItemPrice(e.target.value ? Number(e.target.value) : undefined)} placeholder="Opcional" className="rounded-xl h-12 bg-slate-50 border-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Zona</Label>
              <Select value={newDecoItemZona} onValueChange={setNewDecoItemZona}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none">
                  <SelectValue placeholder="Seleccionar zona..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {ZONAS_DEFAULT.map(z => <SelectItem key={z.id} value={z.id}>{z.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsDecoItemModalOpen(false)} className="flex-1 rounded-xl h-12">Cancelar</Button>
            <Button onClick={handleSaveDecoItemFromModal} className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/20">
              <PlusCircle className="w-4 h-4 mr-2" /> Añadir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      <Tabs defaultValue="estilo">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-1 bg-slate-100 p-1 rounded-2xl">
          <TabsTrigger value="estilo" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <Star className="w-4 h-4" /> Estilo
          </TabsTrigger>
          <TabsTrigger value="catalogo" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <Package className="w-4 h-4" /> Catálogo
          </TabsTrigger>
          <TabsTrigger value="presupuesto" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <DollarSign className="w-4 h-4" /> Presupuesto
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <CheckSquare className="w-4 h-4" /> Checklist
          </TabsTrigger>
          <TabsTrigger value="zonas" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <MapPin className="w-4 h-4" /> Zonas
          </TabsTrigger>
          <TabsTrigger value="decoracion" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <Wand2 className="w-4 h-4" /> Detalles
          </TabsTrigger>
          <TabsTrigger value="vista-decorativa" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <Paintbrush className="w-4 h-4" /> Vista
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Estilo / Tema ── */}
        <TabsContent value="estilo" className="space-y-6">
          {/* Estilo selector */}
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white"><Star className="w-6 h-6"/></div>
                <div>
                  <CardTitle className="font-headline text-xl">Estilo del Evento</CardTitle>
                  <CardDescription>Elegí el estilo y se aplicará la paleta de colores automáticamente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ESTILOS_DECORACION.map(estilo => (
                  <button
                    key={estilo.id}
                    type="button"
                    onClick={() => handleSelectEstilo(estilo.id)}
                    className={cn(
                      "relative p-4 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                      decoracionData.estiloDecoracion === estilo.id
                        ? "border-primary shadow-xl shadow-primary/20 bg-primary/5"
                        : "border-slate-200 bg-white hover:border-primary/50"
                    )}
                  >
                    {decoracionData.estiloDecoracion === estilo.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <CheckSquare className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-3xl mb-2">{estilo.emoji}</div>
                    <div className="font-bold text-sm text-slate-800">{estilo.label}</div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{estilo.description}</div>
                    <div className="flex gap-1 mt-3">
                      {Object.values(estilo.colors).map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Paleta de colores */}
          <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md">
            <CardHeader className="p-6">
              <CardTitle className="font-headline text-xl flex items-center gap-2"><Palette className="w-5 h-5 text-primary"/>Paleta de Colores</CardTitle>
              <CardDescription>Personalizá los colores del evento</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {(['primary', 'secondary', 'accent'] as const).map((key) => (
                  <div key={key} className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 capitalize">{key === 'primary' ? 'Principal' : key === 'secondary' ? 'Secundario' : 'Acento'}</Label>
                    <div className="flex gap-3 items-center">
                      <div className="relative">
                        <input
                          type="color"
                          value={decoracionData.paletaColores?.[key] || '#ffffff'}
                          onChange={e => handleColorChange(key, e.target.value)}
                          className="w-14 h-14 rounded-2xl border-none cursor-pointer p-1 shadow-lg"
                          style={{ backgroundColor: decoracionData.paletaColores?.[key] || '#ffffff' }}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={decoracionData.paletaColores?.[key] || ''}
                          onChange={e => handleColorChange(key, e.target.value)}
                          placeholder="#RRGGBB"
                          className="rounded-xl h-10 bg-slate-50 border-none font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paletas Predefinidas</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {predefinedPalettes.map((palette) => (
                    <Button
                      key={palette.name}
                      type="button"
                      variant="outline"
                      className="h-auto p-3 text-left flex flex-col items-start gap-2 rounded-2xl hover:border-primary/50"
                      onClick={() => handleSelectPalette(palette.colors)}
                    >
                      <div className="flex gap-1.5">
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: palette.colors.primary }} />
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: palette.colors.secondary }} />
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: palette.colors.accent }} />
                      </div>
                      <span className="text-sm font-semibold">{palette.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tema del Evento</Label>
                  <Input value={decoracionData.tema || ''} onChange={e => handleInputChange('tema', e.target.value)} placeholder="Ej: Rústico Chic, Tropical, Años 80" className="rounded-xl h-12 bg-slate-50 border-none"/>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Color Cubremantel</Label>
                  <Input value={decoracionData.colorCubremantel || ''} onChange={e => handleInputChange('colorCubremantel', e.target.value)} placeholder="Ej: Blanco, Azul Marino" className="rounded-xl h-12 bg-slate-50 border-none"/>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSaveClick} size="lg" className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/20" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar Estilo y Colores
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Tab: Catálogo ── */}
        <TabsContent value="catalogo" className="space-y-4">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-violet-500/10 to-violet-500/5 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-500 rounded-2xl shadow-xl shadow-violet-500/20 text-white"><Package className="w-6 h-6"/></div>
                <div>
                  <CardTitle className="font-headline text-xl">Catálogo de Decoración</CardTitle>
                  <CardDescription>Seleccioná items para agregar a tu evento. Se sincroniza con la vista 3D.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {CATALOGO_ITEMS.map(cat => (
                <div key={cat.categoria} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{cat.emoji}</span>
                    <h4 className="font-black text-sm uppercase tracking-widest text-slate-700">{cat.categoria}</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {cat.items.map(itemNombre => {
                      const ya = (decoracionData.itemsDecoracion || []).some(di => di.nombre === itemNombre && di.categoria === cat.categoria);
                      return (
                        <button
                          key={itemNombre}
                          type="button"
                          onClick={() => ya ? undefined : openDecoItemModal(cat.categoria, itemNombre)}
                          className={cn(
                            "p-3 rounded-2xl border text-left text-xs font-semibold transition-all duration-200",
                            ya
                              ? "bg-primary/10 border-primary text-primary cursor-default"
                              : "bg-white border-slate-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md cursor-pointer"
                          )}
                        >
                          {ya && <span className="mr-1">✓</span>}
                          {itemNombre}
                        </button>
                      );
                    })}
                  </div>
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Items seleccionados */}
          {(decoracionData.itemsDecoracion || []).length > 0 && (
            <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md">
              <CardHeader className="p-6">
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary"/>
                  Items Seleccionados ({(decoracionData.itemsDecoracion || []).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {(decoracionData.itemsDecoracion || []).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{item.nombre}</span>
                          <Badge variant="outline" className="text-[10px] rounded-full">{item.categoria}</Badge>
                          {item.zona && <Badge variant="secondary" className="text-[10px] rounded-full">{ZONAS_DEFAULT.find(z => z.id === item.zona)?.nombre || item.zona}</Badge>}
                          <Badge
                            className={cn("text-[10px] rounded-full cursor-pointer", 
                              item.estado === 'instalado' ? 'bg-green-100 text-green-700 border-green-200' :
                              item.estado === 'comprado' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-amber-100 text-amber-700 border-amber-200'
                            )}
                            onClick={() => {
                              const next = item.estado === 'pendiente' ? 'comprado' : item.estado === 'comprado' ? 'instalado' : 'pendiente';
                              handleUpdateDecoItemEstado(item.id, next);
                            }}
                          >
                            {item.estado === 'instalado' ? '✓ Instalado' : item.estado === 'comprado' ? '🛒 Comprado' : '⏳ Pendiente'}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Cant: {item.cantidad} {item.precioUnitario ? `· $${(item.precioUnitario * item.cantidad).toLocaleString()}` : ''}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDecoItem(item.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl shrink-0">
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t p-6">
                <Button onClick={handleSaveClick} size="lg" className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/20" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Guardar Catálogo
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Presupuesto ── */}
        <TabsContent value="presupuesto">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20 text-white"><DollarSign className="w-6 h-6"/></div>
                <div>
                  <CardTitle className="font-headline text-xl">Presupuesto de Decoración</CardTitle>
                  <CardDescription>Costos estimados de los items seleccionados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {(decoracionData.itemsDecoracion || []).length === 0 ? (
                <div className="text-center py-16 opacity-40">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300"/>
                  <p className="font-bold text-slate-500">Agrega items desde el Catálogo para ver el presupuesto</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Item</th>
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Categoría</th>
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Zona</th>
                          <th className="text-center p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Cant.</th>
                          <th className="text-right p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">P. Unit.</th>
                          <th className="text-right p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(decoracionData.itemsDecoracion || []).map((item, i) => (
                          <tr key={item.id} className={cn("border-b border-slate-50", i % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                            <td className="p-4 font-semibold text-slate-800">{item.nombre}</td>
                            <td className="p-4 text-slate-500 text-xs">{item.categoria}</td>
                            <td className="p-4 text-slate-500 text-xs">{ZONAS_DEFAULT.find(z => z.id === item.zona)?.nombre || item.zona || '—'}</td>
                            <td className="p-4 text-center font-bold text-slate-700">{item.cantidad}</td>
                            <td className="p-4 text-right text-slate-500">{item.precioUnitario ? `$${item.precioUnitario.toLocaleString()}` : '—'}</td>
                            <td className="p-4 text-right font-bold text-slate-800">
                              {item.precioUnitario ? `$${(item.precioUnitario * item.cantidad).toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary/5 border-t-2 border-primary/20">
                          <td colSpan={5} className="p-4 font-black text-right text-primary uppercase tracking-widest text-sm">TOTAL ESTIMADO</td>
                          <td className="p-4 text-right font-black text-xl text-primary">${calcPresupuestoTotal().toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="text-xs text-slate-400 italic text-center">* Los precios son estimados y pueden variar según proveedor</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSaveClick} size="lg" className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/20" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar Presupuesto
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Tab: Checklist ── */}
        <TabsContent value="checklist">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-sky-500/10 to-sky-500/5 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sky-500 rounded-2xl shadow-xl shadow-sky-500/20 text-white"><CheckSquare className="w-6 h-6"/></div>
                <div>
                  <CardTitle className="font-headline text-xl">Checklist de Decoración</CardTitle>
                  <CardDescription>Para el día del evento: marcá cada item mientras lo instalás</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Auto-generate checklist from items */}
              {(decoracionData.itemsDecoracion || []).length > 0 && (decoracionData.checklistDecoracion || []).length === 0 && (
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sky-700 text-sm">Generar checklist automático</p>
                    <p className="text-xs text-sky-600">Creá una lista basada en los items del catálogo</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      (decoracionData.itemsDecoracion || []).forEach(item => {
                        handleAddChecklistItem(`${item.nombre} (x${item.cantidad})`, item.zona || 'zona_mesas');
                      });
                    }}
                    className="rounded-xl border-sky-300 text-sky-700 hover:bg-sky-100"
                  >
                    <Wand2 className="w-4 h-4 mr-2"/> Auto-generar
                  </Button>
                </div>
              )}

              {/* Group by zone */}
              {ZONAS_DEFAULT.map(zona => {
                const zonaItems = (decoracionData.checklistDecoracion || []).filter(ci => ci.zona === zona.id);
                if (zonaItems.length === 0) return null;
                const completados = zonaItems.filter(ci => ci.completado).length;
                return (
                  <div key={zona.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm uppercase tracking-widest text-slate-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary"/>
                        {zona.nombre}
                      </h4>
                      <Badge variant={completados === zonaItems.length ? "default" : "secondary"} className="rounded-full">
                        {completados}/{zonaItems.length}
                      </Badge>
                    </div>
                    <div className="space-y-2 pl-6">
                      {zonaItems.map(ci => (
                        <div key={ci.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={ci.completado}
                              onCheckedChange={() => handleToggleChecklist(ci.id)}
                              className="rounded-md"
                            />
                            <span className={cn("text-sm font-medium", ci.completado && "line-through text-slate-400")}>
                              {ci.item}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteChecklistItem(ci.id)} className="h-7 w-7 text-slate-400 hover:text-destructive rounded-lg">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </div>
                );
              })}

              {/* Items without zone */}
              {(decoracionData.checklistDecoracion || []).filter(ci => !ZONAS_DEFAULT.find(z => z.id === ci.zona)).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black text-sm uppercase tracking-widest text-slate-500">Sin zona asignada</h4>
                  {(decoracionData.checklistDecoracion || []).filter(ci => !ZONAS_DEFAULT.find(z => z.id === ci.zona)).map(ci => (
                    <div key={ci.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={ci.completado} onCheckedChange={() => handleToggleChecklist(ci.id)} />
                        <span className={cn("text-sm font-medium", ci.completado && "line-through text-slate-400")}>{ci.item}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteChecklistItem(ci.id)} className="h-7 w-7 text-slate-400 hover:text-destructive rounded-lg">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {(decoracionData.checklistDecoracion || []).length === 0 && (
                <div className="text-center py-16 opacity-40">
                  <CheckSquare className="w-16 h-16 mx-auto mb-4 text-slate-300"/>
                  <p className="font-bold text-slate-500">El checklist está vacío</p>
                  <p className="text-xs text-slate-400 mt-1">Agrega items desde el Catálogo o usa auto-generar</p>
                </div>
              )}

              {/* Manual add */}
              <div className="pt-4 border-t border-slate-100">
                <ChecklistAddForm onAdd={handleAddChecklistItem} />
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSaveClick} size="lg" className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/20" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar Checklist
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Tab: Zonas ── */}
        <TabsContent value="zonas">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-rose-500/10 to-rose-500/5 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500 rounded-2xl shadow-xl shadow-rose-500/20 text-white"><MapPin className="w-6 h-6"/></div>
                <div>
                  <CardTitle className="font-headline text-xl">Decoración por Zona</CardTitle>
                  <CardDescription>Vista de qué decoración hay en cada zona del salón</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {ZONAS_DEFAULT.map(zona => {
                  const zonaItems = (decoracionData.itemsDecoracion || []).filter(di => di.zona === zona.id);
                  return (
                    <div key={zona.id} className={cn(
                      "p-5 rounded-2xl border-2 transition-all",
                      zonaItems.length > 0 ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-slate-50/50"
                    )}>
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-primary"/>
                        <h4 className="font-black text-sm uppercase tracking-widest text-slate-700">{zona.nombre}</h4>
                        <Badge variant={zonaItems.length > 0 ? "default" : "secondary"} className="ml-auto rounded-full text-[10px]">
                          {zonaItems.length} items
                        </Badge>
                      </div>
                      {zonaItems.length > 0 ? (
                        <div className="space-y-1.5">
                          {zonaItems.map(item => (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0"/>
                              <span className="font-medium text-slate-700 truncate">{item.nombre}</span>
                              <span className="text-slate-400 shrink-0">x{item.cantidad}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Sin elementos asignados</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Detalles Decoración (existing content) ── */}
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

// --- ChecklistAddForm sub-component ---
function ChecklistAddForm({ onAdd }: { onAdd: (item: string, zona: string) => void }) {
  const [item, setItem] = React.useState('');
  const [zona, setZona] = React.useState(ZONAS_DEFAULT[0].id);
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Input
        value={item}
        onChange={e => setItem(e.target.value)}
        placeholder="Nuevo item del checklist..."
        className="rounded-xl h-11 bg-slate-50 border-none flex-1"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (item.trim()) { onAdd(item, zona); setItem(''); } } }}
      />
      <Select value={zona} onValueChange={setZona}>
        <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-none shadow-2xl">
          {ZONAS_DEFAULT.map(z => <SelectItem key={z.id} value={z.id}>{z.nombre}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button
        type="button"
        onClick={() => { if (item.trim()) { onAdd(item, zona); setItem(''); } }}
        disabled={!item.trim()}
        className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20"
      >
        <PlusCircle className="w-4 h-4 mr-2"/> Añadir
      </Button>
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
