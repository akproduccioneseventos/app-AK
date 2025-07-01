
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import Draggable, { type DraggableEvent, type DraggableData } from 'react-draggable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, AlertTriangle, PlusCircle, Settings2, LayoutDashboard, Printer, Trash2, Pointer, Move, Users, Save, RectangleHorizontal, Circle, Music, Sofa } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, DecoracionData, LayoutElement, Invitado } from '@/types/fiesta';
import { defaultDecoracion, ALL_LAYOUT_ELEMENT_CATEGORIES } from '@/lib/fiesta-defaults';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from '@/components/ui/slider';

const PALETTE_ITEMS: { category: string; label: string; icon: React.ElementType, default: Partial<LayoutElement> }[] = [
    { category: 'Mesa Redonda', label: 'Mesa Redonda', icon: Circle, default: { width: 80, height: 80, quantity: 10 } },
    { category: 'Mesa Rectangular', label: 'Mesa Rectangular', icon: RectangleHorizontal, default: { width: 160, height: 80, quantity: 10 } },
    { category: 'Mesa Principal', label: 'Mesa Principal', icon: RectangleHorizontal, default: { width: 200, height: 80, quantity: 2 } },
    { category: 'Pista de Baile', label: 'Pista de Baile', icon: Music, default: { width: 150, height: 150 } },
    { category: 'Cabina de DJ', label: 'Cabina de DJ', icon: Music, default: { width: 100, height: 50 } },
    { category: 'Barra de Tragos', label: 'Barra de Tragos', icon: RectangleHorizontal, default: { width: 180, height: 60 } },
    { category: 'Mobiliario (Sillón)', label: 'Sillón / Living', icon: Sofa, default: { width: 120, height: 60 } },
];


// This new component handles the Draggable node reference correctly, fixing the React 18 error.
const DraggableLayoutElement = ({ element, layoutMode, invitados, onDragStop, onDoubleClick }: {
  element: LayoutElement;
  layoutMode?: 'libre' | 'asignado';
  invitados: Invitado[];
  onDragStop: (e: DraggableEvent, data: DraggableData, elementId: string) => void;
  onDoubleClick: (element: LayoutElement) => void;
}) => {
  const nodeRef = useRef(null);

  const assignedGuests = layoutMode === 'asignado'
    ? invitados.filter(inv => inv.tableNumber === element.name)
    : [];
  const isRound = element.category === 'Mesa Redonda';

  const triggerContent = (
    <div
      className={`p-1 border border-primary bg-primary/20 text-primary-foreground text-xs text-center flex flex-col items-center justify-center cursor-move shadow-lg w-full h-full ${isRound ? 'rounded-full' : 'rounded-sm'}`}
      style={{ transform: `rotate(${element.rotation || 0}deg)` }}
      onDoubleClick={() => onDoubleClick(element)}
    >
      <Move className="w-3 h-3 absolute top-0.5 right-0.5 opacity-50" />
      <span className="truncate w-full font-semibold">{element.name}</span>
      {layoutMode === 'asignado' && <span className="text-xs opacity-80 flex items-center gap-1"><Users className="w-3 h-3" />{assignedGuests.length}</span>}
    </div>
  );

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      position={{ x: element.x, y: element.y }}
      onStop={(e, data) => onDragStop(e, data, element.id)}
    >
      <div
        ref={nodeRef}
        style={{
          position: 'absolute',
          width: element.width,
          height: element.height,
        }}
      >
        {layoutMode === 'asignado' ? (
          <Popover>
            <PopoverTrigger asChild>{triggerContent}</PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="font-bold text-sm mb-2">{element.name}</div>
              {assignedGuests.length > 0 ? (
                <ul className="text-xs space-y-1">
                  {assignedGuests.map(g => <li key={g.id}>{g.nombre} {g.partySize && g.partySize > 1 ? `(+${g.partySize - 1})` : ''}</li>)}
                </ul>
              ) : <p className="text-xs text-muted-foreground">No hay invitados asignados.</p>}
            </PopoverContent>
          </Popover>
        ) : (
          triggerContent
        )}
      </div>
    </Draggable>
  );
};


export default function SalonLayoutPage() {
  const { toast } = useToast();
  const [decoracionData, setDecoracionData] = useState<DecoracionData>(defaultDecoracion);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isElementSheetOpen, setIsElementSheetOpen] = useState(false);
  const [currentLayoutElement, setCurrentLayoutElement] = useState<Partial<LayoutElement> | null>(null);

  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFailedImageUrls({});
    try {
      const fiestaData = await getFiestaActual();
      setDecoracionData(fiestaData.decoracion || defaultDecoracion);
      setInvitados(fiestaData.invitados || []);
    } catch (err: any) {
      setError("No se pudo cargar la configuración de diseño del salón.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleInputChange = (
    field: keyof DecoracionData,
    value: DecoracionData[keyof DecoracionData]
  ) => {
    setDecoracionData(prev => ({ ...prev, [field]: value }));
    if (field === 'salonPlanBackgroundImageUrl') {
        setFailedImageUrls(prevFailed => ({...prevFailed, salonPlanBackgroundImageUrl: false}));
    }
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    const layoutDataToSave: Partial<DecoracionData> = {
        layoutMode: decoracionData.layoutMode,
        salonPlanBackgroundImageUrl: decoracionData.salonPlanBackgroundImageUrl,
        salonElements: decoracionData.salonElements,
        generalNotesSalonLayout: decoracionData.generalNotesSalonLayout
    };
    try {
      const result = await updateDecoracionFiestaActual(layoutDataToSave);
      if (result.success) {
        toast({ title: "¡Diseño Guardado!", description: "La disposición del salón se ha actualizado." });
        if (result.updatedData) {
            setDecoracionData(prev => ({...prev, ...result.updatedData}));
        }
      } else {
        throw new Error(result.error || "Error desconocido al guardar el diseño.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const openElementSheet = (element?: LayoutElement) => {
    setCurrentLayoutElement(element || { name: '', width: 50, height: 50, x: 50, y: 50, rotation: 0, quantity: 1, type: 'custom', category: 'Otro' });
    setIsElementSheetOpen(true);
  };
  
  const addElementFromPalette = (category: string, defaults: Partial<LayoutElement>) => {
    const newElement: LayoutElement = {
      id: `layout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${category} ${decoracionData.salonElements?.filter(e => e.category === category).length + 1}`,
      x: 100,
      y: 100,
      rotation: 0,
      quantity: 1,
      category: category,
      type: 'predefined',
      ...defaults,
    };
    setDecoracionData(prev => ({
        ...prev,
        salonElements: [...(prev.salonElements || []), newElement]
    }));
  };


  const handleLayoutElementChange = (field: keyof LayoutElement, value: string | number) => {
    setCurrentLayoutElement(prev => (prev ? { ...prev, [field]: value } : null));
  };
  
  const handleSaveLayoutElement = () => {
    if (!currentLayoutElement || !currentLayoutElement.name?.trim()) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }
    const finalElement = { ...currentLayoutElement, id: currentLayoutElement.id || `layout_${Date.now()}` } as LayoutElement;
    setDecoracionData(prev => {
        const salonElements = prev.salonElements || [];
        const index = salonElements.findIndex(el => el.id === finalElement.id);
        if (index > -1) {
            salonElements[index] = finalElement;
            return { ...prev, salonElements: [...salonElements] };
        }
        return { ...prev, salonElements: [...salonElements, finalElement] };
    });
    setIsElementSheetOpen(false);
  };

  const handleDeleteLayoutElement = (elementId: string) => {
    setDecoracionData(prev => ({
        ...prev,
        salonElements: (prev.salonElements || []).filter(el => el.id !== elementId)
    }));
  };

  const handleDragStop = (e: DraggableEvent, data: DraggableData, elementId: string) => {
    setDecoracionData(prev => {
        const salonElements = (prev.salonElements || []).map(el =>
            el.id === elementId ? { ...el, x: data.x, y: data.y } : el
        );
        return { ...prev, salonElements };
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando diseñador...</p></div>;
  }
  if (error) {
    return <div className="py-10 text-center text-red-600"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p><Button onClick={loadData} className="mt-4">Reintentar</Button></div>;
  }

  return (
    <div className="space-y-6">
        <Sheet open={isElementSheetOpen} onOpenChange={setIsElementSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-headline text-lg">{currentLayoutElement?.id ? 'Editar' : 'Añadir'} Elemento</SheetTitle>
          </SheetHeader>
          {currentLayoutElement && (
            <div className="py-4 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="layout-el-name">Nombre (Ej: "Mesa 5", "Pista") *</Label>
                <Input id="layout-el-name" value={currentLayoutElement.name || ''} onChange={(e) => handleLayoutElementChange('name', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="layout-el-cat">Categoría</Label>
                <Select value={currentLayoutElement.category || 'Otro'} onValueChange={(val) => handleLayoutElementChange('category', val)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar categoría..."/></SelectTrigger>
                  <SelectContent>{ALL_LAYOUT_ELEMENT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1"><Label htmlFor="layout-el-w">Ancho (px)</Label><Input id="layout-el-w" type="number" value={currentLayoutElement.width || 50} onChange={(e) => handleLayoutElementChange('width', Number(e.target.value) || 50)}/></div>
                 <div className="space-y-1"><Label htmlFor="layout-el-h">Alto (px)</Label><Input id="layout-el-h" type="number" value={currentLayoutElement.height || 50} onChange={(e) => handleLayoutElementChange('height', Number(e.target.value) || 50)}/></div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="layout-el-rotation">Rotación ({currentLayoutElement.rotation || 0}°)</Label>
                <Slider id="layout-el-rotation" min={0} max={360} step={1} value={[currentLayoutElement.rotation || 0]} onValueChange={(val) => handleLayoutElementChange('rotation', val[0])}/>
              </div>
            </div>
          )}
          <SheetFooter className="gap-2">
            {currentLayoutElement?.id && <Button variant="destructive" size="sm" onClick={() => {handleDeleteLayoutElement(currentLayoutElement!.id!); setIsElementSheetOpen(false);}}><Trash2 className="w-4 h-4 mr-2"/>Eliminar del Plano</Button>}
            <Button variant="outline" onClick={() => setIsElementSheetOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveLayoutElement}>Guardar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><LayoutDashboard className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Diseño del Salón y Mesas</h1></div>
        <Link href="/fiestas/nueva/invitados" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver a Invitados</Button></Link>
      </div>

       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Settings2 className="text-primary"/>Modo de Disposición</CardTitle>
            <CardDescription>Elige cómo quieres organizar las mesas y a tus invitados.</CardDescription>
          </CardHeader>
          <CardContent>
             <RadioGroup 
                value={decoracionData.layoutMode || 'libre'} 
                onValueChange={(value) => handleInputChange('layoutMode', value as 'libre' | 'asignado')}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <Label htmlFor="mode-libre" className={`p-4 border-2 rounded-lg cursor-pointer ${decoracionData.layoutMode === 'libre' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center space-x-2 mb-2"><RadioGroupItem value="libre" id="mode-libre" /><span className="font-semibold text-base">Mesas Libres</span></div>
                    <p className="text-sm text-muted-foreground ml-6">Ideal para fiestas informales. Diseña la disposición del salón sin asignar invitados a mesas específicas.</p>
                </Label>
                <Label htmlFor="mode-asignado" className={`p-4 border-2 rounded-lg cursor-pointer ${decoracionData.layoutMode === 'asignado' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center space-x-2 mb-2"><RadioGroupItem value="asignado" id="mode-asignado" /><span className="font-semibold text-base">Mesas Asignadas</span></div>
                    <p className="text-sm text-muted-foreground ml-6">Para eventos formales. Sincroniza con la lista de invitados para ver quién se sienta en cada mesa y exportar planos.</p>
                </Label>
            </RadioGroup>
          </CardContent>
       </Card>

      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Diseñador del Salón</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-56 p-3 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold text-sm mb-3">Añadir Elementos</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {PALETTE_ITEMS.map(item => (
                            <Button key={item.category} variant="outline" className="h-auto flex-col p-2 gap-1" onClick={() => addElementFromPalette(item.category, item.default)}>
                                <item.icon className="w-5 h-5"/>
                                <span className="text-xs text-center">{item.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="relative flex-1 w-full h-[500px] border-2 border-dashed rounded-lg bg-muted/30 overflow-hidden canvas-grid-background">
                    {decoracionData.salonPlanBackgroundImageUrl && !failedImageUrls['salonPlanBackgroundImageUrl'] && (
                        <NextImage 
                        src={decoracionData.salonPlanBackgroundImageUrl} 
                        alt="Plano del Salón" 
                        layout="fill" 
                        objectFit="contain" 
                        onError={() => setFailedImageUrls(p => ({...p, salonPlanBackgroundImageUrl: true}))}
                        data-ai-hint="event floor plan"
                        />
                    )}
                    {(decoracionData.salonElements || []).map(element => (
                        <DraggableLayoutElement
                            key={element.id}
                            element={element}
                            layoutMode={decoracionData.layoutMode}
                            invitados={invitados}
                            onDragStop={handleDragStop}
                            onDoubleClick={openElementSheet}
                        />
                    ))}
                </div>
            </div>
            <div className="flex justify-between items-start pt-2 gap-2 flex-wrap">
                 <Link href="/fiestas/nueva/decoracion/pdf?layout=true" passHref>
                    <Button type="button" variant="secondary" size="sm">
                        <Printer className="w-4 h-4 mr-1.5"/>Imprimir Plano con Nombres
                    </Button>
                </Link>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Pointer className="w-3.5 h-3.5"/> Haz doble clic en un elemento para editarlo.</p>
            </div>
          </CardContent>
      </Card>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSaveLayout} disabled={isSaving || isLoading} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          {isSaving ? 'Guardando Diseño...' : 'Guardar Diseño del Salón'}
        </Button>
      </div>
    </div>
  );
}
