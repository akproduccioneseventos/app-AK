
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Disc, Clapperboard, Sofa, Camera as CameraIcon, Search, Printer, Settings2, FolderDown, FolderUp, Maximize, ZoomIn, ZoomOut } from 'lucide-react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, DecoracionData } from '@/types/fiesta';
import { getFiestaById, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { saveSalonLayoutTemplate, getSalonLayoutTemplates, type SalonLayoutTemplate } from '@/app/actions/salon-layout-templates';

const grid = 10;

function SalonLayoutContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [decoracion, setDecoracion] = useState<DecoracionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<LayoutElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [isCustomElementModalOpen, setIsCustomElementModalOpen] = useState(false);
  const [customElement, setCustomElement] = useState({ name: '', category: 'Varios', width: 100, height: 100, shape: 'rectangle' });
  
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
    const defaultProps: Partial<LayoutElement> = { width: 120, height: 120, seats: 8 };
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
    const newElementData: Partial<LayoutElement> = {
      name: customElement.name,
      width: customElement.width,
      height: customElement.height,
      category: categoryName,
      seats: customElement.shape === 'circle' ? 8 : undefined // Default seats for custom circles
    };
    addElement(categoryName, newElementData);
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
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Diseño de Salón (Organizador)</h1>
        </div>
        <div className="flex gap-2">
            <Link href={`/fiestas/nueva/invitados?fiestaId=${fiestaId}`} passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver a Invitados</Button></Link>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-250px)]">
        <div className={cn("xl:col-span-9 bg-card", isFullScreen ? 'fixed inset-0 z-40 p-4' : '')}>
          <Card className="h-full flex flex-col"><CardHeader><CardTitle>Lienzo del Salón</CardTitle></CardHeader>
            <CardContent className="flex-grow p-1">
              <ScrollArea className="w-full h-full">
                <div ref={canvasRef} className="relative canvas-grid-background overflow-hidden" style={{ width: `${salonWidthPx}px`, height: `${salonHeightPx}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                  {decoracion.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50" data-ai-hint="event floor plan"/>)}
                  {(decoracion.salonElements || []).map(el => {
                    const nodeRef = React.createRef<HTMLDivElement>();
                    const isRound = el.category === 'Mesa Redonda' || el.shape === 'circle';
                    return (
                    <Draggable key={el.id} nodeRef={nodeRef} bounds="parent" grid={[grid, grid]} position={{ x: el.x, y: el.y }} onStop={(e, data) => handleDragStop(e, data, el.id)}>
                        <div ref={nodeRef} id={el.id} className="absolute cursor-grab active:cursor-grabbing" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`}}>
                            <div className={cn('w-full h-full border-2 flex items-center justify-center text-lg font-bold bg-white/80 p-1', selectedElementId === el.id ? 'border-primary shadow-lg' : 'border-gray-500', isRound ? 'rounded-full' : 'rounded-md')}
                                onClick={() => setSelectedElementId(el.id)}>
                                <span className="text-center truncate">{el.name}</span>
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
        <div className="xl:col-span-3 space-y-4 flex flex-col min-h-0">
             <Card>
                <CardHeader className="pb-3"><CardTitle className="text-md font-medium">Controles del Plano</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label>Ancho Salón (m)</Label><Input type="number" value={decoracion.salonWidth || 20} onChange={e => setDecoracion(d => d ? {...d, salonWidth: Number(e.target.value)} : null)} /></div>
                      <div className="space-y-1"><Label>Alto Salón (m)</Label><Input type="number" value={decoracion.salonHeight || 30} onChange={e => setDecoracion(d => d ? {...d, salonHeight: Number(e.target.value)} : null)} /></div>
                  </div>
                  <div className="space-y-1"><Label>Píxeles por Metro</Label><Input type="number" value={decoracion.pixelsPerMeter || 30} onChange={e => setDecoracion(d => d ? {...d, pixelsPerMeter: Number(e.target.value)} : null)} /></div>
                  <Separator/>
                    <h4 className="font-medium text-sm">Añadir Elementos</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => addElement('Mesa Redonda')}><Circle className="w-4 h-4 mr-2"/>Mesa Redonda</Button>
                        <Button variant="outline" onClick={() => addElement('Mesa Rectangular')}><Square className="w-4 h-4 mr-2"/>Mesa Rectangular</Button>
                        <Button variant="outline" onClick={() => addElement('Pista de Baile')}><Disc className="w-4 h-4 mr-2"/>Pista</Button>
                        <Button variant="outline" onClick={() => addElement('Escenario')}><Clapperboard className="w-4 h-4 mr-2"/>Escenario</Button>
                        <Button variant="outline" onClick={() => addElement('Living')}><Sofa className="w-4 h-4 mr-2"/>Living</Button>
                        <Button variant="outline" onClick={() => addElement('Área de Fotos')}><CameraIcon className="w-4 h-4 mr-2"/>Área Fotos</Button>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setIsCustomElementModalOpen(true)}><PlusCircle className="w-4 h-4 mr-2"/>Elemento Personalizado</Button>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                   <Button type="button" onClick={handleLoadTemplate} variant="outline" className="w-full"><FolderDown className="w-4 h-4 mr-2"/>Cargar Plantilla</Button>
                   <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}><DialogTrigger asChild><Button type="button" className="w-full"><FolderUp className="w-4 h-4 mr-2"/>Guardar Diseño</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Guardar Diseño como Plantilla</DialogTitle></DialogHeader><div className="space-y-2 py-2"><Label htmlFor="template-name">Nombre de la Plantilla</Label><Input id="template-name" value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Ej: Club Uruguay - 80 invitados"/></div><DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSaveAsTemplate} disabled={isSaving}>Guardar</Button></DialogFooter></DialogContent></Dialog>
                   <Button onClick={handleSaveAll} disabled={isSaving} className="w-full mt-2"><Save className="w-4 h-4 mr-2"/>Guardar Plano del Salón</Button>
                </CardFooter>
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
