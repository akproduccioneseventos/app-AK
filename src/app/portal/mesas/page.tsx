
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense, use, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Disc, Clapperboard, Sofa, Camera as CameraIcon, Search, Printer, Settings2, FolderDown, FolderUp, Maximize, ZoomIn, ZoomOut, Upload, Map, ChevronsUp, ChevronsDown } from 'lucide-react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, Invitado, DecoracionData, LayoutElementType } from '@/types/fiesta';
import { updateInvitadoFiestaActual, updateDecoracionFiestaActual, getFiestaById } from '@/app/actions/fiesta-actual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { saveSalonLayoutTemplate, getSalonLayoutTemplates, type SalonLayoutTemplate, deleteSalonLayoutTemplate } from '@/app/actions/salon-layout-templates';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';

const GUEST_ITEM_TYPE = 'guest';
const PIXELS_PER_METER_DEFAULT = 40;
const grid = 10;

interface GuestDragItem {
  id: string;
}

interface GuestCardProps {
  guest: Invitado;
}

const GuestCard: React.FC<GuestCardProps> = ({ guest }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: GUEST_ITEM_TYPE,
    item: { id: guest.id } as GuestDragItem,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={cn(
        "p-2 border rounded-md bg-background shadow-sm cursor-grab",
        isDragging && "opacity-50"
      )}
    >
      <p className="font-medium text-sm truncate">{guest.nombre}</p>
      <p className="text-xs text-muted-foreground">{guest.partySize || 1} persona(s)</p>
    </div>
  );
};

interface TableDropZoneProps {
    element: LayoutElement;
    onDrop: (guestId: string, tableName: string) => void;
    children: React.ReactNode;
}

const TableDropZone: React.FC<TableDropZoneProps> = ({ element, onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: GUEST_ITEM_TYPE,
    drop: (item: GuestDragItem) => onDrop(item.id, element.name),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop} className={cn("absolute", isOver && "ring-2 ring-offset-2 ring-primary rounded-md")}>
        {children}
    </div>
  );
};

const ElementIcon: React.FC<{ category?: string, type?: LayoutElementType }> = ({ category, type }) => {
    if (type === 'area') return <Map className="w-4 h-4 text-muted-foreground"/>;
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


function AsignacionMesasContent() {
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
  const [customElement, setCustomElement] = useState({ name: '', width: 2, height: 1, type: 'element' as 'element' | 'area', shape: 'rectangle' as 'rectangle' | 'circle' });
  
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<SalonLayoutTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [isTemplateActionLoading, setIsTemplateActionLoading] = useState(false);
  const [processingPointName, setProcessingPointName] = useState<string | null>(null);

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async (showLoading = true) => {
    if (!fiestaId) return;
    if(showLoading) setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Evento no encontrado.");
      
      setFiesta(fiestaData);
      setDecoracion(fiestaData.decoracion || { salonElements: [], pixelsPerMeter: PIXELS_PER_METER_DEFAULT, salonWidth: 15, salonHeight: 15 });

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
  
 const addElement = (category: string, customProps?: Partial<LayoutElement>, type: LayoutElementType = 'element') => {
    if (!decoracion) return;
    
    let defaultProps: Partial<LayoutElement> = { width: 80, height: 80, seats: 8, shape: 'circle' };

    if (category === 'Mesa Rectangular') { defaultProps = { width: 160, height: 80, seats: 8, shape: 'rectangle' }; }
    else if (category === 'Pista de Baile') { defaultProps = { width: 240, height: 200, seats: undefined, backgroundColor: 'rgba(56, 189, 248, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Escenario') { defaultProps = { width: 200, height: 100, seats: undefined, backgroundColor: 'rgba(139, 92, 246, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Living') { defaultProps = { width: 180, height: 180, seats: undefined, backgroundColor: 'rgba(234, 179, 8, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Área de Fotos') { defaultProps = { width: 160, height: 100, seats: undefined, backgroundColor: 'rgba(236, 72, 153, 0.2)', shape: 'rectangle' }; }

    const newElement: LayoutElement = {
      id: `el_${Date.now()}`, 
      name: customProps?.name || `${category} ${ (decoracion.salonElements?.filter(e => e.category === category).length || 0) + 1}`,
      x: 20, y: 20, rotation: 0, zIndex: (decoracion.salonElements?.length || 0) + 1,
      ...defaultProps, 
      ...customProps, 
      category, 
      type: type,
    };
    
    setDecoracion(prev => {
        if (!prev) return null;
        const updatedElements = [...(prev.salonElements || []), newElement];
        return { ...prev, salonElements: updatedElements };
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
        category: customElement.type === 'area' ? 'Área' : 'Varios',
        shape: customElement.shape === 'circle' ? 'circle' : 'rectangle',
        seats: customElement.shape === 'circle' ? 8 : undefined,
        backgroundColor: customElement.type === 'area' ? 'rgba(59, 130, 246, 0.2)' : undefined,
    };
    
    addElement(newElementData.category!, newElementData, customElement.type);
    
    setIsCustomElementModalOpen(false);
    setCustomElement({ name: '', width: 2, height: 1, type: 'element', shape: 'rectangle' });
  };

  const handleOpenEditModal = (element: LayoutElement) => { setEditingElement(element); setIsEditModalOpen(true); };
  
  const handleUpdateElement = () => {
    if (!editingElement || !decoracion) return;
    
    const newElements = (decoracion.salonElements || []).map(el => el.id === editingElement.id ? editingElement : el );
    setDecoracion({ ...decoracion, salonElements: newElements });
    setIsEditModalOpen(false);
    setEditingElement(null);
  };
  
  const handleElementLayering = (elementId: string, direction: 'up' | 'down') => {
    if (!decoracion) return;
    const currentElements = decoracion.salonElements || [];
    const maxZ = Math.max(...currentElements.map(e => e.zIndex || 0));
    const minZ = Math.min(...currentElements.map(e => e.zIndex || 0));

    const newElements = currentElements.map(el => {
        if (el.id === elementId) {
            const newZ = direction === 'up' ? maxZ + 1 : minZ - 1;
            return { ...el, zIndex: newZ };
        }
        return el;
    });
    setDecoracion({ ...decoracion, salonElements: newElements });
  };

  const handleElementRotation = (elementId: string) => {
    if (!decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el =>
      el.id === elementId ? { ...el, rotation: (el.rotation || 0) + 45 % 360 } : el
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

  const handleDeleteTemplate = async (templateId: string) => {
    setProcessingPointName(templateId);
    try {
      const result = await deleteSalonLayoutTemplate(templateId);
      if (result.success) {
        toast({ title: "Plantilla eliminada" });
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        setTemplates(updatedTemplates);
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudo eliminar la plantilla.", variant: "destructive" });
    } finally {
      setProcessingPointName(null);
    }
  };
  
  const handleAssignGuestToTable = async (guestId: string, tableName: string) => {
    const updatedInvitados = (fiesta?.invitados || []).map(inv => 
      inv.id === guestId ? { ...inv, tableNumber: tableName } : inv
    );
    if (fiesta) {
      setFiesta({ ...fiesta, invitados: updatedInvitados });
      const guestToUpdate = updatedInvitados.find(i => i.id === guestId);
      if (guestToUpdate) await updateInvitadoFiestaActual(fiestaId!, guestToUpdate);
    }
  };

  const handleUnassignGuest = async (guestId: string) => {
    const updatedInvitados = (fiesta?.invitados || []).map(inv => 
      inv.id === guestId ? { ...inv, tableNumber: undefined } : inv
    );
     if (fiesta) {
      setFiesta({ ...fiesta, invitados: updatedInvitados });
      const guestToUpdate = updatedInvitados.find(i => i.id === guestId);
      if (guestToUpdate) await updateInvitadoFiestaActual(fiestaId!, guestToUpdate);
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

  const filteredGuests = useMemo(() => {
    if (!fiesta?.invitados) return { conMesa: [], sinMesa: [] };
    
    const lowerCaseSearch = guestSearchTerm.toLowerCase();
    const confirmedGuests = fiesta.invitados.filter(g => g.rsvp === 'Confirmado');

    const conMesa = confirmedGuests
      .filter(g => g.tableNumber && g.nombre.toLowerCase().includes(lowerCaseSearch))
      .sort((a,b) => (a.tableNumber || '').localeCompare(b.tableNumber || ''));
      
    const sinMesa = confirmedGuests
      .filter(g => !g.tableNumber && g.nombre.toLowerCase().includes(lowerCaseSearch))
      .sort((a,b) => a.nombre.localeCompare(b.nombre));

    return { conMesa, sinMesa };
  }, [fiesta?.invitados, guestSearchTerm]);
  

  if (isLoading || !fiestaId) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin"/></div>
  }
  if (error || !decoracion || !fiesta) {
    return <div className="text-destructive text-center p-4">{error}</div>
  }
  
  const pixelsPerMeter = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary"/>
            Asignación de Mesas
        </h1>
        <Link href={`/fiestas/nueva/invitados?fiestaId=${fiestaId}`} passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Portal</Button></Link>
      </div>

       <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Asignación por Lista</TabsTrigger>
          <TabsTrigger value="visual">Asignación Visual en Salón</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
             <Card>
                 <CardHeader><CardTitle>Lista de Invitados Confirmados</CardTitle><div className="relative pt-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar invitado..." value={guestSearchTerm} onChange={(e) => setGuestSearchTerm(e.target.value)} className="w-full max-w-sm pl-10"/></div></CardHeader>
                <CardContent><Table>
                    <TableHeader><TableRow><TableHead>Invitado</TableHead><TableHead>Personas</TableHead><TableHead>Mesa Asignada</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {filteredGuests.sinMesa.map(guest => (
                             <TableRow key={guest.id}>
                                <TableCell className="font-medium">{guest.nombre}</TableCell>
                                <TableCell>{guest.partySize}</TableCell>
                                <TableCell><Select value={guest.tableNumber || ''} onValueChange={(val) => handleAssignGuestToTable(guest.id, val)}><SelectTrigger><SelectValue placeholder="Asignar mesa..." /></SelectTrigger><SelectContent>{(decoracion.salonElements || []).filter(el => el.category?.includes("Mesa")).map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent></Select></TableCell>
                            </TableRow>
                        ))}
                        {filteredGuests.conMesa.map(guest => (
                             <TableRow key={guest.id} className="bg-green-50/50">
                                <TableCell className="font-medium">{guest.nombre}</TableCell>
                                <TableCell>{guest.partySize}</TableCell>
                                <TableCell><Select value={guest.tableNumber || ''} onValueChange={(val) => handleAssignGuestToTable(guest.id, val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(decoracion.salonElements || []).filter(el => el.category?.includes("Mesa")).map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}<Separator/><SelectItem value="" className="text-destructive">Quitar de mesa</SelectItem></SelectContent></Select></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table></CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="visual">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-350px)]">
            <Card className="xl:col-span-3 flex flex-col">
                <CardHeader><CardTitle>Invitados sin Mesa</CardTitle><div className="relative pt-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar..." value={guestSearchTerm} onChange={(e) => setGuestSearchTerm(e.target.value)} className="w-full pl-10"/></div></CardHeader>
                <CardContent className="flex-grow min-h-0"><ScrollArea className="h-full"><div className="space-y-2 pr-4">{filteredGuests.sinMesa.map(guest => <GuestCard key={guest.id} guest={guest} />)}</div></ScrollArea></CardContent>
            </Card>
            <div className={cn("xl:col-span-9 bg-card flex flex-col", isFullScreen ? 'fixed inset-0 z-40 p-4' : '')}>
                <Card className="h-full flex flex-col flex-grow">
                    <CardHeader className="flex-row justify-between items-center"><CardTitle>Lienzo del Salón</CardTitle><div className="flex items-center gap-1"><Button size="icon" variant="outline" onClick={() => setScale(s => s / 1.2)}><ZoomOut className="w-4 h-4"/></Button><Button size="icon" variant="outline" onClick={() => setScale(s => s * 1.2)}><ZoomIn className="w-4 h-4"/></Button><Button size="icon" variant="outline" onClick={() => setIsFullScreen(!isFullScreen)}><Maximize className="w-4 h-4"/></Button></div></CardHeader>
                    <CardContent className="flex-grow p-1 overflow-auto">
                    <div ref={canvasRef} className="relative canvas-grid-background" style={{ width: `${(decoracion.salonWidth || 15) * pixelsPerMeter}px`, height: `${(decoracion.salonHeight || 15) * pixelsPerMeter}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                        {decoracion.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50"/>)}
                        {(decoracion.salonElements || []).sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)).map(el => {
                            const nodeRef = React.createRef<HTMLDivElement>();
                            const isRound = el.shape === 'circle';
                            const assignedGuests = (fiesta?.invitados || []).filter(inv => inv.tableNumber === el.name);
                            const isArea = el.type === 'area';
                            return (
                            <Draggable key={el.id} nodeRef={nodeRef} bounds="parent" grid={[grid, grid]} position={{ x: el.x, y: el.y }} onStop={(e, data) => handleDragStop(e, data, el.id)}>
                                <TableDropZone element={el} onDrop={(guestId, tableName) => handleAssignGuestToTable(guestId, tableName)}>
                                <div ref={nodeRef} id={el.id} className="absolute cursor-grab active:cursor-grabbing" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`, zIndex: el.zIndex || (isArea ? 0 : 1) }}>
                                    <div className={cn('w-full h-full border flex flex-col p-1', selectedElementId === el.id ? 'border-primary shadow-lg z-10' : 'border-gray-500', isRound ? 'rounded-full' : 'rounded-sm')}
                                        style={{ backgroundColor: el.backgroundColor || (isArea ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.7)') }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}>
                                        <p className={cn("text-xs font-bold text-center truncate", isArea ? 'text-blue-800' : 'text-base')}>{el.name}</p>
                                        <div className="text-[9px] space-y-0.5 overflow-y-auto flex-grow">
                                            {assignedGuests.map(g => (
                                                <div key={g.id} className="flex items-center gap-1 group relative">
                                                    <span className="truncate">{g.nombre}</span>
                                                    <button onClick={() => handleUnassignGuest(g.id)} className="hidden group-hover:block text-destructive">
                                                        <X className="w-3 h-3"/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {selectedElementId === el.id && (<div className="absolute -top-7 -right-2 flex gap-0.5 z-20" style={{transform: `rotate(-${el.rotation || 0}deg)`}}><Button type="button" variant="ghost" size="icon" className="h-6 w-6 bg-white" onClick={() => handleOpenEditModal(el)}><Edit className="w-3 h-3"/></Button><Button type="button" variant="ghost" size="icon" className="h-6 w-6 bg-white" onClick={() => handleElementRotation(el.id)}><RotateCw className="w-3 h-3"/></Button><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive bg-white" onClick={() => handleDeleteElement(el.id)}><Trash2 className="w-3 h-3"/></Button></div>)}
                                </div>
                                </TableDropZone>
                            </Draggable>
                            )
                        })}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function SalonLayoutPage() {
    return (
        <DndProvider backend={HTML5Backend}>
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
                <AsignacionMesasContent />
            </Suspense>
        </DndProvider>
    );
}

    