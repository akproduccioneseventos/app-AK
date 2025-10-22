'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Disc, Clapperboard, Sofa, Camera as CameraIcon, Search, Printer, Settings2, FolderDown, FolderUp, Maximize, ZoomIn, ZoomOut } from 'lucide-react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, Invitado, DecoracionData } from '@/types/fiesta';
import { getFiestaById, updateInvitadoFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { saveSalonLayoutTemplate, getSalonLayoutTemplates, type SalonLayoutTemplate } from '@/app/actions/salon-layout-templates';

const grid = 10;

const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[names.length - 1]) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

function SalonLayoutContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [decoracion, setDecoracion] = useState<DecoracionData | null>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<LayoutElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [isCustomElementModalOpen, setIsCustomElementModalOpen] = useState(false);
  const [customElement, setCustomElement] = useState({ name: '', category: 'Varios', width: 100, height: 100, shape: 'rectangle' });
  
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<SalonLayoutTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [isTemplateActionLoading, setIsTemplateActionLoading] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const loadData = useCallback(async (showLoading = true) => {
    if (!fiestaId) return;
    if(showLoading) setIsLoading(true);
    try {
      const fiesta = await getFiestaById(fiestaId);
      if (!fiesta) throw new Error("Fiesta no encontrada.");
      
      const loadedDecoracion = fiesta.decoracion || { salonElements: [], salonWidth: 20, salonHeight: 30, pixelsPerMeter: 30 };
      
      setDecoracion(loadedDecoracion);
      setInvitados(fiesta.invitados || []);

    } catch (e: any) {
      setError("No se pudo cargar la información del evento.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      if(showLoading) setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    if (!fiestaId) {
      toast({title: "Error", description: "No se ha especificado un ID de fiesta."});
      router.push('/eventos');
    } else {
        loadData();
    }
  }, [fiestaId, loadData, router, toast]);
  
  const handleDragStop = (e: DraggableEvent, data: DraggableData, elementId: string) => {
    if (!decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el =>
      el.id === elementId ? { ...el, x: Math.round(data.x / grid) * grid, y: Math.round(data.y / grid) * grid } : el
    );
    setDecoracion({ ...decoracion, salonElements: newElements });
  };
  
  const addElement = (category: string, customProps?: Partial<LayoutElement>) => {
    if (!decoracion) return;
    const defaultProps: Partial<LayoutElement> = { width: 120, height: 120, seats: category.toLowerCase().includes('mesa') ? 8 : undefined };
    if (category === 'Mesa Redonda') { defaultProps.width = 120; defaultProps.height = 120; }
    else if (category === 'Mesa Rectangular') { defaultProps.width = 180; defaultProps.height = 80; }
    else if (category === 'Pista de Baile') { defaultProps.width = 240; defaultProps.height = 240; defaultProps.seats = undefined; }
    else if (category === 'Escenario') { defaultProps.width = 200; defaultProps.height = 100; defaultProps.seats = undefined; }
    else if (category === 'Living') { defaultProps.width = 180; defaultProps.height = 180; defaultProps.seats = undefined; }
    else if (category === 'Área de Fotos') { defaultProps.width = 150; defaultProps.height = 100; defaultProps.seats = undefined; }

    const newElement: LayoutElement = {
      id: `el_${Date.now()}`, name: customProps?.name || `${category} ${ (decoracion.salonElements?.filter(e => e.category === category).length || 0) + 1}`,
      x: 20, y: 20, rotation: 0, quantity: 1, type: 'predefined', ...defaultProps, ...customProps, category,
    };
    setDecoracion({ ...decoracion, salonElements: [...(decoracion.salonElements || []), newElement] });
  };
  
  const handleAddCustomElement = () => {
    if (!customElement.name.trim()) { toast({title: "Nombre requerido", variant: "destructive"}); return; }
    const categoryName = customElement.shape === 'circle' ? 'Mesa Redonda' : 'Varios';
    addElement(categoryName, { name: customElement.name, width: customElement.width, height: customElement.height, category: categoryName, seats: undefined });
    setIsCustomElementModalOpen(false);
    setCustomElement({ name: '', category: 'Varios', width: 100, height: 100, shape: 'rectangle' });
  };

  const handleOpenEditModal = (element: LayoutElement) => { setEditingElement(element); setIsEditModalOpen(true); };
  const handleUpdateElement = () => {
    if (!editingElement || !decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el => el.id === editingElement.id ? editingElement : el);
    setDecoracion({ ...decoracion, salonElements: newElements });
    setIsEditModalOpen(false);
    setEditingElement(null);
  };
  
  const handleElementRotation = (elementId: string) => {
    if (!decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el =>
      el.id === elementId ? { ...el, rotation: (el.rotation + 45) % 360 } : el
    );
    setDecoracion({ ...decoracion, salonElements: newElements });
  };

  const handleDeleteElement = (elementId: string) => {
    if (!decoracion) return;
    const elementToDelete = decoracion.salonElements?.find(e => e.id === elementId);
    if(elementToDelete?.category?.includes('Mesa')) {
        setInvitados(prev => prev.map(inv => inv.tableNumber === elementToDelete.name ? {...inv, tableNumber: undefined, seatNumber: undefined} : inv));
    }
    setDecoracion({ ...decoracion, salonElements: (decoracion.salonElements || []).filter(el => el.id !== elementId) });
  };
  
  const handleSeatDrop = (e: React.DragEvent, table: LayoutElement, seatNumber: number) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData('guestId');
    const guestBeingDragged = invitados.find(i => i.id === guestId);

    const alreadyAssignedToSeat = invitados.some(i => i.tableNumber === table.name && i.seatNumber === seatNumber);
    if (alreadyAssignedToSeat) {
      toast({ title: "Asiento Ocupado", description: "Este asiento ya está asignado.", variant: "destructive" });
      return;
    }
    
    setInvitados(prev => prev.map(inv => inv.id === guestId ? { ...inv, tableNumber: table.name, seatNumber } : inv));
  };
  
  const handleSaveAll = async () => {
    if (!decoracion || !fiestaId) return;
    setIsSaving(true);
    try {
        const updateGuestPromises = invitados.map(invitado => updateInvitadoFiestaActual(fiestaId, invitado));
        await Promise.all(updateGuestPromises);
        await updateDecoracionFiestaActual(fiestaId, decoracion);
        toast({ title: "¡Guardado!", description: "El diseño del salón y la asignación de invitados han sido guardados." });
        await loadData(false);
    } catch(err: any) {
        toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleLoadTemplate = async () => {
    setIsTemplateActionLoading(true);
    try {
        const data = await getSalonLayoutTemplates();
        setTemplates(data);
        setIsLoadTemplateModalOpen(true);
    } catch(e) {
        toast({title: "Error", description: "No se pudieron cargar las plantillas."});
    } finally {
        setIsTemplateActionLoading(false);
    }
  };
  
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || !decoracion) return;
    setIsTemplateActionLoading(true);
    try {
        const result = await saveSalonLayoutTemplate(templateName, decoracion);
        if (result.success) {
            toast({title: "Plantilla Guardada"});
            setIsSaveTemplateModalOpen(false);
        } else throw new Error(result.error);
    } catch(e: any) {
         toast({title: "Error", description: e.message, variant: "destructive"});
    } finally {
         setIsTemplateActionLoading(false);
    }
  };
  
  const handleAssignGuestToTable = (guestId: string, tableName: string) => {
    setInvitados(prev => prev.map(inv => inv.id === guestId ? { ...inv, tableNumber: tableName, seatNumber: undefined } : inv));
  };
  
  const invitadosConfirmados = useMemo(() => invitados.filter(i => i.rsvp === 'Confirmado'), [invitados]);
  const invitadosSinMesa = useMemo(() => {
    const unassigned = invitadosConfirmados.filter(i => !i.tableNumber);
    if (!guestSearchTerm.trim()) return unassigned;
    return unassigned.filter(i => i.nombre.toLowerCase().includes(guestSearchTerm.toLowerCase()));
  }, [invitadosConfirmados, guestSearchTerm]);
  
  const mesas = useMemo(() => (decoracion?.salonElements || []).filter(el => el.category?.toLowerCase().includes('mesa')), [decoracion]);

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-destructive text-center p-4">{error}</div>;
  if (!decoracion) return null;
  
  const pixelsPerMeter = decoracion.pixelsPerMeter || 30;
  const salonWidthPx = (decoracion.salonWidth || 20) * pixelsPerMeter;
  const salonHeightPx = (decoracion.salonHeight || 30) * pixelsPerMeter;

  return (
    <div className="space-y-6">
      {/* Modals */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}><DialogContent><DialogHeader><DialogTitle>Editar Elemento: {editingElement?.name}</DialogTitle></DialogHeader>{editingElement && (<div className="space-y-4"><div className="space-y-1"><Label htmlFor="el-name">Nombre</Label><Input id="el-name" value={editingElement.name} onChange={e => setEditingElement(prev => prev ? {...prev, name: e.target.value} : null)}/></div>{editingElement.category?.includes('Mesa') && <div className="space-y-1"><Label htmlFor="el-seats">Asientos</Label><Input id="el-seats" type="number" value={editingElement.seats || 0} onChange={e => setEditingElement(prev => prev ? {...prev, seats: Number(e.target.value) || 0} : null)}/></div>}<div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="el-width">Ancho (px)</Label><Input id="el-width" type="number" value={editingElement.width || 0} onChange={e => setEditingElement(prev => prev ? {...prev, width: Number(e.target.value) || 0} : null)}/></div><div className="space-y-1"><Label htmlFor="el-height">Alto (px)</Label><Input id="el-height" type="number" value={editingElement.height || 0} onChange={e => setEditingElement(prev => prev ? {...prev, height: Number(e.target.value) || 0} : null)}/></div></div></div>)}<DialogFooter><Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button><Button onClick={handleUpdateElement}>Guardar</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isCustomElementModalOpen} onOpenChange={setIsCustomElementModalOpen}><DialogContent><DialogHeader><DialogTitle>Crear Elemento Personalizado</DialogTitle></DialogHeader><div className="space-y-3 py-2"><div className="space-y-1"><Label htmlFor="custom-el-name">Nombre</Label><Input id="custom-el-name" value={customElement.name} onChange={e => setCustomElement(p => ({...p, name: e.target.value}))}/></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="custom-el-width">Ancho (px)</Label><Input id="custom-el-width" type="number" value={customElement.width} onChange={e => setCustomElement(p => ({...p, width: Number(e.target.value)}))}/></div><div className="space-y-1"><Label htmlFor="custom-el-height">Alto (px)</Label><Input id="custom-el-height" type="number" value={customElement.height} onChange={e => setCustomElement(p => ({...p, height: Number(e.target.value)}))}/></div></div><div className="space-y-1"><Label>Forma</Label><RadioGroup defaultValue="rectangle" value={customElement.shape} onValueChange={(v) => setCustomElement(p=>({...p, shape:v}))} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="rectangle" id="shape-rect"/><Label htmlFor="shape-rect">Rectángulo</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="circle" id="shape-circ"/><Label htmlFor="shape-circ">Círculo</Label></div></RadioGroup></div></div><DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleAddCustomElement}>Añadir Elemento</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isLoadTemplateModalOpen} onOpenChange={setIsLoadTemplateModalOpen}><DialogContent><DialogHeader><DialogTitle>Cargar Plantilla de Salón</DialogTitle></DialogHeader>{isTemplateActionLoading ? <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin"/></div> : templates.length === 0 ? <p>No hay plantillas.</p> : <ScrollArea className="max-h-64"><div className="space-y-2 pr-4">{templates.map(t => <Button key={t.id} variant="secondary" className="w-full justify-start" onClick={() => { setDecoracion(t.layoutData); setIsLoadTemplateModalOpen(false); toast({title:'Plantilla cargada'}); }}>{t.name}</Button>)}</div></ScrollArea>}</DialogContent></Dialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><LayoutDashboard className="w-8 h-8 text-primary"/><h1 className="text-3xl font-bold tracking-tight font-headline">Diseño de Salón</h1></div>
        <div className="flex gap-2">
            <Link href={`/fiestas/nueva/invitados?fiestaId=${fiestaId}`} passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver a Invitados</Button></Link>
            <Button onClick={handleSaveAll} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}Guardar</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-250px)]">
        <div className="xl:col-span-3 space-y-4 flex flex-col min-h-0">
            <Card>
                <CardHeader className="pb-3"><CardTitle>Controles del Diseño</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1"><Label>Ancho (m)</Label><Input type="number" value={decoracion.salonWidth || 20} onChange={e => setDecoracion(d => d ? {...d, salonWidth: Number(e.target.value)} : null)} /></div>
                    <div className="space-y-1"><Label>Alto (m)</Label><Input type="number" value={decoracion.salonHeight || 30} onChange={e => setDecoracion(d => d ? {...d, salonHeight: Number(e.target.value)} : null)} /></div>
                  </div>
                  <div className="space-y-1"><Label>Píxeles/Metro</Label><Input type="number" value={pixelsPerMeter} onChange={e => setDecoracion(d => d ? {...d, pixelsPerMeter: Number(e.target.value)} : null)} /></div>
                  <Separator/>
                    <h4 className="font-medium text-sm">Añadir Elementos</h4>
                    <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => addElement('Mesa Redonda')}><Circle className="w-4 h-4 mr-2"/>Mesa Redonda</Button><Button variant="outline" onClick={() => addElement('Mesa Rectangular')}><Square className="w-4 h-4 mr-2"/>Mesa Rectangular</Button><Button variant="outline" onClick={() => addElement('Pista de Baile')}><Disc className="w-4 h-4 mr-2"/>Pista</Button><Button variant="outline" onClick={() => addElement('Escenario')}><Clapperboard className="w-4 h-4 mr-2"/>Escenario</Button><Button variant="outline" onClick={() => addElement('Living')}><Sofa className="w-4 h-4 mr-2"/>Living</Button><Button variant="outline" onClick={() => addElement('Área de Fotos')}><CameraIcon className="w-4 h-4 mr-2"/>Área Fotos</Button></div>
                    <Button variant="outline" className="w-full" onClick={() => setIsCustomElementModalOpen(true)}><PlusCircle className="w-4 h-4 mr-2"/>Elemento Personalizado</Button>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button type="button" onClick={handleLoadTemplate} variant="outline" className="w-full" disabled={isTemplateActionLoading}><FolderDown className="w-4 h-4 mr-2"/>Cargar Plantilla</Button>
                  <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}>
                    <DialogTrigger asChild><Button type="button" className="w-full"><FolderUp className="w-4 h-4 mr-2"/>Guardar Diseño</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Guardar Diseño como Plantilla</DialogTitle></DialogHeader><div className="space-y-2 py-2"><Label htmlFor="template-name">Nombre de la Plantilla</Label><Input id="template-name" value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Ej: Club Uruguay - 80 invitados"/></div><DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSaveAsTemplate} disabled={isTemplateActionLoading}>Guardar</Button></DialogFooter></DialogContent>
                  </Dialog>
                </CardFooter>
            </Card>
        </div>
        <div className={cn("xl:col-span-6 bg-card", isFullScreen ? 'fixed inset-0 z-40 p-4' : '')}>
          <Card className="h-full flex flex-col"><CardHeader><CardTitle>Lienzo del Salón</CardTitle></CardHeader>
            <CardContent className="flex-grow p-1">
              <ScrollArea className="w-full h-full">
                <div ref={canvasRef} className="relative canvas-grid-background overflow-hidden" style={{ width: `${salonWidthPx}px`, height: `${salonHeightPx}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                  {decoracion.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50" data-ai-hint="event floor plan"/>)}
                  {(decoracion.salonElements || []).map(el => {
                    const nodeRef = React.createRef<HTMLDivElement>();
                    const isTable = el.category?.toLowerCase().includes('mesa');
                    
                    let seats = [];
                    if (isTable && el.seats) {
                        for (let i = 0; i < el.seats; i++) {
                            const angle = (i / el.seats) * 2 * Math.PI;
                            const seatSize = 30;
                            let x, y;
                            if (el.category === 'Mesa Redonda' || el.shape === 'circle') {
                                x = el.width / 2 + (el.width / 2 + seatSize / 2 - 5) * Math.cos(angle) - seatSize / 2;
                                y = el.height / 2 + (el.height / 2 + seatSize / 2 - 5) * Math.sin(angle) - seatSize / 2;
                            } else {
                                const perimeter = 2 * el.width + 2 * el.height;
                                const seatSpacing = perimeter / el.seats;
                                let p = i * seatSpacing;
                                if (p < el.width) { x = p; y = -seatSize - 5; } 
                                else if (p < el.width + el.height) { x = el.width + 5; y = (p - el.width); } 
                                else if (p < 2 * el.width + el.height) { x = el.width - (p - el.width - el.height); y = el.height + 5; } 
                                else { x = -seatSize - 5; y = el.height - (p - 2 * el.width - el.height); }
                            }
                            const assignedGuest = invitados.find(inv => inv.tableNumber === el.name && inv.seatNumber === i + 1);

                            seats.push(
                                <div key={i} onDragOver={e => e.preventDefault()} onDrop={e => handleSeatDrop(e, el, i+1)} 
                                    className={cn("absolute border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center text-xs font-semibold text-gray-500", assignedGuest && 'border-solid border-primary bg-primary/20 text-primary-foreground')}
                                    style={{ left: x, top: y, width: seatSize, height: seatSize, transform: `rotate(-${el.rotation}deg)` }}>
                                    {assignedGuest ? getInitials(assignedGuest.nombre) : i + 1}
                                </div>
                            );
                        }
                    }

                    return (
                    <Draggable key={el.id} nodeRef={nodeRef} bounds="parent" grid={[grid, grid]} position={{ x: el.x, y: el.y }} onStop={(e, data) => handleDragStop(e, data, el.id)}>
                        <div ref={nodeRef} id={el.id} className="absolute cursor-grab active:cursor-grabbing" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`}}>
                            <div className={cn('w-full h-full border-2 flex items-center justify-center text-lg font-bold bg-white/80', selectedElementId === el.id ? 'border-primary shadow-lg' : 'border-gray-500', el.category?.includes('Mesa Redonda') || el.shape === 'circle' ? 'rounded-full' : 'rounded-md')}
                                onClick={() => setSelectedElementId(el.id)}>
                                {el.name}
                            </div>
                            {seats}
                            {selectedElementId === el.id && (<div className="absolute -top-7 -right-2 flex gap-0.5 z-20" style={{transform: `rotate(-${el.rotation}deg)`}}><Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenEditModal(el)}><Edit className="w-3 h-3"/></Button><Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleElementRotation(el.id)}><RotateCw className="w-3 h-3"/></Button><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteElement(el.id)}><Trash2 className="w-3 h-3"/></Button></div>)}
                        </div>
                    </Draggable>
                    )
                  })}
                </div>
              </ScrollArea>
              <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-30">
                  <Button size="icon" variant="outline" onClick={() => setIsFullScreen(!isFullScreen)}><Maximize className="w-4 h-4"/></Button>
                  <Button size="icon" variant="outline" onClick={() => setScale(s => s * 1.2)}><ZoomIn className="w-4 h-4"/></Button>
                  <Button size="icon" variant="outline" onClick={() => setScale(s => s / 1.2)}><ZoomOut className="w-4 h-4"/></Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-3 space-y-4 flex flex-col min-h-0">
             <Card className="flex-grow flex flex-col">
                <CardHeader className="pb-3"><CardTitle>Invitados sin Mesa</CardTitle></CardHeader>
                <CardContent className="flex-grow min-h-0">
                    <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar invitado..." className="pl-8" value={guestSearchTerm} onChange={e => setGuestSearchTerm(e.target.value)} />
                    </div>
                    <ScrollArea className="h-96">
                        <div className="space-y-2 pr-3">
                            {invitadosSinMesa.map(inv => (
                                <div key={inv.id} draggable onDragStart={e => e.dataTransfer.setData('guestId', inv.id)} className="p-2 border rounded bg-card cursor-grab shadow-sm">
                                    <p className="font-medium text-sm">{inv.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{inv.partySize || 1} persona(s)</p>
                                </div>
                            ))}
                            {invitadosSinMesa.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Todos los invitados confirmados tienen una mesa.</p>}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

export default function SalonLayoutPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <SalonLayoutContent/>
        </Suspense>
    )
}
