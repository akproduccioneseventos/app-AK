
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
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2, AlertTriangle, LayoutGrid, ImageOff, Edit3, Wand2, Maximize, Move } from 'lucide-react';
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


const predefinedElementsPalette: Omit<LayoutElement, 'id' | 'x' | 'y' | 'quantity'>[] = [
  { name: 'Mesa Redonda (8 pax)', imageUrl: 'https://placehold.co/80x80/E0E0E0/B0B0B0.png?text=Mesa', width: 80, height: 80, rotation: 0, type: 'predefined', category: 'Mobiliario' },
  { name: 'Mesa Rectangular (6 pax)', imageUrl: 'https://placehold.co/120x60/E0E0E0/B0B0B0.png?text=Mesa L', width: 120, height: 60, rotation: 0, type: 'predefined', category: 'Mobiliario' },
  { name: 'Silla', imageUrl: 'https://placehold.co/30x30/F0F0F0/C0C0C0.png?text=S', width: 30, height: 30, rotation: 0, type: 'predefined', category: 'Mobiliario' },
  { name: 'Pista de Baile (Pequeña)', imageUrl: 'https://placehold.co/150x150/D0D0D0/A0A0A0.png?text=Pista', width: 150, height: 150, rotation: 0, type: 'predefined', category: 'Zona' },
  { name: 'Barra de Bebidas', imageUrl: 'https://placehold.co/100x40/C8C8C8/989898.png?text=Bar', width: 100, height: 40, rotation: 0, type: 'predefined', category: 'Equipamiento' },
  { name: 'Escenario (Pequeño)', imageUrl: 'https://placehold.co/120x80/BDBDBD/8D8D8D.png?text=Escenario', width: 120, height: 80, rotation: 0, type: 'predefined', category: 'Equipamiento' },
  { name: 'Planta Decorativa', imageUrl: 'https://placehold.co/40x40/A9A9A9/797979.png?text=Planta', width: 40, height: 40, rotation: 0, type: 'predefined', category: 'Decoración' },
];

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
                category: el.category || undefined,
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

  const openFormModal = (element?: LayoutElement) => {
    if (element) {
      setCurrentElement({ ...element });
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
        category: paletteItem.category
     });
     setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentElement || !currentElement.name?.trim()) {
      toast({ title: "Datos Inválidos", description: "El nombre del elemento no puede estar vacío.", variant: "destructive" });
      return;
    }

    const newElementData: LayoutElement = {
      id: currentElement.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
    
    let updatedElements;
    if (currentElement.id) { 
        updatedElements = layoutData.elements.map(el => el.id === currentElement.id ? newElementData : el);
        toast({ title: "Elemento Actualizado", description: `${newElementData.name} ha sido actualizado.` });
    } else { 
        updatedElements = [...layoutData.elements, newElementData];
        toast({ title: "Elemento Añadido", description: `${newElementData.name} añadido al diseño.` });
    }
    
    setLayoutData(prev => ({ ...prev, elements: updatedElements }));
    setIsFormModalOpen(false);
    setCurrentElement(null);
  };
  
  const handleElementFieldChange = (field: keyof LayoutElement | 'quantity', value: string | number) => {
    setCurrentElement(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleRemoveElement = (elementId: string) => {
    setLayoutData(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId),
    }));
    toast({ title: "Elemento Eliminado", variant: "destructive" });
  };

  const handleDragStop = (e: DraggableEvent, data: DraggableData, elementId: string) => {
    setLayoutData(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, x: data.x, y: data.y } : el
      ),
    }));
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
          category: el.category || undefined,
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
                rotation: el.rotation ?? 0, type: el.type ?? 'custom', category: el.category
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
                    className="w-full justify-start h-auto py-2"
                    onClick={() => addFromPalette(item)}
                    disabled={isSaving}
                  >
                    <Image src={item.imageUrl || "https://placehold.co/40x40.png"} alt={item.name} width={30} height={30} className="mr-2 rounded-sm object-contain" data-ai-hint="icon element"/>
                    <span className="text-xs">{item.name}</span>
                  </Button>
                ))}
                <Button variant="default" className="w-full mt-4" onClick={() => openFormModal()} disabled={isSaving}>
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
             <CardDescription className="text-xs">Arrastra los elementos para posicionarlos. Haz clic para editar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={canvasRef}
              className="relative w-full aspect-[16/9] border border-dashed rounded-md bg-muted/20 overflow-hidden select-none"
              style={{ 
                backgroundImage: layoutData.backgroundImageUrl ? `url(${layoutData.backgroundImageUrl})` : 'none',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                minHeight: '400px', // Increased minHeight for better usability
              }}
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
                    handle=".handle" // Define a handle if you want specific drag areas, otherwise whole element is draggable
                    defaultPosition={{ x: el.x ?? 0, y: el.y ?? 0 }} // Use defaultPosition for uncontrolled if not updating state during drag
                    position={{ x: el.x ?? 0, y: el.y ?? 0 }} // Use position for controlled component
                    grid={[5, 5]} // Snap to grid (optional)
                    scale={1} // Scale (optional)
                    bounds="parent" // Restrict to parent bounds
                    onStop={(e, data) => handleDragStop(e, data, el.id)}
                  >
                    <div
                      title={`${el.name} (x:${el.x}, y:${el.y})`}
                      className="absolute border border-primary/50 bg-primary/20 hover:bg-primary/30 cursor-grab active:cursor-grabbing flex items-center justify-center text-xs p-1 rounded-sm handle" // Added handle class
                      style={{
                        width: `${el.width || 50}px`,
                        height: `${el.height || 50}px`,
                        transform: `rotate(${el.rotation || 0}deg)`,
                        color: 'hsl(var(--primary-foreground))',
                        touchAction: 'none', // Important for touch devices
                      }}
                      onClick={(e) => {
                        // Prevent modal from opening if it was a drag action (simple check)
                        const target = e.target as HTMLElement;
                        if (target.closest('.react-draggable-dragging')) return;
                        openFormModal(el);
                      }}
                    >
                       {el.imageUrl ? (
                        <Image src={el.imageUrl} alt={el.name} layout="fill" objectFit="contain" className="rounded-sm pointer-events-none" data-ai-hint="object floor element"/>
                      ) : (
                        <span className="truncate text-center p-0.5 text-[8px] sm:text-[10px] pointer-events-none">{el.name}</span>
                      )}
                       <Move className="absolute top-0 right-0 w-3 h-3 text-primary-foreground/50 opacity-50 group-hover:opacity-100 transition-opacity handle"/>
                    </div>
                  </Draggable>
              ))}
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
                {layoutData.elements.map(el => (
                  <li key={el.id} className="flex justify-between items-center p-2 border rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                       {el.imageUrl ? <Image src={el.imageUrl} alt={el.name} width={24} height={24} className="rounded-sm object-contain" data-ai-hint="icon element"/> : <LayoutGrid className="w-4 h-4 text-muted-foreground"/>}
                        <div>
                            <p className="font-medium text-sm">{el.name} <span className="text-xs text-muted-foreground">({el.type})</span></p>
                            <p className="text-xs text-muted-foreground">
                                X:{el.x}, Y:{el.y} | W:{el.width}px, H:{el.height}px | Rot: {el.rotation}°
                                {el.notes && ` | Notas: ${el.notes.substring(0,30)}...`}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" onClick={() => openFormModal(el)} className="h-7 w-7" aria-label="Editar Elemento">
                            <Edit3 className="w-3.5 h-3.5"/>
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-7 w-7" aria-label="Eliminar Elemento" disabled={isSaving}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveElement(el.id)} className="bg-destructive hover:bg-destructive/90">
                                    Sí, eliminar
                                </AlertDialogAction>
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

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
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
              <Select value={currentElement?.type || 'custom'} onValueChange={(val) => handleElementFieldChange('type', val as 'predefined' | 'custom')}>
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
                  <Input id="el-x" type="number" value={currentElement?.x ?? 0} onChange={(e) => handleElementFieldChange('x', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="el-y">Posición Y (px)</Label>
                  <Input id="el-y" type="number" value={currentElement?.y ?? 0} onChange={(e) => handleElementFieldChange('y', Number(e.target.value))} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="el-width">Ancho (px)</Label>
                  <Input id="el-width" type="number" placeholder="Ej: 100" value={currentElement?.width ?? ''} onChange={(e) => handleElementFieldChange('width', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="el-height">Alto (px)</Label>
                  <Input id="el-height" type="number" placeholder="Ej: 50" value={currentElement?.height ?? ''} onChange={(e) => handleElementFieldChange('height', Number(e.target.value))} />
                </div>
            </div>
             <div className="space-y-1">
              <Label htmlFor="el-rotation">Rotación (grados)</Label>
              <Input id="el-rotation" type="number" placeholder="Ej: 0" value={currentElement?.rotation ?? 0} onChange={(e) => handleElementFieldChange('rotation', Number(e.target.value))} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="el-category">Categoría</Label>
                <Input id="el-category" value={currentElement?.category || ''} onChange={(e) => handleElementFieldChange('category', e.target.value)} placeholder="Ej: Mobiliario, Decoración"/>
            </div>
             <div className="space-y-1">
              <Label htmlFor="el-quantity">Cantidad (Informativo)</Label>
              <Input id="el-quantity" type="number" value={currentElement?.quantity ?? 1} onChange={(e) => handleElementFieldChange('quantity', Number(e.target.value))} min="1" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="el-notes">Notas Específicas (opcional)</Label>
              <Textarea id="el-notes" value={currentElement?.notes || ''} onChange={(e) => handleElementFieldChange('notes', e.target.value)} rows={2} />
            </div>
            <DialogFooter className="pt-3">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit">{currentElement?.id ? 'Guardar Cambios' : 'Añadir Elemento'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

