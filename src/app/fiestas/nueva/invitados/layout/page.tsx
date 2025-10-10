
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Music, Beer, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Image as ImageIcon, Maximize, Minimize, FolderUp, Wand2, Settings2, FolderDown } from 'lucide-react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, Invitado, DecoracionData } from '@/types/fiesta';
import { getFiestaActual, updateDecoracionFiestaActual, updateInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { Separator } from '@/components/ui/separator';
import { assignGuestsToTables, type AssignGuestsInput } from '@/ai/flows/assign-guests-flow';
import { getSalonLayoutTemplates, saveSalonLayoutTemplate, type SalonLayoutTemplate } from '@/app/actions/salon-layout-templates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";
import { Switch } from '@/components/ui/switch';

const grid = 20;

export default function SalonLayoutPage() {
  const { toast } = useToast();
  const [decoracion, setDecoracion] = useState<DecoracionData | null>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isAssigningWithAI, setIsAssigningWithAI] = useState(false);
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
  
  const [generatorGuestCount, setGeneratorGuestCount] = useState<number>(100);
  const [generatorSeatsPerTable, setGeneratorSeatsPerTable] = useState<number>(8);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);


  const loadData = useCallback(async (showLoading = true) => {
    if(showLoading) setIsLoading(true);
    try {
      const fiesta = await getFiestaActual();
      setDecoracion(fiesta.decoracion || { salonElements: [], salonWidth: 800, salonHeight: 600, layoutMode: 'asignado' });
      setInvitados(fiesta.invitados || []);
      setGeneratorGuestCount(fiesta.configuracion?.invitadosEstimados ? Number(fiesta.configuracion.invitadosEstimados) : 100);
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
    const newElement: LayoutElement = {
      id: `el_${Date.now()}`,
      name: `${category} ${ (decoracion.salonElements?.filter(e => e.category === category).length || 0) + 1}`,
      x: 20, y: 20,
      width: category.includes('Mesa') ? 100 : 120,
      height: category.includes('Mesa Redonda') ? 100 : (category.includes('Mesa Rectangular') ? 60 : 100),
      rotation: 0,
      quantity: 1,
      type: 'predefined',
      category: category,
      seats: category.includes('Mesa') ? 8 : undefined,
    };
    setDecoracion({ ...decoracion, salonElements: [...(decoracion.salonElements || []), newElement] });
  };
  
  const handleGenerateTables = () => {
      if(!decoracion || generatorGuestCount <= 0 || generatorSeatsPerTable <= 0) return;
      const tablesNeeded = Math.ceil(generatorGuestCount / generatorSeatsPerTable);
      const newTables: LayoutElement[] = [];
      
      const canvasWidth = decoracion.salonWidth || 800;
      const padding = 40;
      const tableSize = 100;
      const tableSpacing = 40;
      let x = padding;
      let y = padding;

      for (let i = 0; i < tablesNeeded; i++) {
        newTables.push({
            id: `auto_table_${Date.now()}_${i}`,
            name: `Mesa ${i + 1}`,
            x: x, y: y,
            width: tableSize, height: tableSize,
            rotation: 0,
            quantity: 1,
            type: 'predefined',
            category: 'Mesa Redonda',
            seats: generatorSeatsPerTable
        });
        
        x += tableSize + tableSpacing;
        if(x + tableSize > canvasWidth - padding) {
            x = padding;
            y += tableSize + tableSpacing;
        }
      }

      setDecoracion({
          ...decoracion,
          salonElements: newTables,
      });
      setIsGenerateConfirmOpen(false);
  }

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
        // Save guest assignments
        const updateGuestPromises = invitados.map(invitado => updateInvitadoFiestaActual(invitado));
        await Promise.all(updateGuestPromises);
        
        // Also save the salon layout itself as it might have changed
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
  
   const handleAIAssign = async () => {
    if (!decoracion?.salonElements || decoracion.salonElements.length === 0) {
      toast({ title: "No hay mesas", description: "Añade mesas al salón antes de usar la asignación automática.", variant: "destructive"});
      return;
    }
    const guestsToAssign = invitados.filter(i => i.rsvp === 'Confirmado');
    if (guestsToAssign.length === 0) {
      toast({ title: "No hay invitados", description: "No hay invitados confirmados para asignar a las mesas.", variant: "destructive"});
      return;
    }

    setIsAssigningWithAI(true);
    try {
      const input: AssignGuestsInput = {
        guests: guestsToAssign,
        tables: decoracion.salonElements
          .filter(el => el.category?.includes('Mesa') && el.seats)
          .map(el => ({ id: el.id, name: el.name, seats: el.seats || 0 })),
      };
      const result = await assignGuestsToTables(input);
      
      if(result.assignments) {
        const updatedGuestMap = new Map(result.assignments.map(g => [g.id, g.tableNumber]));
        setInvitados(prev => prev.map(inv => updatedGuestMap.has(inv.id) ? { ...inv, tableNumber: updatedGuestMap.get(inv.id) || undefined } : inv ));
        toast({title: "¡Asignación completa!", description: "Los invitados han sido asignados a las mesas por la IA. Revisa y ajusta si es necesario."});
      } else {
        throw new Error("La IA no devolvió ninguna asignación.");
      }

    } catch(e: any) {
      toast({ title: "Error de IA", description: e.message, variant: "destructive" });
    } finally {
      setIsAssigningWithAI(false);
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
                <div style={{ width: `${decoracion.salonWidth || 800}px`, height: `${decoracion.salonHeight || 600}px`}} className="relative">
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
            <CardHeader><CardTitle>Controles</CardTitle></CardHeader>
            <CardContent>
                 <AlertDialog open={isGenerateConfirmOpen} onOpenChange={setIsGenerateConfirmOpen}>
                 <div className="p-3 border rounded-md bg-muted/20">
                      <h4 className="font-medium text-sm mb-3">Asistente de Configuración Rápida</h4>
                      <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1"><Label htmlFor="gen-guests">Total de Invitados</Label><Input id="gen-guests" type="number" value={generatorGuestCount} onChange={e => setGeneratorGuestCount(Number(e.target.value) || 0)}/></div>
                           <div className="space-y-1"><Label htmlFor="gen-seats">Asientos por Mesa</Label><Input id="gen-seats" type="number" value={generatorSeatsPerTable} onChange={e => setGeneratorSeatsPerTable(Number(e.target.value) || 0)}/></div>
                      </div>
                     <AlertDialogTrigger asChild><Button type="button" className="w-full mt-3">Generar Mesas</Button></AlertDialogTrigger>
                </div>
                 <AlertDialogContent>
                   <AlertDialogHeader><AlertDialogTitle>Confirmar Generación de Mesas</AlertDialogTitle><AlertDialogDescription>Esta acción reemplazará todos los elementos actuales del salón con una nueva distribución automática. ¿Deseas continuar?</AlertDialogDescription></AlertDialogHeader>
                   <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleGenerateTables}>Sí, generar</AlertDialogAction></AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>

               <Separator className="my-4"/>
              <h4 className="font-medium text-sm">Añadir Elementos Manualmente</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => addElement('Mesa Redonda')}><Circle className="w-4 h-4 mr-2"/>Mesa Redonda</Button>
                <Button variant="outline" onClick={() => addElement('Mesa Rectangular')}><Square className="w-4 h-4 mr-2"/>Mesa Rectangular</Button>
                <Button variant="outline" onClick={() => addElement('Pista de Baile')}><Music className="w-4 h-4 mr-2"/>Pista</Button>
                <Button variant="outline" onClick={() => addElement('Barra')}><Beer className="w-4 h-4 mr-2"/>Barra</Button>
              </div>
               <Separator className="my-4"/>
               <div className="space-y-2"><Label htmlFor="salon-width">Ancho del Salón (px)</Label><Input id="salon-width" type="number" value={decoracion.salonWidth || 800} onChange={e => setDecoracion(d => d ? {...d, salonWidth: Number(e.target.value)}: null)} /></div>
               <div className="space-y-2"><Label htmlFor="salon-height">Alto del Salón (px)</Label><Input id="salon-height" type="number" value={decoracion.salonHeight || 600} onChange={e => setDecoracion(d => d ? {...d, salonHeight: Number(e.target.value)}: null)} /></div>
               <div className="space-y-2"><Label htmlFor="salon-bg">URL Imagen de Fondo</Label><Input id="salon-bg" type="url" value={decoracion.salonPlanBackgroundImageUrl || ''} onChange={e => setDecoracion(d => d ? {...d, salonPlanBackgroundImageUrl: e.target.value}: null)} placeholder="https://ejemplo.com/plano.png"/></div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="button" onClick={handleLoadTemplate} variant="outline" className="w-full"><FolderDown className="w-4 h-4 mr-2"/>Cargar Plantilla</Button>
                <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" className="w-full">
                            <FolderUp className="w-4 h-4 mr-2"/>Guardar Diseño como Plantilla
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Guardar Diseño como Plantilla</DialogTitle></DialogHeader>
                        <div className="space-y-2 py-2"><Label htmlFor="template-name">Nombre de la Plantilla</Label><Input id="template-name" value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Ej: Club Uruguay - 80 invitados"/></div>
                        <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSaveAsTemplate} disabled={isSaving}>Guardar</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
                <Link href="/settings/templates/layouts" passHref><Button variant="link" size="sm">Gestionar Plantillas Guardadas</Button></Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Asignación de Invitados</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="layout-mode" className="text-sm">Asignación Libre</Label>
                        <Switch id="layout-mode" checked={decoracion.layoutMode === 'libre'} onCheckedChange={(checked) => setDecoracion(d => d ? {...d, layoutMode: checked ? 'libre' : 'asignado'} : null)} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
               {decoracion.layoutMode === 'asignado' ? (
                <>
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
               ) : (
                <div className="text-center text-muted-foreground p-4 bg-muted/40 rounded-md">
                    <p className="text-sm">El modo de Asignación Libre está activado. Los invitados no se asignan a mesas específicas.</p>
                </div>
               )}
            </CardContent>
            {decoracion.layoutMode === 'asignado' && (
                <CardFooter>
                    <Button className="w-full" onClick={handleAIAssign} disabled={isAssigningWithAI}>
                        {isAssigningWithAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Wand2 className="w-4 h-4 mr-2"/>}
                        {isAssigningWithAI ? 'Asignando...' : 'Asignar Invitados con IA'}
                    </Button>
                </CardFooter>
            )}
          </Card>
        </div>
      </div>
       <div className="flex justify-end mt-6">
            <Button size="lg" onClick={handleSaveAssignments} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Asignaciones de Invitados'}
            </Button>
        </div>
    </div>
  );
}
