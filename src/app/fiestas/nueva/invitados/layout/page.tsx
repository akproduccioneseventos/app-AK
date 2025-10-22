
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Disc, Clapperboard, Sofa, Camera as CameraIcon, Search, Printer, Settings2, FolderDown, FolderUp, Maximize, ZoomIn, ZoomOut, Upload } from 'lucide-react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, Invitado, DecoracionData } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updateDecoracionFiestaActual, updateInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { saveSalonLayoutTemplate, getSalonLayoutTemplates, type SalonLayoutTemplate } from '@/app/actions/salon-layout-templates';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';


const grid = 10;
const PIXELS_PER_METER_DEFAULT = 40;

const ElementIcon: React.FC<{ category?: string }> = ({ category }) => {
    switch (category) {
        case 'Mesa Redonda': return <Circle className="w-4 h-4 text-muted-foreground"/>;
        case 'Mesa Rectangular': return <Square className="w-4 h-4 text-muted-foreground"/>;
        case 'Pista de Baile': return <Disc className="w-4 h-4 text-muted-foreground"/>;
        case 'Escenario': return <Clapperboard className="w-4 h-4 text-muted-foreground"/>;
        case 'Living': return <Sofa className="w-4 h-4 text-muted-foreground"/>;
        case 'Área de Fotos': return <CameraIcon className="w-4 h-4 text-muted-foreground"/>;
        default: return <LayoutDashboard className="w-4 h-4 text-muted-foreground"/>;
    }
};

function SalonLayoutContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [decoracion, setDecoracion] = useState<DecoracionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<LayoutElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [isCustomElementModalOpen, setIsCustomElementModalOpen] = useState(false);
  const [customElement, setCustomElement] = useState({ name: '', width: 2, height: 1, shape: 'rectangle' });
  
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<SalonLayoutTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [isTemplateActionLoading, setIsTemplateActionLoading] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async (showLoading = true) => {
    if (!fiestaId) return;
    if(showLoading) setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      
      setFiesta(fiestaData);
      setDecoracion(fiestaData.decoracion || { salonElements: [], pixelsPerMeter: PIXELS_PER_METER_DEFAULT });

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
    const pixelsPerMeter = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;
    
    let defaultProps: Partial<LayoutElement> = { width: 2.5 * pixelsPerMeter, height: 2.5 * pixelsPerMeter, seats: 8 };

    if (category === 'Mesa Rectangular') { defaultProps = { width: 4 * pixelsPerMeter, height: 2 * pixelsPerMeter, seats: 8 }; }
    else if (category === 'Pista de Baile') { defaultProps = { width: 6 * pixelsPerMeter, height: 6 * pixelsPerMeter, seats: undefined }; }
    else if (category === 'Escenario') { defaultProps = { width: 5 * pixelsPerMeter, height: 2.5 * pixelsPerMeter, seats: undefined }; }
    else if (category === 'Living') { defaultProps = { width: 4.5 * pixelsPerMeter, height: 4.5 * pixelsPerMeter, seats: undefined }; }
    else if (category === 'Área de Fotos') { defaultProps = { width: 4 * pixelsPerMeter, height: 2.5 * pixelsPerMeter, seats: undefined }; }

    const newElement: LayoutElement = {
      id: `el_${Date.now()}`, name: customProps?.name || `${category} ${ (decoracion.salonElements?.filter(e => e.category === category).length || 0) + 1}`,
      x: 20, y: 20, rotation: 0, ...defaultProps, ...customProps, category, type: 'predefined',
    };

    setDecoracion(prev => {
        if (!prev) return null;
        return { ...prev, salonElements: [...(prev.salonElements || []), newElement] };
    });
  };
  
  const handleAddCustomElement = () => {
    if (!customElement.name.trim()) { toast({ title: "Nombre requerido", variant: "destructive" }); return; }
    if (!decoracion) return;

    const pixelsPerMeter = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;
    
    const newElementData: Partial<LayoutElement> = {
        name: customElement.name,
        width: (customElement.width || 2) * pixelsPerMeter,
        height: (customElement.height || 1) * pixelsPerMeter,
        category: 'Varios',
        shape: customElement.shape === 'circle' ? 'circle' : 'rectangle',
        seats: customElement.shape === 'circle' ? 8 : undefined,
    };
    
    addElement('Varios', newElementData);
    
    setIsCustomElementModalOpen(false);
    setCustomElement({ name: '', width: 2, height: 1, shape: 'rectangle' });
  };


  const handleOpenEditModal = (element: LayoutElement) => { setEditingElement(element); setIsEditModalOpen(true); };
  const handleUpdateElement = () => {
    if (!editingElement || !decoracion) return;
    
    const newElements = (decoracion.salonElements || []).map(el => el.id === editingElement.id ? editingElement : el
    );
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
    setDecoracion({ ...decoracion, salonElements: (decoracion.salonElements || []).filter(el => el.id !== elementId) });
  };
  
  const handleSaveAll = async () => {
    if (!decoracion || !fiestaId) return;
    setIsSaving(true);
    try {
        await updateDecoracionFiestaActual(fiestaId, decoracion);
        toast({ title: "¡Guardado!", description: "El diseño del salón ha sido guardado." });
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
  
  const handleAssignGuestToTable = async (guestId: string, tableName: string) => {
    const updatedInvitados = (fiesta?.invitados || []).map(inv => 
      inv.id === guestId ? { ...inv, tableNumber: tableName } : inv
    );
    if (fiesta) {
      setFiesta({ ...fiesta, invitados: updatedInvitados });
      const guestToUpdate = updatedInvitados.find(i => i.id === guestId);
      if (guestToUpdate) await updateInvitadoFiestaActual(fiesta.id, guestToUpdate);
    }
  };

  const handleUnassignGuest = async (guestId: string) => {
    const updatedInvitados = (fiesta?.invitados || []).map(inv => 
      inv.id === guestId ? { ...inv, tableNumber: undefined } : inv
    );
     if (fiesta) {
      setFiesta({ ...fiesta, invitados: updatedInvitados });
      const guestToUpdate = updatedInvitados.find(i => i.id === guestId);
      if (guestToUpdate) await updateInvitadoFiestaActual(fiesta.id, guestToUpdate);
    }
  };

  const handleBackgroundImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiestaId, file);
      if(result.success && result.url) {
        if(decoracion) setDecoracion({ ...decoracion, salonPlanBackgroundImageUrl: result.url });
        toast({ title: "Plano Subido", description: "La imagen de fondo ha sido actualizada." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al subir", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const invitadosSinMesa = useMemo(() => {
    if (!fiesta) return [];
    return (fiesta.invitados || [])
      .filter(inv => !inv.tableNumber && (inv.rsvp === 'Confirmado' || inv.rsvp === 'Pendiente') && inv.nombre.toLowerCase().includes(guestSearchTerm.toLowerCase()))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [fiesta, guestSearchTerm]);
  

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-destructive text-center p-4">{error}</div>;
  if (!decoracion || !fiesta) return null;
  
  const pixelsPerMeter = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;

  return (
    <div className="space-y-6">
      {/* Modals */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}><DialogContent><DialogHeader><DialogTitle>Editar Elemento: {editingElement?.name}</DialogTitle></DialogHeader>{editingElement && (<div className="space-y-4"><div className="space-y-1"><Label htmlFor="el-name">Nombre</Label><Input id="el-name" value={editingElement.name} onChange={e => setEditingElement(prev => prev ? {...prev, name: e.target.value} : null)}/></div>{editingElement.category?.includes('Mesa') && <div className="space-y-1"><Label htmlFor="el-seats">Asientos</Label><Input id="el-seats" type="number" value={editingElement.seats || 0} onChange={e => setEditingElement(prev => prev ? {...prev, seats: Number(e.target.value) || 0} : null)}/></div>}<div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="el-width">Ancho (px)</Label><Input id="el-width" type="number" value={editingElement.width || 0} onChange={e => setEditingElement(prev => prev ? {...prev, width: Number(e.target.value) || 0} : null)}/></div><div className="space-y-1"><Label htmlFor="el-height">Alto (px)</Label><Input id="el-height" type="number" value={editingElement.height || 0} onChange={e => setEditingElement(prev => prev ? {...prev, height: Number(e.target.value) || 0} : null)}/></div></div></div>)}<DialogFooter><Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button><Button onClick={handleUpdateElement}>Guardar</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isCustomElementModalOpen} onOpenChange={setIsCustomElementModalOpen}><DialogContent><DialogHeader><DialogTitle>Crear Elemento Personalizado</DialogTitle></DialogHeader><div className="space-y-3 py-2"><div className="space-y-1"><Label htmlFor="custom-el-name">Nombre</Label><Input id="custom-el-name" value={customElement.name} onChange={e => setCustomElement(p => ({...p, name: e.target.value}))}/></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="custom-el-width">Ancho (m)</Label><Input id="custom-el-width" type="number" value={customElement.width} onChange={e => setCustomElement(p => ({...p, width: Number(e.target.value)}))}/></div><div className="space-y-1"><Label htmlFor="custom-el-height">Alto (m)</Label><Input id="custom-el-height" type="number" value={customElement.height} onChange={e => setCustomElement(p => ({...p, height: Number(e.target.value)}))}/></div></div><div className="space-y-1"><Label>Forma</Label><RadioGroup defaultValue="rectangle" value={customElement.shape} onValueChange={(v) => setCustomElement(p=>({...p, shape:v}))} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="rectangle" id="shape-rect"/><Label htmlFor="shape-rect">Rectángulo</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="circle" id="shape-circ"/><Label htmlFor="shape-circ">Círculo</Label></div></RadioGroup></div></div><DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleAddCustomElement}>Añadir Elemento</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isLoadTemplateModalOpen} onOpenChange={setIsLoadTemplateModalOpen}><DialogContent><DialogHeader><DialogTitle>Cargar Plantilla de Salón</DialogTitle></DialogHeader>{isTemplateActionLoading ? <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin"/></div> : templates.length === 0 ? <p>No hay plantillas.</p> : <ScrollArea className="max-h-64"><div className="space-y-2 pr-4">{templates.map(t => <Button key={t.id} variant="secondary" className="w-full justify-start" onClick={() => { setDecoracion(t.layoutData); setIsLoadTemplateModalOpen(false); toast({title:'Plantilla cargada'}); }}>{t.name}</Button>)}</div></ScrollArea>}</DialogContent></Dialog>
      
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Diseño del Salón (Organizador)</h1>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-250px)]">
        <Card className="xl:col-span-3 flex flex-col"><CardHeader><CardTitle>Controles</CardTitle></CardHeader>
          <CardContent className="flex-grow space-y-4 overflow-y-auto">
             <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Ancho Salón (m)</Label><Input type="number" value={decoracion.salonWidth || 15} onChange={e => setDecoracion(d => d ? {...d, salonWidth: Number(e.target.value)} : null)} /></div><div className="space-y-1"><Label>Alto Salón (m)</Label><Input type="number" value={decoracion.salonHeight || 15} onChange={e => setDecoracion(d => d ? {...d, salonHeight: Number(e.target.value)} : null)} /></div></div>
             <div className="space-y-1"><Label>Píxeles por Metro</Label><Input type="number" value={decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT} onChange={e => setDecoracion(d => d ? {...d, pixelsPerMeter: Number(e.target.value)} : null)} /></div>
             <Separator/>
               <h4 className="font-medium text-sm">Añadir Elementos</h4>
               <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => addElement('Mesa Redonda')}><Circle className="w-4 h-4 mr-2"/>Mesa Redonda</Button><Button variant="outline" onClick={() => addElement('Mesa Rectangular')}><Square className="w-4 h-4 mr-2"/>Mesa Rectangular</Button><Button variant="outline" onClick={() => addElement('Pista de Baile')}><Disc className="w-4 h-4 mr-2"/>Pista</Button><Button variant="outline" onClick={() => addElement('Escenario')}><Clapperboard className="w-4 h-4 mr-2"/>Escenario</Button><Button variant="outline" onClick={() => addElement('Living')}><Sofa className="w-4 h-4 mr-2"/>Living</Button><Button variant="outline" onClick={() => addElement('Área de Fotos')}><CameraIcon className="w-4 h-4 mr-2"/>Área Fotos</Button></div>
               <Button variant="outline" className="w-full" onClick={() => setIsCustomElementModalOpen(true)}><PlusCircle className="w-4 h-4 mr-2"/>Elemento Personalizado</Button>
               <Separator/>
                 <div className="space-y-2">
                    <Label htmlFor="bg-image-upload" className="font-medium text-sm">Plano de Fondo</Label>
                    <div className="flex gap-2 items-center">
                        <Input id="bg-image-upload" type="file" accept="image/*" onChange={handleBackgroundImageUpload} className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                        {isUploading && <Loader2 className="w-4 h-4 animate-spin"/>}
                    </div>
                </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 pt-4 border-t">
              <Button onClick={handleSaveAll} disabled={isSaving} className="w-full"><Save className="w-4 h-4 mr-2"/>Guardar Plano del Salón</Button>
               <div className="flex w-full gap-2">
                    <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}><DialogTrigger asChild><Button variant="secondary" className="flex-1"><FolderUp className="w-4 h-4 mr-2"/>Guardar como Plantilla</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Guardar Plantilla de Salón</DialogTitle></DialogHeader><div className="py-2"><Label>Nombre:</Label><Input value={templateName} onChange={e => setTemplateName(e.target.value)}/></div><DialogFooter><Button variant="outline" onClick={()=>setIsSaveTemplateModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveAsTemplate} disabled={isTemplateActionLoading}>Guardar</Button></DialogFooter></DialogContent></Dialog>
                    <Button variant="secondary" className="flex-1" onClick={handleLoadTemplate} disabled={isTemplateActionLoading}><FolderDown className="w-4 h-4 mr-2"/>Cargar Plantilla</Button>
                </div>
          </CardFooter>
        </Card>
        <div className={cn("xl:col-span-9 bg-card", isFullScreen ? 'fixed inset-0 z-40 p-4' : '')}>
          <Card className="h-full flex flex-col"><CardHeader><CardTitle>Lienzo del Salón</CardTitle></CardHeader>
            <CardContent className="flex-grow p-1">
              <ScrollArea className="w-full h-full">
                <div ref={canvasRef} className="relative canvas-grid-background overflow-auto" style={{ width: `${(decoracion.salonWidth || 15) * pixelsPerMeter}px`, height: `${(decoracion.salonHeight || 15) * pixelsPerMeter}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                  {decoracion.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50" data-ai-hint="event floor plan"/>)}
                  {(decoracion.salonElements || []).map(el => {
                    const nodeRef = React.createRef<HTMLDivElement>();
                    const isRound = el.category === 'Mesa Redonda' || el.shape === 'circle';
                    const assignedGuests = (fiesta?.invitados || []).filter(inv => inv.tableNumber === el.name);
                    
                    return (
                    <Draggable key={el.id} nodeRef={nodeRef} bounds="parent" grid={[grid, grid]} position={{ x: el.x, y: el.y }} onStop={(e, data) => handleDragStop(e, data, el.id)}>
                        <div ref={nodeRef} id={el.id} className="absolute cursor-grab active:cursor-grabbing" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`}}>
                           <div className={cn('w-full h-full border-2 flex items-center justify-center font-bold bg-white/80 p-1 relative', selectedElementId === el.id ? 'border-primary shadow-lg' : 'border-gray-500', isRound ? 'rounded-full' : 'rounded-sm')}
                                onClick={() => setSelectedElementId(el.id)}>
                                <span className="text-center truncate text-base">{el.name}</span>
                                {isRound && el.seats && Array.from({length: el.seats}).map((_, i) => {
                                    const angle = (i / el.seats!) * 2 * Math.PI;
                                    const radius = (Math.min(el.width, el.height) / 2) + 20;
                                    const seatX = radius * Math.cos(angle) + (el.width/2);
                                    const seatY = radius * Math.sin(angle) + (el.height/2);
                                    const guest = assignedGuests[i];
                                    return (
                                        <div key={i} style={{left: `${seatX-12}px`, top: `${seatY-12}px`}} className="absolute w-6 h-6 rounded-full border-2 border-dashed border-gray-400 bg-white/90 flex items-center justify-center text-xs">
                                          {guest ? <span className="truncate text-blue-600 font-medium" title={guest.nombre}>{guest.nombre.charAt(0)}</span> : <span className="text-gray-400">{i+1}</span>}
                                        </div>
                                    )
                                })}
                            </div>
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
