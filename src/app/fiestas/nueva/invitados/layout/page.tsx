
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Music, Beer, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Image as ImageIcon, Maximize, Minimize, FolderUp, Wand2, Settings2, FolderDown, Sofa, Disc, Clapperboard } from 'lucide-react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, Invitado, DecoracionData } from '@/types/fiesta';
import { getFiestaActual, updateDecoracionFiestaActual, updateInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { Separator } from '@/components/ui/separator';
import { getSalonLayoutTemplates, saveSalonLayoutTemplate, type SalonLayoutTemplate } from '@/app/actions/salon-layout-templates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const grid = 20;

export default function SalonLayoutPage() {
  const { toast } = useToast();
  const [decoracion, setDecoracion] = useState<DecoracionData | null>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<LayoutElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<SalonLayoutTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (showLoading = true) => {
    if(showLoading) setIsLoading(true);
    try {
      const fiesta = await getFiestaActual();
      setDecoracion(fiesta.decoracion || { salonElements: [], salonWidth: 20, salonHeight: 30, pixelsPerMeter: 30, layoutMode: 'asignado' });
      setInvitados(fiesta.invitados || []);
    } catch (e: any) {
      setError("No se pudo cargar la información del evento.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      if(showLoading) setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    if (typeof document !== 'undefined') {
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
  }, []);

  const handleDragStop = (e: DraggableEvent, data: DraggableData, elementId: string) => {
    if (!decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el =>
      el.id === elementId ? { ...el, x: Math.round(data.x / grid) * grid, y: Math.round(data.y / grid) * grid } : el
    );
    setDecoracion({ ...decoracion, salonElements: newElements });
  };
  
  const addElement = (category: string) => {
    if (!decoracion) return;
    let newElement: LayoutElement;
    const defaultSeats = category.includes('Mesa') ? 8 : undefined;
    
    let width = 120;
    let height = 120;
    if(category === 'Mesa Redonda') { width = 100; height = 100; }
    else if(category === 'Mesa Rectangular') { width = 120; height = 60; }
    else if(category === 'Pista de Baile') { width = 200; height = 200; }
    else if(category === 'Escenario') { width = 200; height = 100; }

    newElement = {
      id: `el_${Date.now()}`,
      name: `${category} ${ (decoracion.salonElements?.filter(e => e.category === category).length || 0) + 1}`,
      x: 20, y: 20,
      width, height, rotation: 0,
      type: 'predefined', category: category, seats: defaultSeats,
    };
    setDecoracion({ ...decoracion, salonElements: [...(decoracion.salonElements || []), newElement] });
  };

  const handleOpenEditModal = (element: LayoutElement) => {
    setEditingElement(element);
    setIsEditModalOpen(true);
  };

  const handleUpdateElement = () => {
    if (!editingElement || !decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el => el.id === editingElement.id ? editingElement : el);
    setDecoracion({ ...decoracion, salonElements: newElements });
    setIsEditModalOpen(false);
    setEditingElement(null);
  };
  
  const handleElementRotation = (elementId: string) => {
    if (!decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el => {
      if (el.id === elementId) {
        return { ...el, rotation: (el.rotation + 45) % 360 };
      }
      return el;
    });
    setDecoracion({ ...decoracion, salonElements: newElements });
  };

  const handleDeleteElement = (elementId: string) => {
    if (!decoracion) return;
    setDecoracion({
      ...decoracion,
      salonElements: (decoracion.salonElements || []).filter(el => el.id !== elementId)
    });
  };
  
  const handleGuestDrop = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    if(decoracion?.layoutMode === 'libre') return;

    const guestId = e.dataTransfer.getData('guestId');
    const table = decoracion?.salonElements?.find(el => el.id === tableId);
    
    if (!table || table.seats === undefined) return;

    const guestsAtTable = invitados.filter(i => i.tableNumber === table?.name).reduce((acc, g) => acc + (g.partySize || 1), 0);
    const guestBeingDragged = invitados.find(i => i.id === guestId);
    const guestPartySize = guestBeingDragged?.partySize || 1;

    if (table && table.seats !== undefined && (guestsAtTable + guestPartySize) > table.seats) {
      toast({ title: "Mesa Llena", description: `La mesa "${table.name}" no tiene suficientes asientos para este grupo.`, variant: "destructive" });
      return;
    }

    setInvitados(prev => prev.map(inv => inv.id === guestId ? { ...inv, tableNumber: table?.name || undefined } : inv));
  };
  
  const handleSaveAssignments = async () => {
    if (!decoracion) return;
    setIsSaving(true);
    try {
        const updateGuestPromises = invitados.map(invitado => updateInvitadoFiestaActual(invitado));
        await Promise.all(updateGuestPromises);
        
        const decoracionToSave = { ...decoracion, items: decoracion.items || [] };
        await updateDecoracionFiestaActual(decoracionToSave);

        toast({ title: "¡Guardado!", description: "La distribución del salón y la asignación de invitados han sido guardadas." });
        await loadData(false);
    } catch(err: any) {
        toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleSaveAsTemplate = async () => {
    if(!templateName.trim() || !decoracion) return;
    setIsSaving(true);
    try {
        const result = await saveSalonLayoutTemplate(templateName, decoracion);
        if (result.success) {
            toast({ title: "Plantilla Guardada", description: `El diseño "${templateName}" ha sido guardado.`});
            setIsSaveTemplateModalOpen(false);
        } else {
            throw new Error(result.error || "No se pudo guardar la plantilla.");
        }
    } catch (err: any) {
        toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleLoadTemplate = async () => {
    setIsLoadingTemplates(true);
    setIsLoadTemplateModalOpen(true);
    try {
        const data = await getSalonLayoutTemplates();
        setTemplates(data);
    } catch (e) {
        toast({ title: "Error", description: "No se pudieron cargar las plantillas." });
    } finally {
        setIsLoadingTemplates(false);
    }
  }

  const applyTemplate = (template: SalonLayoutTemplate) => {
    if(!template.layoutData) return;
    setDecoracion(prev => prev ? ({...prev, ...template.layoutData}) : null);
    setIsLoadTemplateModalOpen(false);
    toast({ title: `Plantilla "${template.name}" aplicada.` });
  }
  
  const handleFullscreenToggle = () => {
    if (!canvasRef.current) return;
    if (isFullscreen) {
      if (typeof document !== 'undefined') document.exitFullscreen();
    } else {
      canvasRef.current.requestFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const invitadosConfirmados = useMemo(() => invitados.filter(i => i.rsvp === 'Confirmado'), [invitados]);
  const invitadosSinMesa = useMemo(() => invitadosConfirmados.filter(i => !i.tableNumber), [invitadosConfirmados]);

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-destructive text-center p-4">{error}</div>;
  if (!decoracion) return null;
  
  const pixelsPerMeter = decoracion.pixelsPerMeter || 30;
  const salonWidthPx = (decoracion.salonWidth || 20) * pixelsPerMeter;
  const salonHeightPx = (decoracion.salonHeight || 30) * pixelsPerMeter;


  return (
    <div className="space-y-6">
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Elemento: {editingElement?.name}</DialogTitle>
          </DialogHeader>
          {editingElement && (
            <div className="space-y-4">
              <div className="space-y-1"><Label htmlFor="el-name">Nombre</Label><Input id="el-name" value={editingElement.name} onChange={e => setEditingElement(prev => prev ? {...prev, name: e.target.value} : null)}/></div>
              {editingElement.category?.includes('Mesa') && <div className="space-y-1"><Label htmlFor="el-seats">Asientos</Label><Input id="el-seats" type="number" value={editingElement.seats || 0} onChange={e => setEditingElement(prev => prev ? {...prev, seats: Number(e.target.value) || 0} : null)}/></div>}
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1"><Label htmlFor="el-width">Ancho (px)</Label><Input id="el-width" type="number" value={editingElement.width || 0} onChange={e => setEditingElement(prev => prev ? {...prev, width: Number(e.target.value) || 0} : null)}/></div>
                 <div className="space-y-1"><Label htmlFor="el-height">Alto (px)</Label><Input id="el-height" type="number" value={editingElement.height || 0} onChange={e => setEditingElement(prev => prev ? {...prev, height: Number(e.target.value) || 0} : null)}/></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateElement}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isLoadTemplateModalOpen} onOpenChange={setIsLoadTemplateModalOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>Cargar Diseño desde Plantilla</DialogTitle></DialogHeader>
              {isLoadingTemplates ? <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin"/></div> : (
                  <ScrollArea className="h-72">
                      <ul className="space-y-2 pr-3">
                          {templates.map(t => (
                              <li key={t.id} className="flex justify-between items-center p-2 border rounded-md">
                                  <span>{t.name}</span>
                                  <Button size="sm" onClick={() => applyTemplate(t)}>Cargar</Button>
                              </li>
                          ))}
                      </ul>
                  </ScrollArea>
              )}
          </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><LayoutDashboard className="w-8 h-8 text-primary"/>Diseño de Mesas y Salón</h1>
        <Link href="/fiestas/nueva/invitados" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver a Invitados</Button></Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div ref={canvasRef} className={cn("lg:col-span-2 bg-white transition-all duration-300", isFullscreen && "fixed inset-0 z-50 p-4")}>
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Lienzo del Salón</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleFullscreenToggle}>
                  {isFullscreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5"/>}
                </Button>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="relative border rounded-lg bg-muted/30 overflow-auto canvas-grid-background h-full">
                <div style={{ width: `${salonWidthPx}px`, height: `${salonHeightPx}px`}} className="relative">
                  {decoracion.salonPlanBackgroundImageUrl && (
                      <NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50" data-ai-hint="event floor plan"/>
                  )}
                  {(decoracion.salonElements || []).map(el => {
                    const guestsAtTable = invitados.filter(i => i.tableNumber === el.name);
                    const seatsTaken = guestsAtTable.reduce((acc, g) => acc + (g.partySize || 1), 0);
                    const isFull = el.seats !== undefined && seatsTaken >= el.seats;
                    const nodeRef = React.createRef<HTMLDivElement>();
                    return (
                      <Draggable
                        key={el.id}
                        nodeRef={nodeRef}
                        bounds="parent"
                        grid={[grid, grid]}
                        position={{ x: el.x, y: el.y }}
                        onStop={(e, data) => handleDragStop(e, data, el.id)}
                      >
                        <div 
                          ref={nodeRef}
                          id={el.id}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => handleGuestDrop(e, el.id)}
                          className={cn(
                            'absolute border-2 flex flex-col items-center justify-center p-1 cursor-grab active:cursor-grabbing',
                            el.category?.includes('Mesa Redonda') ? 'rounded-full' : 'rounded-md',
                            selectedElementId === el.id ? 'border-primary shadow-lg z-10' : 'border-gray-500 bg-white/80'
                          )}
                          style={{ width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`}}
                          onClick={() => setSelectedElementId(el.id)}
                        >
                          <p className="text-xs font-bold text-center truncate px-1">{el.name}</p>
                          {el.seats !== undefined && <p className={`text-xs ${isFull ? 'font-bold text-destructive' : 'text-muted-foreground'}`}>{seatsTaken} / {el.seats}</p>}
                          {guestsAtTable.length > 0 && (
                              <ul className="text-[8px] list-disc list-inside mt-1 overflow-y-auto max-h-12">
                                {guestsAtTable.map(g => <li key={g.id} className="truncate">{g.nombre} ({g.partySize || 1})</li>)}
                              </ul>
                          )}
                          {selectedElementId === el.id && (
                              <div className="absolute -top-7 -right-2 flex gap-0.5 z-20" style={{transform: `rotate(-${el.rotation}deg)`}}>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenEditModal(el)}><Edit className="w-3 h-3"/></Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleElementRotation(el.id)}><RotateCw className="w-3 h-3"/></Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteElement(el.id)}><Trash2 className="w-3 h-3"/></Button>
                              </div>
                          )}
                        </div>
                      </Draggable>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Controles del Lienzo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1"><Label htmlFor="salon-width">Ancho (m)</Label><Input id="salon-width" type="number" value={decoracion.salonWidth || 20} onChange={e => setDecoracion(d => d ? {...d, salonWidth: Number(e.target.value)}: null)} /></div>
                <div className="space-y-1"><Label htmlFor="salon-height">Alto (m)</Label><Input id="salon-height" type="number" value={decoracion.salonHeight || 30} onChange={e => setDecoracion(d => d ? {...d, salonHeight: Number(e.target.value)}: null)} /></div>
                <div className="space-y-1"><Label htmlFor="salon-scale">Escala (px/m)</Label><Input id="salon-scale" type="number" value={decoracion.pixelsPerMeter || 30} onChange={e => setDecoracion(d => d ? {...d, pixelsPerMeter: Number(e.target.value)}: null)} /></div>
               </div>
               <div className="space-y-2"><Label htmlFor="salon-bg">URL Imagen de Fondo</Label><Input id="salon-bg" type="url" value={decoracion.salonPlanBackgroundImageUrl || ''} onChange={e => setDecoracion(d => d ? {...d, salonPlanBackgroundImageUrl: e.target.value}: null)} placeholder="https://ejemplo.com/plano.png"/></div>
               <Separator className="my-4"/>
              <h4 className="font-medium text-sm">Añadir Elementos</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => addElement('Mesa Redonda')}><Circle className="w-4 h-4 mr-2"/>Mesa Redonda</Button>
                <Button variant="outline" onClick={() => addElement('Mesa Rectangular')}><Square className="w-4 h-4 mr-2"/>Mesa Rectangular</Button>
                <Button variant="outline" onClick={() => addElement('Pista de Baile')}><Music className="w-4 h-4 mr-2"/>Pista</Button>
                <Button variant="outline" onClick={() => addElement('Barra')}><Beer className="w-4 h-4 mr-2"/>Barra</Button>
                <Button variant="outline" onClick={() => addElement('Cabina DJ')}><Disc className="w-4 h-4 mr-2"/>Cabina DJ</Button>
                <Button variant="outline" onClick={() => addElement('Escenario')}><Clapperboard className="w-4 h-4 mr-2"/>Escenario</Button>
                <Button variant="outline" onClick={() => addElement('Living')}><Sofa className="w-4 h-4 mr-2"/>Living</Button>
                <Button variant="outline" onClick={() => addElement('Área de Fotos')}><Camera className="w-4 h-4 mr-2"/>Área Fotos</Button>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="button" onClick={handleLoadTemplate} variant="outline" className="w-full"><FolderDown className="w-4 h-4 mr-2"/>Cargar Plantilla</Button>
                <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" className="w-full"><FolderUp className="w-4 h-4 mr-2"/>Guardar Diseño como Plantilla</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Guardar Diseño como Plantilla</DialogTitle></DialogHeader>
                        <div className="space-y-2 py-2"><Label htmlFor="template-name">Nombre de la Plantilla</Label><Input id="template-name" value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Ej: Club Uruguay - 80 invitados"/></div>
                        <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSaveAsTemplate} disabled={isSaving}>Guardar</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
                <Link href="/settings/templates/layouts" passHref><Button variant="link" size="sm">Gestionar Plantillas</Button></Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Asignación de Invitados</CardTitle>
                <CardDescription>Selecciona el modo de asignación de mesas.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup 
                    value={decoracion.layoutMode || 'asignado'} 
                    onValueChange={(value) => setDecoracion(d => d ? {...d, layoutMode: value as any}: null)}
                    className="space-y-2"
                >
                    <div className="flex items-center space-x-2"><RadioGroupItem value="numerado" id="mode-numerado"/><Label htmlFor="mode-numerado">Numerado</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="mixto" id="mode-mixto"/><Label htmlFor="mode-mixto">Mixto (Numerado y Libre)</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="libre" id="mode-libre"/><Label htmlFor="mode-libre">Libre</Label></div>
                </RadioGroup>
                
                {decoracion.layoutMode !== 'libre' && (
                    <>
                        <Separator className="my-4"/>
                        <p className="text-sm text-muted-foreground mb-2">Arrastra un invitado a una mesa para asignarlo.</p>
                        <ScrollArea className="h-96 border rounded-md p-2">
                            <ul className="space-y-2">
                            {invitadosSinMesa.map(inv => (
                                <li key={inv.id} draggable onDragStart={e => e.dataTransfer.setData('guestId', inv.id)} className="p-2 border rounded bg-background cursor-grab"><p className="font-medium text-sm">{inv.nombre}</p><p className="text-xs text-muted-foreground">{inv.partySize || 1} persona(s)</p></li>
                            ))}
                            {invitadosSinMesa.length === 0 && <p className="text-sm text-center text-muted-foreground p-4">Todos los invitados confirmados tienen una mesa.</p>}
                            </ul>
                        </ScrollArea>
                    </>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
       <div className="flex justify-end mt-6">
            <Button size="lg" onClick={handleSaveAssignments} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Asignaciones y Diseño'}
            </Button>
        </div>
    </div>
  );
}
