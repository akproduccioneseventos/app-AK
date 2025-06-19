
'use client';

import React, { useState, type FormEvent, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Palette, Save, Loader2, Image as ImageIconLucide, AlertTriangle, ImageOff, PlusCircle, Edit3, Trash2, FileText, Wand2, Sparkles, Flower, Gift, CameraIcon as CameraIconLucide, Building, LayoutGrid, Maximize, Move, PackageSearch, Sofa, Lightbulb, Flower2, Droplets, Music2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Copy, LayoutDashboard, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import type { ColorPalette, DecoracionData, DecorationItem, ZonaContratada, LayoutElement } from '@/types/fiesta';
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
  AlertDialogTrigger as AlertDialogConfirmTrigger,
} from "@/components/ui/alert-dialog";
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select';

// --- START: Logic from diseno-salon (merged here) ---
const predefinedElementsPalette: Omit<LayoutElement, 'id' | 'x' | 'y' | 'quantity'>[] = [
  { name: 'Mesa Redonda (8 pax)', imageUrl: 'https://placehold.co/80x80/E0E0E0/B0B0B0.png?text=Mesa', width: 80, height: 80, rotation: 0, type: 'predefined', category: 'Mobiliario', dataAiHint: 'round table' },
  { name: 'Mesa Rectangular (6 pax)', imageUrl: 'https://placehold.co/120x60/E0E0E0/B0B0B0.png?text=Mesa+L', width: 120, height: 60, rotation: 0, type: 'predefined', category: 'Mobiliario', dataAiHint: 'rectangle table' },
  { name: 'Silla', imageUrl: 'https://placehold.co/30x30/F0F0F0/C0C0C0.png?text=S', width: 30, height: 30, rotation: 0, type: 'predefined', category: 'Mobiliario', dataAiHint: 'chair' },
  { name: 'Pista de Baile (Pequeña)', imageUrl: 'https://placehold.co/150x150/D0D0D0/A0A0A0.png?text=Pista', width: 150, height: 150, rotation: 0, type: 'predefined', category: 'Zona', dataAiHint: 'dance floor' },
  { name: 'Pista de Baile (Grande)', imageUrl: 'https://placehold.co/250x250/D0D0D0/A0A0A0.png?text=Pista+G', width: 250, height: 250, rotation: 0, type: 'predefined', category: 'Zona', dataAiHint: 'large dance floor' },
  { name: 'Barra de Bebidas', imageUrl: 'https://placehold.co/100x40/C8C8C8/989898.png?text=Bar', width: 100, height: 40, rotation: 0, type: 'predefined', category: 'Equipamiento', dataAiHint: 'bar counter' },
  { name: 'Escenario (Pequeño)', imageUrl: 'https://placehold.co/120x80/BDBDBD/8D8D8D.png?text=Escenario', width: 120, height: 80, rotation: 0, type: 'predefined', category: 'Equipamiento', dataAiHint: 'small stage' },
  { name: 'DJ Booth', imageUrl: 'https://placehold.co/70x50/BDBDBD/8D8D8D.png?text=DJ', width: 70, height: 50, rotation: 0, type: 'predefined', category: 'Equipamiento', dataAiHint: 'DJ booth' },
  { name: 'Planta Decorativa Grande', imageUrl: 'https://placehold.co/60x60/A9A9A9/797979.png?text=Planta+G', width: 60, height: 60, rotation: 0, type: 'predefined', category: 'Decoración', dataAiHint: 'large plant' },
  { name: 'Arco Floral', imageUrl: 'https://placehold.co/80x120/A9A9A9/797979.png?text=Arco+Floral', width: 80, height: 120, rotation: 0, type: 'predefined', category: 'Decoración Floral', dataAiHint: 'floral arch' },
];

const groupedPaletteItems = predefinedElementsPalette.reduce((acc, item) => {
  const category = item.category || 'Otro';
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(item);
  return acc;
}, {} as Record<string, Omit<LayoutElement, 'id' | 'x' | 'y' | 'quantity'>[]>);

const uniqueCategoriesLayout = Object.keys(groupedPaletteItems).sort();
const GRID_SNAP_SIZE = 10;
// --- END: Logic from diseno-salon ---

export default function DecoracionYDisenoEventoPage() {
  const { toast } = useToast();
  const [decoracionData, setDecoracionData] = useState<DecoracionData>(JSON.parse(JSON.stringify(defaultDecoracion)));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<DecorationItem> | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const [isLayoutElementModalOpen, setIsLayoutElementModalOpen] = useState(false);
  const [currentLayoutElement, setCurrentLayoutElement] = useState<Partial<LayoutElement> & { tempId?: string } | null>(null);
  const [selectedLayoutElementId, setSelectedLayoutElementId] = useState<string | null>(null);

  const [failedMoodboardUrl, setFailedMoodboardUrl] = useState(false);
  const [failedTortaImageUrl, setFailedTortaImageUrl] = useState(false);
  const [failedItemImageUrls, setFailedItemImageUrls] = useState<Set<string>>(new Set());
  const [failedZonaImageUrls, setFailedZonaImageUrls] = useState<Set<string>>(new Set());
  const [failedSalonPlanBgUrl, setFailedSalonPlanBgUrl] = useState(false);
  const [failedLayoutElementImageUrls, setFailedLayoutElementImageUrls] = useState<Set<string>>(new Set());
  const [failedModalLayoutElementImageUrl, setFailedModalLayoutElementImageUrl] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuTargetId, setContextMenuTargetId] = useState<string | null>(null);
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null);

  const loadDecoracionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFailedMoodboardUrl(false);
    setFailedTortaImageUrl(false);
    setFailedItemImageUrls(new Set());
    setFailedZonaImageUrls(new Set());
    setFailedSalonPlanBgUrl(false);
    setFailedLayoutElementImageUrls(new Set());

    try {
      const fiestaData = await getFiestaActual();
      const currentDecoracion = fiestaData.decoracion || {};

      const mergedZonas = defaultZonasContratadas.map(defaultZona => {
        const savedZona = currentDecoracion.zonasContratadas?.find(sz => sz.id === defaultZona.id);
        return savedZona ? { ...defaultZona, ...savedZona } : { ...defaultZona };
      });

      setDecoracionData({
        ...defaultDecoracion,
        ...currentDecoracion,
        paletaColores: currentDecoracion.paletaColores || { ...defaultColorPalette },
        items: (currentDecoracion.items || []).map(item => ({
          ...item,
          quantity: item.quantity || 1,
          estimatedCost: Number(item.estimatedCost) || undefined
        })),
        zonasContratadas: mergedZonas,
        decoracionTorta: currentDecoracion.decoracionTorta || { ...defaultDecoracion.decoracionTorta },
        generalNotesDecoracion: currentDecoracion.generalNotesDecoracion === undefined ? defaultDecoracion.generalNotesDecoracion : currentDecoracion.generalNotesDecoracion,
        colorGlobos: currentDecoracion.colorGlobos || defaultDecoracion.colorGlobos,
        salonPlanBackgroundImageUrl: currentDecoracion.salonPlanBackgroundImageUrl || defaultDecoracion.salonPlanBackgroundImageUrl,
        salonElements: (currentDecoracion.salonElements || []).map(el => ({
            id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
            name: el.name || 'Elemento sin nombre',
            quantity: el.quantity === undefined ? 1 : (Number(el.quantity) || 1),
            notes: el.notes || undefined,
            imageUrl: el.imageUrl || undefined,
            x: el.x ?? 0,
            y: el.y ?? 0,
            width: el.width ?? 50,
            height: el.height ?? 50,
            rotation: el.rotation ?? 0,
            type: el.type ?? 'custom',
            category: el.category || 'Otro',
            dataAiHint: el.dataAiHint,
        })),
        generalNotesSalonLayout: currentDecoracion.generalNotesSalonLayout === undefined ? defaultDecoracion.generalNotesSalonLayout : currentDecoracion.generalNotesSalonLayout,
      });
    } catch (err: any) {
      console.error("Error loading decoration and layout data:", err);
      setError("No se pudo cargar la configuración de decoración y diseño del salón.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDecoracionData();
  }, [loadDecoracionData]);

  useEffect(() => {
    const handleClickOutsideContextMenu = (event: MouseEvent) => {
      if (contextMenuOpen) {
        setContextMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutsideContextMenu);
    return () => document.removeEventListener('click', handleClickOutsideContextMenu);
  }, [contextMenuOpen]);

  const handleGeneralDecorChange = (field: keyof Omit<DecoracionData, 'items' | 'paletaColores' | 'decoracionTorta' | 'zonasContratadas' | 'salonElements' | 'salonPlanBackgroundImageUrl' | 'generalNotesSalonLayout'>, value: string) => {
    if (field === 'moodboardImageUrl') setFailedMoodboardUrl(false);
    setDecoracionData(prev => ({ ...prev, [field]: value }));
  };

  const handleColorChange = (colorName: keyof ColorPalette, value: string) => {
    setDecoracionData(prev => ({
      ...prev,
      paletaColores: { ...(prev.paletaColores || defaultColorPalette), [colorName]: value },
    }));
  };

  const handleDecoracionTortaChange = (field: keyof NonNullable<DecoracionData['decoracionTorta']>, value: string) => {
     if (field === 'imageUrl') setFailedTortaImageUrl(false);
    setDecoracionData(prev => ({
      ...prev,
      decoracionTorta: { ...(prev.decoracionTorta || { descripcion: '', imageUrl: '', dataAiHint: '' }), [field]: value },
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

  const openLayoutElementFormModal = (element?: LayoutElement) => {
    if (element) {
      setCurrentLayoutElement({ ...element });
      setSelectedLayoutElementId(element.id);
    } else {
      setCurrentLayoutElement({
        name: '', quantity: 1, type: 'custom',
        x: Math.round(50 / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
        y: Math.round(50 / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
        width: 100, height: 50, rotation: 0,
        imageUrl: '', notes: '', category: 'Otro'
      });
      setSelectedLayoutElementId(null);
    }
    setFailedModalLayoutElementImageUrl(false);
    setIsLayoutElementModalOpen(true);
  };

  const addFromPalette = (paletteItem: Omit<LayoutElement, 'id' | 'x' | 'y' | 'quantity'>) => {
     setCurrentLayoutElement({
        name: paletteItem.name, quantity: 1, type: 'predefined',
        x: Math.round((Math.random() * 200 + 50)/GRID_SNAP_SIZE)*GRID_SNAP_SIZE,
        y: Math.round((Math.random() * 200 + 50)/GRID_SNAP_SIZE)*GRID_SNAP_SIZE,
        width: paletteItem.width || 50, height: paletteItem.height || 50,
        rotation: paletteItem.rotation || 0, imageUrl: paletteItem.imageUrl,
        notes: '', category: paletteItem.category || 'Otro', dataAiHint: paletteItem.dataAiHint
     });
     setSelectedLayoutElementId(null);
     setFailedModalLayoutElementImageUrl(false);
     setIsLayoutElementModalOpen(true);
  };

  const handleLayoutElementFieldChange = (field: keyof Omit<LayoutElement, 'id'>, rawValue: string | undefined | number) => {
    setCurrentLayoutElement(prevModalElement => {
      if (!prevModalElement) return null;
      let processedValue: string | number | undefined = rawValue;
      if (['x', 'y', 'width', 'height', 'rotation', 'quantity'].includes(field)) {
        const numVal = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue || '');
        processedValue = isNaN(numVal) ? (field === 'quantity' ? 1 : 0) : numVal;
        if (field === 'quantity' && (processedValue as number) < 1) processedValue = 1;
      }
      if (field === 'imageUrl') setFailedModalLayoutElementImageUrl(false);

      const updatedModalElement = { ...prevModalElement, [field]: processedValue } as Partial<LayoutElement>;

      if (prevModalElement.id && (decoracionData.salonElements || []).find(el => el.id === prevModalElement.id)) {
        setDecoracionData(prevDecorData => ({
          ...prevDecorData,
          salonElements: (prevDecorData.salonElements || []).map(el =>
            el.id === prevModalElement.id ? { ...el, ...updatedModalElement } as LayoutElement : el
          ),
        }));
      }
      return updatedModalElement;
    });
  };

  const handleLayoutElementFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentLayoutElement || !currentLayoutElement.name?.trim()) {
      toast({ title: "Datos Inválidos", description: "El nombre del elemento del salón no puede estar vacío.", variant: "destructive" });
      return;
    }
    const isEditing = !!currentLayoutElement.id && (decoracionData.salonElements || []).find(el => el.id === currentLayoutElement.id);
    if (isEditing) {
      toast({ title: "Elemento Actualizado", description: `${currentLayoutElement.name || 'El elemento'} ha sido actualizado.` });
    } else {
      const newElementData: LayoutElement = {
        id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: currentLayoutElement.name.trim(),
        quantity: Number(currentLayoutElement.quantity) || 1,
        x: Math.round(Number(currentLayoutElement.x || 0) / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
        y: Math.round(Number(currentLayoutElement.y || 0) / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
        width: Number(currentLayoutElement.width) || 50,
        height: Number(currentLayoutElement.height) || 50,
        rotation: Number(currentLayoutElement.rotation) || 0,
        imageUrl: currentLayoutElement.imageUrl?.trim() || undefined,
        notes: currentLayoutElement.notes?.trim() || undefined,
        type: currentLayoutElement.type || 'custom',
        category: currentLayoutElement.category?.trim() || 'Otro',
        dataAiHint: currentLayoutElement.dataAiHint?.trim() || undefined,
      };
      setDecoracionData(prev => ({ ...prev, salonElements: [...(prev.salonElements || []), newElementData] }));
      toast({ title: "Elemento Añadido al Plano", description: `${newElementData.name} añadido al diseño.` });
    }
    setIsLayoutElementModalOpen(false);
    setCurrentLayoutElement(null);
    setSelectedLayoutElementId(null);
  };

  const handleRemoveLayoutElement = (elementId?: string) => {
    const idToRemove = elementId || contextMenuTargetId;
    if (!idToRemove) return;
    setDecoracionData(prev => ({
      ...prev,
      salonElements: (prev.salonElements || []).filter(el => el.id !== idToRemove),
    }));
    toast({ title: "Elemento del Plano Eliminado", variant: "destructive" });
    setContextMenuOpen(false);
  };

  const handleDragStop = (e: DraggableEvent, data: DraggableData, elementId: string) => {
    setDecoracionData(prev => ({
      ...prev,
      salonElements: (prev.salonElements || []).map(el =>
        el.id === elementId ? { ...el, x: Math.round(data.x), y: Math.round(data.y) } : el
      ),
    }));
  };

  const handleDuplicateLayoutElement = (elementId?: string) => {
    const idToDuplicate = elementId || contextMenuTargetId;
    if(!idToDuplicate) return;
    const elementToDuplicate = (decoracionData.salonElements || []).find(el => el.id === idToDuplicate);
    if (elementToDuplicate) {
      const duplicatedElement: LayoutElement = {
        ...JSON.parse(JSON.stringify(elementToDuplicate)),
        id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        x: Math.round(((elementToDuplicate.x || 0) + GRID_SNAP_SIZE * 2) / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
        y: Math.round(((elementToDuplicate.y || 0) + GRID_SNAP_SIZE * 2) / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
      };
      setDecoracionData(prev => ({
        ...prev,
        salonElements: [...(prev.salonElements || []), duplicatedElement],
      }));
      toast({ title: "Elemento del Plano Duplicado", description: `${duplicatedElement.name} ha sido duplicado.` });
    }
    setContextMenuOpen(false);
  };

  const moveLayoutElement = (elementId: string | null, direction: 'up' | 'down' | 'front' | 'back') => {
    const idToMove = elementId || contextMenuTargetId;
    if(!idToMove) return;
    setDecoracionData(prev => {
      const elements = [...(prev.salonElements || [])];
      const index = elements.findIndex(el => el.id === idToMove);
      if (index === -1) return prev;
      const item = elements.splice(index, 1)[0];
      switch (direction) {
        case 'up': if (index < elements.length) elements.splice(index + 1, 0, item); else elements.push(item); break;
        case 'down': if (index > 0) elements.splice(index - 1, 0, item); else elements.unshift(item); break;
        case 'front': elements.push(item); break;
        case 'back': elements.unshift(item); break;
      }
      return { ...prev, salonElements: elements };
    });
    setContextMenuOpen(false);
  };

  const handleContextMenu = (event: React.MouseEvent, elementId: string) => {
    event.preventDefault();
    setContextMenuTargetId(elementId);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setTimeout(() => {
      setContextMenuOpen(true);
       if (contextMenuTriggerRef.current) {
        contextMenuTriggerRef.current.style.left = `${event.clientX}px`;
        contextMenuTriggerRef.current.style.top = `${event.clientY}px`;
      }
    }, 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanZonas = (decoracionData.zonasContratadas || []).map(zona =>
          zona.activada ? zona : { ...zona, descripcion: '', imagenReferenciaUrl: '', dataAiHint: '' }
      );
      const dataToSave: DecoracionData = {
        ...decoracionData,
        zonasContratadas: cleanZonas,
        salonElements: (decoracionData.salonElements || []).map(el => ({
          ...el,
          quantity: Number(el.quantity) || 1,
          x: Math.round(Number(el.x || 0)),
          y: Math.round(Number(el.y || 0)),
          width: Number(el.width) || 50,
          height: Number(el.height) || 50,
          rotation: Number(el.rotation) || 0,
        })),
      };

      const result = await updateDecoracionFiestaActual(dataToSave);
      if (result.success && result.updatedData) {
        toast({ title: "¡Decoración y Diseño Guardados!", description: "Los detalles se han guardado."});
        await loadDecoracionData();
      } else {
        throw new Error(result.error || "Error desconocido al guardar.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const targetLayoutElementForContextMenu = contextMenuTargetId ? (decoracionData.salonElements || []).find(el => el.id === contextMenuTargetId) : null;

  const canvasGridStyle: CSSProperties = !decoracionData.salonPlanBackgroundImageUrl ? {
    backgroundImage: `linear-gradient(to right, hsl(var(--border)/0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/0.4) 1px, transparent 1px)`,
    backgroundSize: `${GRID_SNAP_SIZE*2}px ${GRID_SNAP_SIZE*2}px, ${GRID_SNAP_SIZE*2}px ${GRID_SNAP_SIZE*2}px`,
  } : {};

  const getPaletteIcon = (category?: string): React.ReactElement => {
    switch (category) {
        case 'Mobiliario': return <Sofa className="w-4 h-4 mr-2 text-primary/80" />;
        case 'Iluminación': return <Lightbulb className="w-4 h-4 mr-2 text-primary/80" />;
        case 'Decoración Floral': return <Flower2 className="w-4 h-4 mr-2 text-primary/80" />;
        case 'Decoración': return <PackageSearch className="w-4 h-4 mr-2 text-primary/80" />;
        case 'Estructuras': return <LayoutGrid className="w-4 h-4 mr-2 text-primary/80" />;
        case 'Zona': return <Maximize className="w-4 h-4 mr-2 text-primary/80" />;
        case 'Equipamiento': return <Music2 className="w-4 h-4 mr-2 text-primary/80" />;
        default: return <Wand2 className="w-4 h-4 mr-2 text-primary/80" />;
    }
  };


  if (isLoading) return ( <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando datos...</p></div>);
  if (error) return ( <div className="flex flex-col items-center justify-center min-h-[400px] text-center"><AlertTriangle className="w-12 h-12 text-destructive mb-4" /><h2 className="text-xl font-semibold mb-2">Error</h2><p className="text-muted-foreground">{error}</p><Button onClick={loadDecoracionData} className="mt-4">Reintentar</Button></div>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Palette className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">🎨 Decoración y Diseño del Evento</h1></div>
        <div className="flex gap-2">
            <Link href="/fiestas/nueva/decoracion/pdf" passHref><Button variant="outline" disabled={isSaving}><FileText className="w-4 h-4 mr-2"/>Ver PDF</Button></Link>
            <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Accordion type="multiple" defaultValue={['general', 'disenoSalon', 'zonas', 'elementos']} className="w-full space-y-3">
          {/* Decoración General */}
          <AccordionItem value="general" className="border rounded-lg shadow-md bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary/80"/>Decoración General</div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0 pb-3 space-y-6">
              <div className="space-y-2 mt-2"><Label htmlFor="tema-evento">Tema del Evento</Label><Input id="tema-evento" value={decoracionData.tema || ''} onChange={(e) => handleGeneralDecorChange('tema', e.target.value)} placeholder="Ej: Fiesta Tropical" disabled={isSaving}/></div>
              <div className="space-y-3"><Label>Paleta de Colores Principal</Label><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{([['primary', 'Primario'], ['secondary', 'Secundario'], ['accent', 'Acento']] as [keyof ColorPalette, string][]).map(([key, label]) => (<div key={key} className="space-y-1"><Label htmlFor={`color-${key}`} className="text-xs">{label}</Label><div className="flex items-center gap-2"><Input id={`color-${key}`} type="color" value={decoracionData.paletaColores?.[key] || '#FFFFFF'} onChange={(e) => handleColorChange(key, e.target.value)} className="w-10 h-9 p-0.5" disabled={isSaving}/><Input type="text" value={decoracionData.paletaColores?.[key] || '#FFFFFF'} onChange={(e) => handleColorChange(key, e.target.value)} className="text-xs p-1.5 h-9" placeholder="#RRGGBB" disabled={isSaving}/></div></div>))}</div></div>
              <div className="space-y-2"><Label htmlFor="moodboard-url">Imagen de Portada / Moodboard (URL)</Label><Input id="moodboard-url" type="url" value={decoracionData.moodboardImageUrl || ''} onChange={(e) => handleGeneralDecorChange('moodboardImageUrl', e.target.value)} placeholder="https://ejemplo.com/moodboard.jpg" disabled={isSaving}/><p className="text-xs text-muted-foreground">Pega el enlace directo a tu imagen de inspiración.</p>{decoracionData.moodboardImageUrl && !failedMoodboardUrl ? (<div className="mt-2 p-1 border rounded inline-block"><NextImage src={decoracionData.moodboardImageUrl} alt="Moodboard" width={150} height={100} className="rounded object-contain max-h-[100px]" data-ai-hint="event moodboard" onError={() => setFailedMoodboardUrl(true)}/></div>) : (<div className="mt-2 p-3 border-dashed rounded flex items-center justify-center text-xs text-muted-foreground h-[80px] bg-muted/50"><ImageIconLucide className="w-6 h-6 mr-1.5"/><p>{decoracionData.moodboardImageUrl && failedMoodboardUrl ? 'Error al cargar.' : 'Sin portada.'}</p></div>)}</div>
              <div className="space-y-2"><Label htmlFor="color-cubremantel">Color Cubremantel</Label><Input id="color-cubremantel" value={decoracionData.colorCubremantel || ''} onChange={(e) => handleGeneralDecorChange('colorCubremantel', e.target.value)} placeholder="Ej: Blanco Hueso" disabled={isSaving}/></div>
              <div className="space-y-2"><Label htmlFor="color-globos">Color de Globos</Label><Input id="color-globos" value={decoracionData.colorGlobos || ''} onChange={(e) => handleGeneralDecorChange('colorGlobos', e.target.value)} placeholder="Ej: Dorado y Rosa Pastel" disabled={isSaving}/></div>
              <div className="space-y-2"><Label htmlFor="torta-descripcion">Descripción Decoración Torta</Label><Textarea id="torta-descripcion" value={decoracionData.decoracionTorta?.descripcion || ''} onChange={(e) => handleDecoracionTortaChange('descripcion', e.target.value)} placeholder="Ej: Torta rústica con flores." rows={2} disabled={isSaving}/></div>
              <div className="space-y-2"><Label htmlFor="torta-imagen-url">Imagen Referencial Torta (URL)</Label><Input id="torta-imagen-url" type="url" value={decoracionData.decoracionTorta?.imageUrl || ''} onChange={(e) => handleDecoracionTortaChange('imageUrl', e.target.value)} placeholder="https://ejemplo.com/torta.jpg" disabled={isSaving}/>{decoracionData.decoracionTorta?.imageUrl && !failedTortaImageUrl ? (<div className="mt-1 p-1 border rounded inline-block"><NextImage src={decoracionData.decoracionTorta.imageUrl} alt="Torta" width={80} height={80} className="rounded object-contain max-h-[80px]" data-ai-hint={decoracionData.decoracionTorta.dataAiHint || "cake design"} onError={() => setFailedTortaImageUrl(true)}/></div>) : (decoracionData.decoracionTorta?.imageUrl && failedTortaImageUrl && <p className="text-xs text-destructive">Error.</p>)}</div>
              <div className="space-y-2"><Label htmlFor="torta-aihint">AI Hint Torta (PDF)</Label><Input id="torta-aihint" value={decoracionData.decoracionTorta?.dataAiHint || ''} onChange={(e) => handleDecoracionTortaChange('dataAiHint', e.target.value)} placeholder="wedding cake rustic flowers" disabled={isSaving}/></div>
              <div className="space-y-2"><Label htmlFor="general-notes-decoracion">Notas Generales de Decoración</Label><Textarea id="general-notes-decoracion" value={decoracionData.generalNotesDecoracion || ''} onChange={(e) => handleGeneralDecorChange('generalNotesDecoracion', e.target.value)} rows={3} disabled={isSaving} placeholder="Ideas, inspiración, etc."/></div>
              <div className="space-y-2"><Label htmlFor="pdf-notas-adicionales">Notas Adicionales (PDF)</Label><Textarea id="pdf-notas-adicionales" value={decoracionData.pdfNotasAdicionales || ''} onChange={(e) => handleGeneralDecorChange('pdfNotasAdicionales', e.target.value)} placeholder="Aclaraciones para el cliente en el PDF." rows={2} disabled={isSaving}/></div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="disenoSalon" className="border rounded-lg shadow-md bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-primary/80"/>Diseño del Salón y Disposición</div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0 pb-3 space-y-6">
              <div className="space-y-2 mt-2">
                <Label htmlFor="salon-plan-bg-url">URL de Imagen del Plano del Salón</Label>
                <Input id="salon-plan-bg-url" type="url" value={decoracionData.salonPlanBackgroundImageUrl || ''}
                       onChange={(e) => {
                           setDecoracionData(prev => ({...prev, salonPlanBackgroundImageUrl: e.target.value}));
                           setFailedSalonPlanBgUrl(false);
                       }}
                       placeholder="https://ejemplo.com/plano.jpg" disabled={isSaving}/>
                <p className="text-xs text-muted-foreground">Sube tu imagen a un servicio como Imgur y pega el enlace.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-1">
                  <CardHeader className="p-3"><CardTitle className="text-base font-medium flex items-center gap-1"><Wand2 className="w-4"/>Paleta de Elementos</CardTitle></CardHeader>
                  <CardContent className="p-2">
                    <ScrollArea className="h-[300px] pr-1"><Accordion type="multiple" className="w-full">{uniqueCategoriesLayout.map((category) => (<AccordionItem value={category} key={category}><AccordionTrigger className="text-xs py-1.5 px-1">{category} ({groupedPaletteItems[category]?.length || 0})</AccordionTrigger><AccordionContent className="pl-1 pr-0 pb-1"><div className="space-y-1">{groupedPaletteItems[category]?.map((item, idx) => (<Button key={`${category}-${idx}`} variant="outline" className="w-full justify-start h-auto py-1 px-1.5 text-left text-[10px]" onClick={() => addFromPalette(item)} disabled={isSaving} title={item.name}>{getPaletteIcon(item.category)}<span className="truncate">{item.name}</span></Button>))}</div></AccordionContent></AccordionItem>))}</Accordion></ScrollArea>
                    <Separator className="my-2"/>
                    <Button variant="default" size="sm" className="w-full mt-1" onClick={() => openLayoutElementFormModal()} disabled={isSaving}><PlusCircle className="w-3.5 h-3.5 mr-1.5" />Añadir Personalizado</Button>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader className="p-3"><CardTitle className="text-base font-medium flex items-center gap-1"><Maximize className="w-4"/>Lienzo del Salón</CardTitle></CardHeader>
                  <CardContent className="p-2">
                    <div ref={canvasRef} className={`relative w-full aspect-[16/9] border border-dashed rounded bg-muted/20 overflow-hidden select-none group ${!decoracionData.salonPlanBackgroundImageUrl ? 'canvas-grid-background' : ''}`}
                         style={{ backgroundImage: decoracionData.salonPlanBackgroundImageUrl && !failedSalonPlanBgUrl ? `url(${decoracionData.salonPlanBackgroundImageUrl})` : 'none', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', minHeight: '300px', ...canvasGridStyle }}
                         onClick={() => setContextMenuOpen(false)} onError={() => setFailedSalonPlanBgUrl(true)}>
                      {(!decoracionData.salonPlanBackgroundImageUrl || failedSalonPlanBgUrl) && (<div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-xs pointer-events-none"><ImageOff className="w-10 h-10 mb-1 opacity-50" /><p>{decoracionData.salonPlanBackgroundImageUrl && failedSalonPlanBgUrl ? 'Error al cargar plano.' : 'Sin plano de fondo.'}</p></div>)}
                      {(decoracionData.salonElements || []).map(el => (
                         <Draggable key={el.id} axis="both" handle=".handle" position={{ x: el.x ?? 0, y: el.y ?? 0 }} grid={[GRID_SNAP_SIZE, GRID_SNAP_SIZE]} scale={1} bounds="parent" onStop={(e, data) => handleDragStop(e, data, el.id)}>
                            <div title={`${el.name} (x:${el.x}, y:${el.y})`}
                                 className={`absolute border cursor-grab active:cursor-grabbing flex items-center justify-center text-[9px] p-0.5 rounded-sm handle transition-all duration-150 ease-in-out ${selectedLayoutElementId === el.id ? 'border-2 border-accent ring-2 ring-accent shadow-xl z-10' : 'border-primary/30 bg-primary/10 hover:border-primary hover:ring-1 hover:ring-primary/50 hover:shadow-md'}`}
                                 style={{ width: `${el.width || 50}px`, height: `${el.height || 50}px`, transform: `rotate(${el.rotation || 0}deg)`, color: 'hsl(var(--primary-foreground))', touchAction: 'none' }}
                                 onClick={(e) => { if ((e.target as HTMLElement).closest('.react-draggable-dragging') || (e.target as HTMLElement).classList.contains('handle-icon')) return; if (e.ctrlKey || e.metaKey) return; e.stopPropagation(); openLayoutElementFormModal(el); setContextMenuOpen(false);}}
                                 onContextMenu={(e) => handleContextMenu(e, el.id)}>
                               {el.imageUrl && !failedLayoutElementImageUrls.has(el.imageUrl) ? (<NextImage src={el.imageUrl} alt={el.name} layout="fill" objectFit="contain" className="rounded-sm pointer-events-none" data-ai-hint={el.dataAiHint || "object floor element"} onError={() => setFailedLayoutElementImageUrls(prev => new Set(prev).add(el.imageUrl!))}/>
                               ) : (<div className={`w-full h-full flex flex-col items-center justify-center ${failedLayoutElementImageUrls.has(el.imageUrl!) ? 'bg-destructive/10' : 'bg-primary/20'} pointer-events-none text-center p-0.5`}>{(failedLayoutElementImageUrls.has(el.imageUrl!) || !el.imageUrl) && <ImageOff className={`w-3 h-3 mb-0.5 ${failedLayoutElementImageUrls.has(el.imageUrl!) ? 'text-destructive' : 'text-primary-foreground/70'}`}/><span className="truncate text-[7px] font-medium text-primary-foreground leading-tight">{el.name}</span><span className="text-[6px] text-primary-foreground/80 leading-tight">({el.width}x{el.height})</span></div>)}
                               <Move className="handle-icon absolute top-0 right-0 w-2.5 h-2.5 text-primary-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab p-0.5 bg-black/20 rounded-bl-sm"/>
                            </div>
                          </Draggable>
                      ))}
                      <div ref={contextMenuTriggerRef} style={{ position: 'fixed', zIndex: 1000 }} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="general-notes-salon" className="text-base">Notas Generales de Disposición del Salón</Label>
                <Textarea id="general-notes-salon" value={decoracionData.generalNotesSalonLayout || ''} onChange={(e) => setDecoracionData(prev => ({...prev, generalNotesSalonLayout: e.target.value}))} rows={2} disabled={isSaving} placeholder="Puntos de acceso, flujo de invitados, etc."/>
              </div>
              <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Elementos en el Diseño ({ (decoracionData.salonElements || []).length})</h4>
                  {(decoracionData.salonElements || []).length > 0 ? (<ScrollArea className="h-[150px] pr-2 border rounded-md p-2 bg-muted/20"><ul className="space-y-1.5">{(decoracionData.salonElements || []).map((el, index) => (<li key={el.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-1.5 border rounded bg-card text-xs"><div className="flex items-center gap-1.5 flex-grow mb-1 sm:mb-0">{el.imageUrl && !failedLayoutElementImageUrls.has(el.imageUrl) ? <NextImage src={el.imageUrl} alt={el.name} width={16} height={16} className="rounded-sm object-contain border" data-ai-hint={el.dataAiHint || "icon element"} onError={() => setFailedLayoutElementImageUrls(prev => new Set(prev).add(el.imageUrl!))}/> : (el.imageUrl && failedLayoutElementImageUrls.has(el.imageUrl)) ? <ImageOff className="w-4 h-4 text-destructive"/> : getPaletteIcon(el.category)}<div><p className="font-medium text-xs">{el.name}</p><p className="text-[10px] text-muted-foreground">X:{el.x},Y:{el.y}|{el.width}x{el.height}|{el.rotation}°</p></div></div><div className="flex gap-1 self-start sm:self-center"><Button type="button" variant="ghost" size="icon" onClick={() => openLayoutElementFormModal(el)} className="h-6 w-6"><Edit3 className="w-3"/></Button><Button type="button" variant="ghost" size="icon" onClick={() => handleDuplicateLayoutElement(el.id)} className="h-6 w-6"><Copy className="w-3"/></Button><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLayoutElement(el.id)} className="h-6 w-6 text-destructive"><Trash2 className="w-3"/></Button></div></li>))}</ul></ScrollArea>) : (<p className="text-center text-xs text-muted-foreground py-2">No hay elementos en el plano.</p>)}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="zonas" className="border rounded-lg shadow-md bg-card">
             <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-primary/80"/>Zonas Decorativas Específicas</div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0 pb-3 space-y-4">
                <p className="text-sm text-muted-foreground mt-2">Activa y detalla las zonas que tendrán una decoración particular.</p>
                {(decoracionData.zonasContratadas || []).map(zona => (
                    <Card key={zona.id} className="bg-muted/30 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <Label htmlFor={`zona-check-${zona.id}`} className="text-md font-medium flex items-center gap-2 cursor-pointer"><Checkbox id={`zona-check-${zona.id}`} checked={zona.activada} onCheckedChange={() => toggleZonaActivada(zona.id)} disabled={isSaving} className="w-5 h-5"/>{zona.nombreDisplay}</Label>
                        </div>
                        {zona.activada && (<div className="space-y-3 pl-6 border-l-2 border-primary/30 ml-2"><div className="space-y-1"><Label htmlFor={`zona-desc-${zona.id}`} className="text-xs">Descripción</Label><Textarea id={`zona-desc-${zona.id}`} value={zona.descripcion || ''} onChange={(e) => handleZonaChange(zona.id, 'descripcion', e.target.value)} rows={2} placeholder={`Detalles para ${zona.nombreDisplay}...`} disabled={isSaving} /></div><div className="space-y-1"><Label htmlFor={`zona-img-${zona.id}`} className="text-xs">URL Imagen</Label><Input id={`zona-img-${zona.id}`} type="url" value={zona.imagenReferenciaUrl || ''} onChange={(e) => handleZonaChange(zona.id, 'imagenReferenciaUrl', e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" disabled={isSaving} />{zona.imagenReferenciaUrl && !failedZonaImageUrls.has(zona.imagenReferenciaUrl) && (<div className="mt-1 p-1 border rounded inline-block"><NextImage src={zona.imagenReferenciaUrl} alt={zona.nombreDisplay} width={100} height={75} className="rounded object-contain max-h-[75px]" data-ai-hint={zona.dataAiHint || "event zone example"} onError={() => setFailedZonaImageUrls(prev => new Set(prev).add(zona.imagenReferenciaUrl!))}/></div>)}{zona.imagenReferenciaUrl && failedZonaImageUrls.has(zona.imagenReferenciaUrl) && <p className="text-xs text-destructive mt-1">Error.</p>}</div><div className="space-y-1"><Label htmlFor={`zona-aihint-${zona.id}`} className="text-xs">AI Hint (PDF)</Label><Input id={`zona-aihint-${zona.id}`} value={zona.dataAiHint || ''} onChange={(e) => handleZonaChange(zona.id, 'dataAiHint', e.target.value)} placeholder="wedding arch flowers" disabled={isSaving} /></div></div>)}
                    </Card>
                ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="elementos" className="border rounded-lg shadow-md bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-headline text-primary hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary/80"/>Otros Elementos Decorativos</div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0 pb-3 space-y-3">
                <div className="flex justify-end mt-2"><Button type="button" onClick={() => openItemModal()} disabled={isSaving} size="sm"><PlusCircle className="w-4 h-4 mr-2" />Añadir Elemento</Button></div>
                {(decoracionData.items?.length || 0) > 0 ? (<ScrollArea className="h-auto max-h-[300px] pr-2"><div className="space-y-2">{decoracionData.items?.map(item => (<Card key={item.id} className="bg-muted/40 p-2"><div className="flex justify-between items-start gap-1"><div className="flex-grow"><h4 className="font-semibold text-sm">{item.name} ({item.quantity || 1}x)</h4>{item.category && <p className="text-xs text-muted-foreground">Cat: {item.category}</p>}{item.estimatedCost !== undefined && <p className="text-xs">Costo: ${item.estimatedCost.toFixed(2)}</p>}{item.notes && <p className="text-xs italic">Notas: {item.notes}</p>}</div><div className="flex gap-1 flex-shrink-0"><Button type="button" variant="ghost" size="icon" onClick={() => openItemModal(item)} className="h-6 w-6"><Edit3 className="w-3 h-3" /></Button><AlertDialogConfirm open={deletingItemId === item.id} onOpenChange={(open) => !open && setDeletingItemId(null)}><AlertDialogConfirmTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => setDeletingItemId(item.id)} className="h-6 w-6 text-destructive"><Trash2 className="w-3 h-3" /></Button></AlertDialogConfirmTrigger><AlertDialogContentConfirm><AlertDialogHeaderConfirm><AlertDialogTitleConfirm>Eliminar</AlertDialogTitleConfirm><AlertDialogDescriptionConfirm>¿Eliminar "{item.name}"?</AlertDialogDescriptionConfirm></AlertDialogHeaderConfirm><AlertDialogFooterConfirm><AlertDialogCancel>No</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive">Sí</AlertDialogAction></AlertDialogFooterConfirm></AlertDialogContentConfirm></AlertDialogConfirm></div></div></Card>))}</div></ScrollArea>) : (<p className="text-center text-sm text-muted-foreground py-3">No hay elementos específicos.</p>)}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <CardFooter className="border-t pt-6 mt-6"><Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}{isSaving ? 'Guardando...' : 'Guardar Decoración y Diseño'}</Button></CardFooter>
      </form>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-headline text-lg">{currentItem?.id ? 'Editar' : 'Añadir'} Elemento Decorativo</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1"><Label htmlFor="item-name">Nombre*</Label><Input id="item-name" value={currentItem?.name || ''} onChange={(e) => handleItemFormChange('name', e.target.value)} required /></div>
            <div className="space-y-1"><Label htmlFor="item-category">Categoría</Label><Input id="item-category" placeholder="Ej: Centro de Mesa" value={currentItem?.category || ''} onChange={(e) => handleItemFormChange('category', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="item-quantity">Cantidad</Label><Input id="item-quantity" type="number" value={currentItem?.quantity ?? 1} onChange={(e) => handleItemFormChange('quantity', Number(e.target.value))} min="1" /></div><div className="space-y-1"><Label htmlFor="item-cost">Costo Est. (Total)</Label><Input id="item-cost" type="number" value={currentItem?.estimatedCost === undefined ? '' : currentItem.estimatedCost} placeholder="0.00" onChange={(e) => handleItemFormChange('estimatedCost', e.target.value === '' ? undefined : parseFloat(e.target.value))} step="any" /></div></div>
            <div className="space-y-1"><Label htmlFor="item-supplier">Proveedor</Label><Input id="item-supplier" value={currentItem?.supplier || ''} onChange={(e) => handleItemFormChange('supplier', e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="item-imageUrl">URL Imagen</Label><Input id="item-imageUrl" type="url" value={currentItem?.imageUrl || ''} onChange={(e) => handleItemFormChange('imageUrl', e.target.value)} placeholder="https://..."/>{currentItem?.imageUrl && !failedItemImageUrls.has(currentItem.imageUrl) && <NextImage src={currentItem.imageUrl} alt="Preview" width={50} height={50} className="mt-1 border rounded object-contain" data-ai-hint={currentItem.dataAiHint || "decoration item"} onError={()=> setFailedItemImageUrls(prev => new Set(prev).add(currentItem!.imageUrl!))} />}</div>
            <div className="space-y-1"><Label htmlFor="item-aihint">AI Hint (PDF)</Label><Input id="item-aihint" value={currentItem?.dataAiHint || ''} onChange={(e) => handleItemFormChange('dataAiHint', e.target.value)} placeholder="floral arrangement pink"/></div>
            <div className="space-y-1"><Label htmlFor="item-notes">Notas</Label><Textarea id="item-notes" value={currentItem?.notes || ''} onChange={(e) => handleItemFormChange('notes', e.target.value)} rows={2} /></div>
            <DialogFooter className="pt-3"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">{currentItem?.id ? 'Guardar Cambios' : 'Añadir'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLayoutElementModalOpen} onOpenChange={(isOpen) => { setIsLayoutElementModalOpen(isOpen); if (!isOpen) setSelectedLayoutElementId(null); }}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-headline text-lg">{currentLayoutElement?.id ? 'Editar' : 'Añadir'} Elemento al Plano</DialogTitle></DialogHeader>
          <form onSubmit={handleLayoutElementFormSubmit} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1"><Label htmlFor="layout-el-name">Nombre*</Label><Input id="layout-el-name" value={currentLayoutElement?.name || ''} onChange={(e) => handleLayoutElementFieldChange('name', e.target.value)} required /></div>
            <div className="space-y-1"><Label htmlFor="layout-el-type">Tipo</Label><Select value={currentLayoutElement?.type || 'custom'} onValueChange={(val) => handleLayoutElementFieldChange('type', val)}><SelectTrigger id="layout-el-type"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="custom">Personalizado (URL)</SelectItem><SelectItem value="predefined">Predefinido (Paleta)</SelectItem></SelectContent></Select></div>
            {(currentLayoutElement?.type === 'custom' || (currentLayoutElement?.type === 'predefined' && !predefinedElementsPalette.find(p => p.name === currentLayoutElement.name)?.imageUrl) ) && (<div className="space-y-1"><Label htmlFor="layout-el-imageUrl">URL Imagen</Label><Input id="layout-el-imageUrl" type="url" placeholder="https://..." value={currentLayoutElement?.imageUrl || ''} onChange={(e) => handleLayoutElementFieldChange('imageUrl', e.target.value)} /></div>)}
            {currentLayoutElement?.imageUrl && (<div className="space-y-1 mt-2"><Label>Vista Previa:</Label>{failedModalLayoutElementImageUrl ? (<div className="p-2 border rounded flex items-center justify-center text-muted-foreground h-[70px] bg-destructive/10"><ImageOff className="w-6 h-6 mr-1 text-destructive" /><p className="text-xs">Error.</p></div>): (<NextImage src={currentLayoutElement.imageUrl} alt={currentLayoutElement.name || "Preview"} width={70} height={70} className="border rounded object-contain bg-muted/30" data-ai-hint={currentLayoutElement.dataAiHint || "element preview"} onError={() => setFailedModalLayoutElementImageUrl(true)}/>)}</div>)}
            {!currentLayoutElement?.imageUrl && currentLayoutElement?.type === 'custom' && (<div className="p-2 border rounded flex items-center justify-center text-muted-foreground h-[70px] bg-muted/30"><ImageIconLucide className="w-6 h-6 mr-1" /><p className="text-xs">URL para imagen.</p></div>)}
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="layout-el-x">X (px)</Label><Input id="layout-el-x" type="number" value={currentLayoutElement?.x ?? ''} onChange={(e) => handleLayoutElementFieldChange('x', e.target.value)} /></div><div className="space-y-1"><Label htmlFor="layout-el-y">Y (px)</Label><Input id="layout-el-y" type="number" value={currentLayoutElement?.y ?? ''} onChange={(e) => handleLayoutElementFieldChange('y', e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="layout-el-width">Ancho (px)</Label><Input id="layout-el-width" type="number" value={currentLayoutElement?.width ?? ''} onChange={(e) => handleLayoutElementFieldChange('width', e.target.value)} /></div><div className="space-y-1"><Label htmlFor="layout-el-height">Alto (px)</Label><Input id="layout-el-height" type="number" value={currentLayoutElement?.height ?? ''} onChange={(e) => handleLayoutElementFieldChange('height', e.target.value)} /></div></div>
            <div className="space-y-1"><Label htmlFor="layout-el-rotation">Rotación (°)</Label><Input id="layout-el-rotation" type="number" value={currentLayoutElement?.rotation ?? ''} onChange={(e) => handleLayoutElementFieldChange('rotation', e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="layout-el-category">Categoría</Label><Select value={currentLayoutElement?.category || 'Otro'} onValueChange={(value) => handleLayoutElementFieldChange('category', value)}><SelectTrigger id="layout-el-category"><SelectValue placeholder="Seleccionar"/></SelectTrigger><SelectContent>{uniqueCategoriesLayout.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1"><Label htmlFor="layout-el-dataAiHint">AI Hint (Imagen)</Label><Input id="layout-el-dataAiHint" value={currentLayoutElement?.dataAiHint || ''} onChange={(e) => handleLayoutElementFieldChange('dataAiHint', e.target.value)} placeholder="Ej: round table top view" /></div>
            <div className="space-y-1"><Label htmlFor="layout-el-quantity">Cantidad</Label><Input id="layout-el-quantity" type="number" value={currentLayoutElement?.quantity ?? 1} onChange={(e) => handleLayoutElementFieldChange('quantity', e.target.value)} min="1" /></div>
            <div className="space-y-1"><Label htmlFor="layout-el-notes">Notas</Label><Textarea id="layout-el-notes" value={currentLayoutElement?.notes || ''} onChange={(e) => handleLayoutElementFieldChange('notes', e.target.value)} rows={2} /></div>
            <DialogFooter className="pt-3"><DialogClose asChild><Button type="button" variant="outline" onClick={() => setSelectedLayoutElementId(null)}>Cancelar</Button></DialogClose><Button type="submit">{currentLayoutElement?.id ? 'Guardar Cambios' : 'Añadir'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
        <DropdownMenuTrigger ref={contextMenuTriggerRef} className="fixed opacity-0 pointer-events-none" />
         {targetLayoutElementForContextMenu && (
            <DropdownMenuContent className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuItem onClick={() => { openLayoutElementFormModal(targetLayoutElementForContextMenu); setContextMenuOpen(false); }}><Edit3 className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicateLayoutElement()}><Copy className="mr-2 h-4 w-4" /> Duplicar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => moveLayoutElement(null, 'front')}><ChevronsUp className="mr-2 h-4 w-4" /> Al Frente</DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveLayoutElement(null, 'up')}><ArrowUp className="mr-2 h-4 w-4" /> Adelante</DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveLayoutElement(null, 'down')}><ArrowDown className="mr-2 h-4 w-4" /> Atrás</DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveLayoutElement(null, 'back')}><ChevronsDown className="mr-2 h-4 w-4" /> Al Fondo</DropdownMenuItem>
                <DropdownMenuSeparator />
                 <AlertDialogConfirmTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></AlertDialogConfirmTrigger>
                    <AlertDialogContentConfirm><AlertDialogHeaderConfirm><AlertDialogTitleConfirm>Eliminar Elemento del Plano</AlertDialogTitleConfirm><AlertDialogDescriptionConfirm>¿Eliminar "{targetLayoutElementForContextMenu.name}"?</AlertDialogDescriptionConfirm></AlertDialogHeaderConfirm><AlertDialogFooterConfirm><AlertDialogCancel onClick={() => setContextMenuOpen(false)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveLayoutElement()} className="bg-destructive">Eliminar</AlertDialogAction></AlertDialogFooterConfirm></AlertDialogContentConfirm>
            </DropdownMenuContent>
         )}
      </DropdownMenu>
    </div>
  );
}
