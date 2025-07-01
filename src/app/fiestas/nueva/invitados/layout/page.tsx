

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import Draggable, { type DraggableEvent, type DraggableData } from 'react-draggable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, AlertTriangle, PlusCircle, Settings2, LayoutDashboard, Printer, Trash2, Pointer, Move, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, DecoracionData, LayoutElement, Invitado } from '@/types/fiesta';
import { defaultDecoracion, ALL_LAYOUT_ELEMENT_CATEGORIES } from '@/lib/fiesta-defaults';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function SalonLayoutPage() {
  const { toast } = useToast();
  const [decoracionData, setDecoracionData] = useState<DecoracionData>(defaultDecoracion);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isLayoutElementModalOpen, setIsLayoutElementModalOpen] = useState(false);
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
    // We only save the part of decoracionData that relates to layout
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

  const openLayoutElementModal = (element?: LayoutElement) => {
    setCurrentLayoutElement(element || { name: '', width: 50, height: 50, x: 50, y: 50, rotation: 0, quantity: 1, type: 'custom', category: 'Otro' });
    setIsLayoutElementModalOpen(true);
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
    setIsLayoutElementModalOpen(false);
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
        <Dialog open={isLayoutElementModalOpen} onOpenChange={setIsLayoutElementModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-headline">{currentLayoutElement?.id ? 'Editar' : 'Añadir'} Elemento al Plano</DialogTitle></DialogHeader>
          {currentLayoutElement && (
            <div className="py-2 space-y-3">
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
              <div className="grid grid-cols-3 gap-2">
                 <div className="space-y-1"><Label htmlFor="layout-el-qty">Cant.</Label><Input id="layout-el-qty" type="number" value={currentLayoutElement.quantity || 1} onChange={(e) => handleLayoutElementChange('quantity', Number(e.target.value) || 1)} min="1"/></div>
                 <div className="space-y-1"><Label htmlFor="layout-el-w">Ancho (px)</Label><Input id="layout-el-w" type="number" value={currentLayoutElement.width || 50} onChange={(e) => handleLayoutElementChange('width', Number(e.target.value) || 50)}/></div>
                 <div className="space-y-1"><Label htmlFor="layout-el-h">Alto (px)</Label><Input id="layout-el-h" type="number" value={currentLayoutElement.height || 50} onChange={(e) => handleLayoutElementChange('height', Number(e.target.value) || 50)}/></div>
              </div>
              {currentLayoutElement.id && <Button variant="destructive" size="sm" onClick={() => {handleDeleteLayoutElement(currentLayoutElement!.id!); setIsLayoutElementModalOpen(false);}}><Trash2 className="w-4 h-4 mr-2"/>Eliminar del Plano</Button>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setIsLayoutElementModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveLayoutElement}>Guardar Elemento</Button></DialogFooter>
        </DialogContent>
      </Dialog>
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
            <div className="space-y-2">
                <Label htmlFor="salon-plan-bg">URL Imagen de Fondo para Plano del Salón</Label>
                <Input id="salon-plan-bg" type="url" value={decoracionData.salonPlanBackgroundImageUrl || ''} onChange={e => handleInputChange('salonPlanBackgroundImageUrl', e.target.value)} placeholder="https://ejemplo.com/plano_salon.png"/>
            </div>
            
            <div className="relative w-full h-[500px] border-2 border-dashed rounded-lg bg-muted/30 overflow-hidden canvas-grid-background">
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
                {(decoracionData.salonElements || []).map(element => {
                    const assignedGuests = decoracionData.layoutMode === 'asignado' 
                        ? invitados.filter(inv => inv.tableNumber === element.name) 
                        : [];
                    
                    const trigger = (
                        <div 
                          className="absolute p-1 border border-primary bg-primary/20 rounded text-primary-foreground text-xs text-center flex flex-col items-center justify-center cursor-move shadow-lg"
                          style={{ width: element.width, height: element.height }}
                          onDoubleClick={() => openLayoutElementModal(element)}
                        >
                          <Move className="w-3 h-3 absolute top-0.5 right-0.5 opacity-50"/>
                          <span className="truncate w-full font-semibold">{element.name}</span>
                           {decoracionData.layoutMode === 'asignado' && <span className="text-xs opacity-80 flex items-center gap-1"><Users className="w-3 h-3"/>{assignedGuests.length}</span>}
                        </div>
                    );

                    return (
                      <Draggable
                        key={element.id}
                        bounds="parent"
                        position={{x: element.x, y: element.y}}
                        onStop={(e, data) => handleDragStop(e, data, element.id)}
                      >
                         {decoracionData.layoutMode === 'asignado' ? (
                            <Popover>
                                <PopoverTrigger asChild>{trigger}</PopoverTrigger>
                                <PopoverContent className="w-64 p-2">
                                    <div className="font-bold text-sm mb-2">{element.name}</div>
                                    {assignedGuests.length > 0 ? (
                                        <ul className="text-xs space-y-1">
                                            {assignedGuests.map(g => <li key={g.id}>{g.nombre} {g.partySize && g.partySize > 1 ? `(+${g.partySize - 1})` : ''}</li>)}
                                        </ul>
                                    ) : <p className="text-xs text-muted-foreground">No hay invitados asignados.</p>}
                                </PopoverContent>
                            </Popover>
                         ) : trigger}
                      </Draggable>
                    )
                })}
            </div>
            <div className="flex justify-between items-start pt-2 gap-2 flex-wrap">
                 <Button type="button" onClick={() => openLayoutElementModal()}>
                    <PlusCircle className="w-4 h-4 mr-2"/> Añadir Elemento al Plano
                </Button>
                {decoracionData.layoutMode === 'asignado' && (
                  <div className="flex gap-2">
                     <Link href="/fiestas/nueva/decoracion/pdf?layout=true" passHref>
                        <Button type="button" variant="secondary" size="sm">
                          <Printer className="w-4 h-4 mr-1.5"/>Imprimir Plano con Nombres
                        </Button>
                      </Link>
                  </div>
                )}
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
