
'use client';

import { useState, useEffect, useCallback, type FormEvent, type CSSProperties, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2, AlertTriangle, LayoutGrid, ImageOff, Edit3, Wand2, Maximize, Move, PackageSearch, Sofa, Lightbulb, Flower2, Droplets, Music2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SalonLayoutData, LayoutElement } from '@/types/fiesta';
import { getFiestaActual, updateSalonLayoutFiestaActual } from '@/app/actions/fiesta-actual';
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
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const predefinedElementsPalette: Omit<LayoutElement, 'id' | 'x' | 'y' | 'quantity'>[] = [
  { name: 'Mesa Redonda (8 pax)', imageUrl: 'https://placehold.co/80x80/E0E0E0/B0B0B0.png?text=Mesa', width: 80, height: 80, rotation: 0, type: 'predefined', category: 'Mobiliario' },
  { name: 'Mesa Rectangular (6 pax)', imageUrl: 'https://placehold.co/120x60/E0E0E0/B0B0B0.png?text=Mesa+L', width: 120, height: 60, rotation: 0, type: 'predefined', category: 'Mobiliario' },
  { name: 'Silla', imageUrl: 'https://placehold.co/30x30/F0F0F0/C0C0C0.png?text=S', width: 30, height: 30, rotation: 0, type: 'predefined', category: 'Mobiliario' },
  { name: 'Pista de Baile (Pequeña)', imageUrl: 'https://placehold.co/150x150/D0D0D0/A0A0A0.png?text=Pista', width: 150, height: 150, rotation: 0, type: 'predefined', category: 'Zona' },
  { name: 'Pista de Baile (Grande)', imageUrl: 'https://placehold.co/250x250/D0D0D0/A0A0A0.png?text=Pista+G', width: 250, height: 250, rotation: 0, type: 'predefined', category: 'Zona' },
  { name: 'Barra de Bebidas', imageUrl: 'https://placehold.co/100x40/C8C8C8/989898.png?text=Bar', width: 100, height: 40, rotation: 0, type: 'predefined', category: 'Equipamiento' },
  { name: 'Escenario (Pequeño)', imageUrl: 'https://placehold.co/120x80/BDBDBD/8D8D8D.png?text=Escenario', width: 120, height: 80, rotation: 0, type: 'predefined', category: 'Equipamiento' },
  { name: 'DJ Booth', imageUrl: 'https://placehold.co/70x50/BDBDBD/8D8D8D.png?text=DJ', width: 70, height: 50, rotation: 0, type: 'predefined', category: 'Equipamiento' },
  { name: 'Planta Decorativa Grande', imageUrl: 'https://placehold.co/60x60/A9A9A9/797979.png?text=Planta+G', width: 60, height: 60, rotation: 0, type: 'predefined', category: 'Decoración' },
  { name: 'Arco Floral', imageUrl: 'https://placehold.co/80x120/A9A9A9/797979.png?text=Arco+Floral', width: 80, height: 120, rotation: 0, type: 'predefined', category: 'Decoración Floral' },
  { name: 'Panel de Fondo (Backdrop)', imageUrl: 'https://placehold.co/150x100/BFBFBF/8F8F8F.png?text=Backdrop', width: 150, height: 100, rotation: 0, type: 'predefined', category: 'Estructuras' },
  { name: 'Mesa de Dulces/Torta', imageUrl: 'https://placehold.co/120x50/D1D1D1/A1A1A1.png?text=Mesa+Dulce', width: 120, height: 50, rotation: 0, type: 'predefined', category: 'Mobiliario' },
  { name: 'Letras Luminosas (LOVE)', imageUrl: 'https://placehold.co/160x60/EAEAEA/BABABA.png?text=LOVE', width: 160, height: 60, rotation: 0, type: 'predefined', category: 'Iluminación' },
  { name: 'Centro de Mesa Alto', imageUrl: 'https://placehold.co/30x50/C0C0C0/909090.png?text=CentroM', width: 30, height: 50, rotation: 0, type: 'predefined', category: 'Decoración Floral' },
  { name: 'Guirnalda de Luces', imageUrl: 'https://placehold.co/100x20/F5F5F5/C5C5C5.png?text=Luces', width: 100, height: 20, rotation: 0, type: 'predefined', category: 'Iluminación' },
  { name: 'Alfombra Roja', imageUrl: 'https://placehold.co/80x200/E0B0B0/B08080.png?text=Alfombra', width: 80, height: 200, rotation: 0, type: 'predefined', category: 'Decoración' },
  { name: 'Set de Sillones (Lounge)', imageUrl: 'https://placehold.co/140x70/DCDCDC/ADADAD.png?text=Lounge', width: 140, height: 70, rotation: 0, type: 'predefined', category: 'Mobiliario' },
  { name: 'Photocall / Fotocabina', imageUrl: 'https://placehold.co/100x120/C8C8C8/989898.png?text=Photocall', width: 100, height: 120, rotation: 0, type: 'predefined', category: 'Estructuras' },
  { name: 'Fuente de Agua Decorativa', imageUrl: 'https://placehold.co/70x70/ADD8E6/7DA8B6.png?text=Fuente', width: 70, height: 70, rotation: 0, type: 'predefined', category: 'Decoración' },
  { name: 'Parlante/Altavoz Grande', imageUrl: 'https://placehold.co/40x60/B0B0B0/808080.png?text=Audio', width: 40, height: 60, rotation: 0, type: 'predefined', category: 'Equipamiento' },
];

const uniqueCategories = Array.from(new Set(predefinedElementsPalette.map(el => el.category || 'Otro'))).sort();
if (!uniqueCategories.includes('Otro')) {
  uniqueCategories.push('Otro');
}


export default function DisenoSalonPage() {
  const { toast } = useToast();
  const [layoutData, setLayoutData] = useState<SalonLayoutData>({
    backgroundImageUrl: '',
    elements: [],
    generalNotes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentElement, setCurrentElement] = useState<Partial<LayoutElement> & { tempId?: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuTargetId, setContextMenuTargetId] = useState<string | null>(null);
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null);


  const loadLayoutData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaActual();
      if (fiestaData.salonLayout) {
        setLayoutData({
            backgroundImageUrl: fiestaData.salonLayout.backgroundImageUrl || '',
            elements: (fiestaData.salonLayout.elements || []).map(el => ({
                id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
                name: el.name || 'Elemento sin nombre',
                quantity: el.quantity === undefined ? 1 : el.quantity,
                notes: el.notes || undefined,
                imageUrl: el.imageUrl || undefined,
                x: el.x ?? 0,
                y: el.y ?? 0,
                width: el.width ?? 50,
                height: el.height ?? 50,
                rotation: el.rotation ?? 0,
                type: el.type ?? 'custom',
                category: el.category || 'Otro',
            })),
            generalNotes: fiestaData.salonLayout.generalNotes || ''
        });
      } else {
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
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuOpen) {
        setContextMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenuOpen]);


  const openFormModal = (element?: LayoutElement) => {
    if (element) {
      setCurrentElement({ ...element });
      setSelectedElementId(element.id);
    } else { 
      setCurrentElement({ 
        name: '', 
        quantity: 1, 
        type: 'custom', 
        x: 50, y: 50,
        width: 100, height: 50,
        rotation: 0,
        imageUrl: '',
        notes: '',
        category: 'Otro'
      });
      setSelectedElementId(null);
    }
    setIsFormModalOpen(true);
  };
  
  const addFromPalette = (paletteItem: Omit<LayoutElement, 'id' | 'x' | 'y' | 'quantity'>) => {
     setCurrentElement({ 
        name: paletteItem.name,
        quantity: 1,
        type: 'predefined',
        x: Math.floor(Math.random() * 200) + 50, 
        y: Math.floor(Math.random() * 200) + 50,
        width: paletteItem.width || 50,
        height: paletteItem.height || 50,
        rotation: paletteItem.rotation || 0,
        imageUrl: paletteItem.imageUrl,
        notes: '',
        category: paletteItem.category || 'Otro'
     });
     setSelectedElementId(null); 
     setIsFormModalOpen(true);
  };

 const handleElementFieldChange = (
    field: keyof Omit<LayoutElement, 'id' | 'type'>,
    rawValue: string | undefined
  ) => {
    setCurrentElement(prevModalElement => {
      if (!prevModalElement) return null;

      let processedValue: string | number | undefined = rawValue;

      if (['x', 'y', 'width', 'height', 'rotation', 'quantity'].includes(field)) {
        const numVal = parseFloat(rawValue || '');
        if (isNaN(numVal)) {
          processedValue = (field === 'quantity') ? 1 : 0;
        } else {
          processedValue = numVal;
        }
        if (field === 'quantity' && (processedValue as number) < 1) {
          processedValue = 1;
        }
      }
      
      const updatedModalElement = { ...prevModalElement, [field]: processedValue } as Partial<LayoutElement>;

      // Live update the main layoutData if editing an existing element
      if (prevModalElement.id && layoutData.elements.find(el => el.id === prevModalElement.id)) {
        setLayoutData(prevLayoutData => ({
          ...prevLayoutData,
          elements: prevLayoutData.elements.map(el =>
            el.id === prevModalElement.id
              ? { ...el, [field as keyof LayoutElement]: processedValue } // Use field from outer scope
              : el
          ),
        }));
      }
      return updatedModalElement;
    });
  };


  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentElement || !currentElement.name?.trim()) {
      toast({ title: "Datos Inválidos", description: "El nombre del elemento no puede estar vacío.", variant: "destructive" });
      return;
    }

    const isEditing = !!currentElement.id && layoutData.elements.find(el => el.id === currentElement.id);

    if (isEditing) {
      // The element in layoutData.elements is already updated by live updates (handleElementFieldChange).
      // We just need to ensure the currentElement state itself is fully typed if we were to use it directly.
      // Or simply rely on the fact that layoutData.elements has the latest.
      const updatedElementInLayout = layoutData.elements.find(el => el.id === currentElement.id);
      toast({ title: "Elemento Actualizado", description: `${updatedElementInLayout?.name || 'El elemento'} ha sido actualizado.` });
    } else { // Adding a new element
      const newElementData: LayoutElement = {
        id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: currentElement.name.trim(),
        quantity: Number(currentElement.quantity) || 1,
        x: Number(currentElement.x) || 0,
        y: Number(currentElement.y) || 0,
        width: Number(currentElement.width) || 50,
        height: Number(currentElement.height) || 50,
        rotation: Number(currentElement.rotation) || 0,
        imageUrl: currentElement.imageUrl?.trim() || undefined,
        notes: currentElement.notes?.trim() || undefined,
        type: currentElement.type || 'custom',
        category: currentElement.category?.trim() || 'Otro',
      };
      setLayoutData(prev => ({ ...prev, elements: [...prev.elements, newElementData] }));
      toast({ title: "Elemento Añadido", description: `${newElementData.name} añadido al diseño.` });
    }
    
    setIsFormModalOpen(false);
    setCurrentElement(null);
    setSelectedElementId(null);
  };
  
  const handleRemoveElement = (elementId?: string) => {
    const idToRemove = elementId || contextMenuTargetId;
    if (!idToRemove) return;
    setLayoutData(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== idToRemove),
    }));
    toast({ title: "Elemento Eliminado", variant: "destructive" });
    setContextMenuOpen(false); 
  };

  const handleDragStop = (e: DraggableEvent, data: DraggableData, elementId: string) => {
    setLayoutData(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, x: Math.round(data.x), y: Math.round(data.y) } : el
      ),
    }));
  };

  const handleDuplicateElement = (elementId?: string) => {
    const idToDuplicate = elementId || contextMenuTargetId;
    if(!idToDuplicate) return;

    const elementToDuplicate = layoutData.elements.find(el => el.id === idToDuplicate);
    if (elementToDuplicate) {
      const duplicatedElement: LayoutElement = {
        ...JSON.parse(JSON.stringify(elementToDuplicate)), 
        id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        x: (elementToDuplicate.x || 0) + 20, 
        y: (elementToDuplicate.y || 0) + 20,
      };
      setLayoutData(prev => ({
        ...prev,
        elements: [...prev.elements, duplicatedElement],
      }));
      toast({ title: "Elemento Duplicado", description: `${duplicatedElement.name} ha sido duplicado.` });
    }
    setContextMenuOpen(false);
  };

  const moveElement = (elementId: string | null, direction: 'up' | 'down' | 'front' | 'back') => {
    const idToMove = elementId || contextMenuTargetId;
    if(!idToMove) return;

    setLayoutData(prev => {
      const elements = [...prev.elements];
      const index = elements.findIndex(el => el.id === idToMove);
      if (index === -1) return prev;

      const item = elements.splice(index, 1)[0];

      switch (direction) {
        case 'up': 
          if (index < elements.length) elements.splice(index + 1, 0, item);
          else elements.push(item); 
          break;
        case 'down': 
          if (index > 0) elements.splice(index - 1, 0, item);
          else elements.unshift(item); 
          break;
        case 'front': 
          elements.push(item);
          break;
        case 'back': 
          elements.unshift(item);
          break;
      }
      return { ...prev, elements };
    });
    setContextMenuOpen(false);
  };


  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      const validatedLayoutData: SalonLayoutData = {
        ...layoutData,
        elements: layoutData.elements.map(el => ({
          id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
          name: el.name || 'Elemento sin nombre',
          quantity: el.quantity === undefined ? 1 : el.quantity,
          notes: el.notes || undefined,
          imageUrl: el.imageUrl || undefined,
          x: el.x ?? 0,
          y: el.y ?? 0,
          width: el.width ?? 50,
          height: el.height ?? 50,
          rotation: el.rotation ?? 0,
          type: el.type ?? 'custom',
          category: el.category || 'Otro',
        }))
      };
      const result = await updateSalonLayoutFiestaActual(validatedLayoutData);
      if (result.success && result.updatedData) {
        toast({ title: "¡Diseño Guardado!", description: "La configuración del diseño del salón ha sido guardada." });
        setLayoutData({ 
            backgroundImageUrl: result.updatedData.backgroundImageUrl || '',
            elements: (result.updatedData.elements || []).map(el => ({
                id: el.id, name: el.name, quantity: el.quantity, notes: el.notes, imageUrl: el.imageUrl,
                x: el.x ?? 0, y: el.y ?? 0, width: el.width ?? 50, height: el.height ?? 50,
                rotation: el.rotation ?? 0, type: el.type ?? 'custom', category: el.category || 'Otro'
            })),
            generalNotes: result.updatedData.generalNotes || ''
        });
      } else {
        throw new Error(result.error || "Error desconocido al guardar el diseño del salón.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getPaletteIcon = (category?: string) => {
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
  
  const targetElementForContextMenu = contextMenuTargetId ? layoutData.elements.find(el => el.id === contextMenuTargetId) : null;


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando diseño del salón...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Configuración del Plano del Salón</CardTitle>
          <CardDescription>Sube una imagen del plano, añade elementos y notas para la disposición.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="background-image-url" className="text-base">URL de Imagen del Plano del Salón</Label>
            <Input
              id="background-image-url"
              type="url"
              value={layoutData.backgroundImageUrl || ''}
              onChange={(e) => setLayoutData(prev => ({...prev, backgroundImageUrl: e.target.value}))}
              placeholder="Pega aquí la URL de una imagen del plano (ej: https://.../plano.jpg)"
              className="text-base p-3"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Sube tu imagen a un servicio como Imgur o Google Photos y pega el enlace directo aquí.
            </p>
          </div>
          <div className="space-y-2">
              <Label htmlFor="general-layout-notes" className="text-base">Notas Generales de Disposición</Label>
              <Textarea
                id="general-layout-notes"
                value={layoutData.generalNotes || ''}
                onChange={(e) =>setLayoutData(prev => ({...prev, generalNotes: e.target.value}))}
                placeholder="Describe aquí la distribución general, zonas importantes, etc."
                rows={3}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-primary"/>
              <CardTitle className="font-headline text-lg">Paleta de Elementos</CardTitle>
            </div>
            <CardDescription className="text-xs">Haz clic para pre-rellenar el formulario y añadir al plano.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-3">
              <div className="space-y-2">
                {predefinedElementsPalette.map((item, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start h-auto py-2 text-left"
                    onClick={() => addFromPalette(item)}
                    disabled={isSaving}
                  >
                    {getPaletteIcon(item.category)}
                    <div className="flex flex-col">
                        <span className="text-xs font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                    </div>
                  </Button>
                ))}
                <Separator className="my-3"/>
                <Button variant="default" className="w-full mt-2" onClick={() => openFormModal()} disabled={isSaving}>
                    <PlusCircle className="w-4 h-4 mr-2" />Añadir Elemento Personalizado
                </Button>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
                <Maximize className="w-6 h-6 text-primary"/>
                <CardTitle className="font-headline text-lg">Lienzo del Salón (Interactivo)</CardTitle>
            </div>
             <CardDescription className="text-xs">Arrastra los elementos para posicionarlos. Haz clic para editar o clic derecho para más opciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={canvasRef}
              className="relative w-full aspect-[16/9] border border-dashed rounded-md bg-muted/20 overflow-hidden select-none group"
              style={{ 
                backgroundImage: layoutData.backgroundImageUrl ? `url(${layoutData.backgroundImageUrl})` : 'none',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                minHeight: '450px', 
              }}
              onClick={() => setContextMenuOpen(false)}
            >
              {!layoutData.backgroundImageUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <ImageOff className="w-16 h-16 mb-2 opacity-50" />
                  <p className="text-sm">Sin plano de fondo. Añade una URL arriba.</p>
                </div>
              )}
              {layoutData.elements.map(el => (
                 <Draggable
                    key={el.id}
                    axis="both"
                    handle=".handle" 
                    position={{ x: el.x ?? 0, y: el.y ?? 0 }}
                    grid={[5, 5]} 
                    scale={1} 
                    bounds="parent" 
                    onStop={(e, data) => handleDragStop(e, data, el.id)}
                  >
                    <div
                      title={`${el.name} (x:${el.x}, y:${el.y})`}
                      className={`
                        absolute border cursor-grab active:cursor-grabbing 
                        flex items-center justify-center text-xs p-1 rounded-sm handle
                        transition-all duration-150 ease-in-out
                        ${selectedElementId === el.id 
                          ? 'border-2 border-accent ring-2 ring-accent shadow-xl z-10' 
                          : 'border-primary/50 bg-primary/10 hover:border-primary hover:ring-2 hover:ring-primary/50 hover:shadow-md'
                        }
                      `}
                      style={{
                        width: `${el.width || 50}px`,
                        height: `${el.height || 50}px`,
                        transform: `rotate(${el.rotation || 0}deg)`,
                        color: 'hsl(var(--primary-foreground))',
                        touchAction: 'none', 
                      }}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.react-draggable-dragging') || (e.target as HTMLElement).classList.contains('handle-icon')) return;
                        if (e.ctrlKey || e.metaKey) return; 
                        e.stopPropagation(); 
                        openFormModal(el);
                        setContextMenuOpen(false);
                      }}
                      onContextMenu={(e) => handleContextMenu(e, el.id)}
                    >
                       {el.imageUrl ? (
                        <Image src={el.imageUrl} alt={el.name} layout="fill" objectFit="contain" className="rounded-sm pointer-events-none" data-ai-hint="object floor element"/>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-primary/20 pointer-events-none text-center p-0.5">
                            <span className="truncate text-[8px] sm:text-[10px] font-medium text-primary-foreground leading-tight">{el.name}</span>
                            <span className="text-[7px] sm:text-[9px] text-primary-foreground/80 leading-tight">({el.width}x{el.height}px)</span>
                        </div>
                      )}
                       <Move className="handle-icon absolute top-0 right-0 w-3 h-3 text-primary-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab p-0.5 bg-black/20 rounded-bl-sm"/>
                    </div>
                  </Draggable>
              ))}
                <div ref={contextMenuTriggerRef} style={{ position: 'fixed', zIndex: 1000 }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex items-center gap-2">
                <LayoutGrid className="w-6 h-6 text-primary" />
                <CardTitle className="font-headline text-lg">Elementos en el Diseño ({layoutData.elements.length})</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
          {layoutData.elements.length > 0 ? (
            <ScrollArea className="h-[250px] pr-3">
              <ul className="space-y-2">
                {layoutData.elements.map((el, index) => (
                  <li key={el.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 border rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-2 flex-grow mb-2 sm:mb-0">
                       {el.imageUrl ? <Image src={el.imageUrl} alt={el.name} width={24} height={24} className="rounded-sm object-contain border" data-ai-hint="icon element"/> : getPaletteIcon(el.category)}
                        <div>
                            <p className="font-medium text-sm">{el.name} <span className="text-xs text-muted-foreground">({el.category || 'Otro'})</span></p>
                            <p className="text-xs text-muted-foreground">
                                X:{el.x}, Y:{el.y} | W:{el.width}px, H:{el.height}px | Rot: {el.rotation}°
                                {el.notes && ` | Notas: ${el.notes.substring(0,30)}...`}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
                        <Button variant="outline" size="icon" onClick={() => openFormModal(el)} className="h-7 w-7" aria-label="Editar Elemento"><Edit3 className="w-3.5 h-3.5"/></Button>
                        <Button variant="outline" size="icon" onClick={() => handleDuplicateElement(el.id)} className="h-7 w-7" aria-label="Duplicar Elemento"><Copy className="w-3.5 h-3.5"/></Button>
                        
                        <Button variant="outline" size="icon" onClick={() => moveElement(el.id, 'up')} disabled={index === layoutData.elements.length - 1} className="h-7 w-7" aria-label="Mover Arriba"><ArrowUp className="w-3.5 h-3.5"/></Button>
                        <Button variant="outline" size="icon" onClick={() => moveElement(el.id, 'down')} disabled={index === 0} className="h-7 w-7" aria-label="Mover Abajo"><ArrowDown className="w-3.5 h-3.5"/></Button>
                        <Button variant="outline" size="icon" onClick={() => moveElement(el.id, 'front')} disabled={index === layoutData.elements.length - 1} className="h-7 w-7" aria-label="Traer al Frente"><ChevronsUp className="w-3.5 h-3.5"/></Button>
                        <Button variant="outline" size="icon" onClick={() => moveElement(el.id, 'back')} disabled={index === 0} className="h-7 w-7" aria-label="Enviar al Fondo"><ChevronsDown className="w-3.5 h-3.5"/></Button>
                        
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-7 w-7" aria-label="Eliminar Elemento" disabled={isSaving}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle></AlertDialogHeader>
                                <AlertDialogDescription>El elemento "{layoutData.elements.find(e => e.id === el.id)?.name}" será eliminado.</AlertDialogDescription>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveElement(el.id)} className="bg-destructive hover:bg-destructive/90">Sí, eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-md">No hay elementos añadidos al diseño. Utiliza la paleta o el botón "Añadir Elemento Personalizado".</p>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6">
            <Button onClick={handleSaveLayout} className="w-full sm:w-auto" disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando Diseño...' : 'Guardar Diseño del Salón'}
            </Button>
        </CardFooter>
      </Card>

      <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
        <DropdownMenuTrigger ref={contextMenuTriggerRef} className="fixed opacity-0 pointer-events-none" />
         {targetElementForContextMenu && (
            <DropdownMenuContent 
                className="w-56"
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <DropdownMenuItem onClick={() => { openFormModal(targetElementForContextMenu); setContextMenuOpen(false); }}>
                    <Edit3 className="mr-2 h-4 w-4" /> Editar Propiedades
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicateElement()}>
                    <Copy className="mr-2 h-4 w-4" /> Duplicar Elemento
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => moveElement(null, 'front')}>
                    <ChevronsUp className="mr-2 h-4 w-4" /> Traer al Frente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveElement(null, 'up')}>
                    <ArrowUp className="mr-2 h-4 w-4" /> Mover Adelante
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveElement(null, 'down')}>
                    <ArrowDown className="mr-2 h-4 w-4" /> Mover Atrás
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveElement(null, 'back')}>
                    <ChevronsDown className="mr-2 h-4 w-4" /> Enviar al Fondo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" /> Eliminar Elemento
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                            <AlertDialogDescription>
                                El elemento "{targetElementForContextMenu.name}" será eliminado permanentemente.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setContextMenuOpen(false)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveElement()} className="bg-destructive hover:bg-destructive/90">
                                Sí, eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
         )}
      </DropdownMenu>


      <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => { setIsFormModalOpen(isOpen); if (!isOpen) setSelectedElementId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">{currentElement?.id ? 'Editar Elemento del Diseño' : 'Añadir Nuevo Elemento al Diseño'}</DialogTitle>
            <DialogDescription>Define las propiedades del elemento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1">
              <Label htmlFor="el-name">Nombre del Elemento</Label>
              <Input id="el-name" value={currentElement?.name || ''} onChange={(e) => handleElementFieldChange('name', e.target.value)} required />
            </div>
             <div className="space-y-1">
              <Label htmlFor="el-type">Tipo</Label>
              <Select 
                value={currentElement?.type || 'custom'} 
                onValueChange={(val) => {
                    setCurrentElement(prev => prev ? ({...prev, type: val as 'predefined' | 'custom'}) : null);
                 }}
                >
                <SelectTrigger id="el-type"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Personalizado (URL propia)</SelectItem>
                  <SelectItem value="predefined">Predefinido (de la paleta)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(currentElement?.type === 'custom' || (currentElement?.type === 'predefined' && !predefinedElementsPalette.find(p => p.name === currentElement.name)?.imageUrl) ) && (
                 <div className="space-y-1">
                    <Label htmlFor="el-imageUrl">URL de Imagen</Label>
                    <Input id="el-imageUrl" type="url" placeholder="https://ejemplo.com/imagen.png" value={currentElement?.imageUrl || ''} onChange={(e) => handleElementFieldChange('imageUrl', e.target.value)} />
                </div>
            )}
            {currentElement?.type === 'predefined' && currentElement.imageUrl && predefinedElementsPalette.find(p => p.name === currentElement.name)?.imageUrl && (
                <div className="space-y-1">
                    <Label>Imagen Predefinida</Label>
                    <Image src={currentElement.imageUrl} alt={currentElement.name || "preview"} width={40} height={40} className="border rounded-sm object-contain" data-ai-hint="icon predefined"/>
                </div>
            )}
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="el-x">Posición X (px)</Label>
                  <Input id="el-x" type="number" value={currentElement?.x ?? ''} onChange={(e) => handleElementFieldChange('x', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="el-y">Posición Y (px)</Label>
                  <Input id="el-y" type="number" value={currentElement?.y ?? ''} onChange={(e) => handleElementFieldChange('y', e.target.value)} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="el-width">Ancho (px)</Label>
                  <Input id="el-width" type="number" placeholder="Ej: 100" value={currentElement?.width ?? ''} onChange={(e) => handleElementFieldChange('width', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="el-height">Alto (px)</Label>
                  <Input id="el-height" type="number" placeholder="Ej: 50" value={currentElement?.height ?? ''} onChange={(e) => handleElementFieldChange('height', e.target.value)} />
                </div>
            </div>
             <div className="space-y-1">
              <Label htmlFor="el-rotation">Rotación (grados)</Label>
              <Input id="el-rotation" type="number" placeholder="Ej: 0" value={currentElement?.rotation ?? ''} onChange={(e) => handleElementFieldChange('rotation', e.target.value)} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="el-category">Categoría</Label>
                 <Select
                    value={currentElement?.category || 'Otro'}
                    onValueChange={(value) => handleElementFieldChange('category', value)}
                  >
                    <SelectTrigger id="el-category">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
            </div>
             <div className="space-y-1">
              <Label htmlFor="el-quantity">Cantidad (Informativo)</Label>
              <Input id="el-quantity" type="number" value={currentElement?.quantity ?? 1} onChange={(e) => handleElementFieldChange('quantity', e.target.value)} min="1" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="el-notes">Notas Específicas (opcional)</Label>
              <Textarea id="el-notes" value={currentElement?.notes || ''} onChange={(e) => handleElementFieldChange('notes', e.target.value)} rows={2} />
            </div>
            <DialogFooter className="pt-3">
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => setSelectedElementId(null)}>Cancelar</Button></DialogClose>
                <Button type="submit">{currentElement?.id ? 'Guardar Cambios' : 'Añadir Elemento'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
