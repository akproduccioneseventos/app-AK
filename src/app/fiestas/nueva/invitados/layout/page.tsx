
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Disc, Clapperboard, Sofa, Camera as CameraIcon, Search, Printer, Settings2, FolderDown, FolderUp, Maximize, ZoomIn, ZoomOut, Upload, Map, ChevronsUp, ChevronsDown, X, Armchair, PartyPopper, Ticket } from 'lucide-react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, Invitado, DecoracionData, LayoutElementType } from '@/types/fiesta';
import { updateInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import { getFiestaById, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { saveSalonLayoutTemplate, getSalonLayoutTemplates, type SalonLayoutTemplate, deleteSalonLayoutTemplate } from '@/app/actions/salon-layout-templates';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const Seat: React.FC<{ angle?: number; distance?: number; isOccupied: boolean; isRound: boolean; width: number; height: number; index: number; total: number; }> = ({ angle, distance, isOccupied, isRound, width, height, index, total }) => {
    let style: React.CSSProperties = {};
    if (isRound) {
        const calculatedAngle = angle ?? (index * (360 / total));
        const calculatedDistance = distance ?? (Math.min(width, height) / 2 + 15);
         style = {
            transform: `rotate(${calculatedAngle}deg) translate(${calculatedDistance}px) rotate(-${calculatedAngle}deg)`,
        };
    } else {
        const perimeter = 2 * (width + height);
        const seatSpacing = perimeter / total;
        let currentPosition = index * seatSpacing;
        let x=0, y=0;

        if (currentPosition < width) { // Top edge
            x = currentPosition;
            y = -10;
        } else if (currentPosition < width + height) { // Right edge
            x = width + 10;
            y = currentPosition - width;
        } else if (currentPosition < 2 * width + height) { // Bottom edge
            x = width - (currentPosition - (width + height));
            y = height + 10;
        } else { // Left edge
            x = -10;
            y = height - (currentPosition - (2 * width + height));
        }
        
        style = {
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-50%, -50%)',
        };
    }

    return (
        <div className={cn(
            "absolute w-4 h-4 rounded-full border-2",
            isOccupied ? "bg-primary border-primary-foreground" : "border-primary",
             !isRound && "absolute"
        )} style={style}>
        </div>
    );
};


function SalonLayoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
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
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      
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
    
    let defaultProps: Partial<LayoutElement> = { width: 100, height: 100, seats: 8, shape: 'circle' };

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
    const guestsToConsider = fiesta.invitados.filter(g => g.rsvp === 'Confirmado');

    const conMesa = guestsToConsider
      .filter(g => g.tableNumber && g.nombre.toLowerCase().includes(lowerCaseSearch))
      .sort((a,b) => (a.tableNumber || '').localeCompare(b.tableNumber || ''));
      
    const sinMesa = guestsToConsider
      .filter(g => !g.tableNumber && g.nombre.toLowerCase().includes(lowerCaseSearch))
      .sort((a,b) => a.nombre.localeCompare(b.nombre));

    return { conMesa, sinMesa };
  }, [fiesta?.invitados, guestSearchTerm]);
  

  if (isLoading || !fiestaId) return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>
  if (error || !decoracion || !fiesta) return <div className="text-destructive text-center p-4">{error}</div>
  
  const pixelsPerMeter = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;

  return (
    <div className="space-y-6">
      {/* Modals */}
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Elemento: {editingElement?.name}</DialogTitle></DialogHeader>
          {editingElement && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="el-name">Nombre</Label>
                <Input id="el-name" value={editingElement.name} onChange={e => setEditingElement(prev => prev ? {...prev, name: e.target.value} : null)}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                      <Label htmlFor="el-width">Ancho (m)</Label>
                      <Input id="el-width" type="number" value={(editingElement.width / pixelsPerMeter).toFixed(2)} onChange={e => setEditingElement(prev => prev ? {...prev, width: Number(e.target.value) * pixelsPerMeter} : null)}/>
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="el-height">Alto (m)</Label>
                      <Input id="el-height" type="number" value={(editingElement.height / pixelsPerMeter).toFixed(2)} onChange={e => setEditingElement(prev => prev ? {...prev, height: Number(e.target.value) * pixelsPerMeter} : null)}/>
                  </div>
              </div>
              {editingElement.category?.includes('Mesa') && (
                  <div className="space-y-1">
                      <Label htmlFor="el-seats">Asientos</Label>
                      <Input id="el-seats" type="number" value={editingElement.seats || 0} onChange={e => setEditingElement(prev => prev ? {...prev, seats: Number(e.target.value) || 0} : null)}/>
                  </div>
              )}
               <div className="space-y-1">
                  <Label htmlFor="el-color">Color de Fondo</Label>
                  <Input id="el-color" type="color" value={editingElement.backgroundColor || '#ffffff'} onChange={e => setEditingElement(prev => prev ? {...prev, backgroundColor: e.target.value} : null)}/>
              </div>
              <div className="flex items-center gap-2">
                  <Label>Capas:</Label>
                  <Button size="sm" variant="outline" onClick={() => handleElementLayering(editingElement.id, 'up')}><ChevronsUp className="w-4 h-4 mr-1"/>Traer al frente</Button>
                  <Button size="sm" variant="outline" onClick={() => handleElementLayering(editingElement.id, 'down')}><ChevronsDown className="w-4 h-4 mr-1"/>Enviar al fondo</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateElement}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isCustomElementModalOpen} onOpenChange={setIsCustomElementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Elemento o Área Personalizada</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="custom-el-type">Tipo</Label>
              <RadioGroup value={customElement.type} onValueChange={(v) => setCustomElement(p=>({...p, type:v as any}))} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="element" id="type-element"/><Label htmlFor="type-element">Elemento</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="area" id="type-area"/><Label htmlFor="type-area">Área/Zona</Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-1"><Label htmlFor="custom-el-name">Nombre</Label><Input id="custom-el-name" value={customElement.name} onChange={e => setCustomElement(p => ({...p, name: e.target.value}))}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label htmlFor="custom-el-width">Ancho (m)</Label><Input id="custom-el-width" type="number" value={customElement.width} onChange={e => setCustomElement(p => ({...p, width: Number(e.target.value)}))}/></div>
              <div className="space-y-1"><Label htmlFor="custom-el-height">Alto (m)</Label><Input id="custom-el-height" type="number" value={customElement.height} onChange={e => setCustomElement(p => ({...p, height: Number(e.target.value)}))}/></div>
            </div>
            <div className="space-y-1"><Label>Forma</Label><RadioGroup defaultValue="rectangle" value={customElement.shape} onValueChange={(v) => setCustomElement(p=>({...p, shape:v as any}))} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="rectangle" id="shape-rect"/><Label htmlFor="shape-rect">Rectángulo</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="circle" id="shape-circ"/><Label htmlFor="shape-circ">Círculo</Label></div></RadioGroup></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleAddCustomElement}>Añadir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isLoadTemplateModalOpen} onOpenChange={setIsLoadTemplateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar Plantilla de Salón</DialogTitle>
          </DialogHeader>
          {isTemplateActionLoading ? <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin"/></div> : templates.length === 0 ? <p className="text-muted-foreground p-4 text-center">No hay plantillas guardadas.</p> : <ScrollArea className="max-h-64"><div className="space-y-2 pr-4">{templates.map(t => <div key={t.name} className="flex items-center justify-between p-2 rounded-md border"><span className="font-medium text-sm">{t.name}</span><div className="flex gap-1"><Button size="sm" onClick={() => { setDecoracion(t.layoutData); setIsLoadTemplateModalOpen(false); toast({title:'Plantilla cargada'}); }}>Cargar</Button><Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteTemplate(t.id)} disabled={!!processingPointName}>{processingPointName === t.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}</Button></div></div>)}</div></ScrollArea>}
        </DialogContent>
      </Dialog>
      <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Diseño como Plantilla</DialogTitle>
          </DialogHeader>
          <div className="py-2"><Label>Nombre:</Label><Input value={templateName} onChange={e => setTemplateName(e.target.value)}/></div>
          <DialogFooter><Button variant="outline" onClick={()=>setIsSaveTemplateModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveAsTemplate} disabled={isTemplateActionLoading}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
       
       <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary"/>
            Diseño del Salón y Asignación de Mesas
        </h1>
        <Link href={`/fiestas/nueva/decoracion/pdf?fiestaId=${fiestaId}&layout=true`} passHref><Button variant="secondary"><Printer className="w-4 h-4 mr-2"/>Imprimir Plano</Button></Link>
      </div>

       <Tabs defaultValue="visual">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Asignación por Lista</TabsTrigger>
          <TabsTrigger value="visual">Diseño Visual del Salón</TabsTrigger>
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
                                <TableCell><Select value={guest.tableNumber || 'sin-mesa'} onValueChange={(val) => val === 'sin-mesa' ? handleUnassignGuest(guest.id) : handleAssignGuestToTable(guest.id, val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(decoracion.salonElements || []).filter(el => el.category?.includes("Mesa")).map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}<Separator/><SelectItem value="sin-mesa" className="text-destructive">Quitar de mesa</SelectItem></SelectContent></Select></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table></CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="visual">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-450px)]">
            <Card className="xl:col-span-3 flex flex-col">
                <CardHeader className="p-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md">Invitados sin Mesa ({filteredGuests.sinMesa.length})</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setGuestSearchTerm('')}>Limpiar</Button>
                  </div>
                  <div className="relative pt-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar..." value={guestSearchTerm} onChange={(e) => setGuestSearchTerm(e.target.value)} className="w-full pl-10 h-8"/></div>
                </CardHeader>
                <CardContent className="flex-grow min-h-0 p-3"><ScrollArea className="h-full"><div className="space-y-2 pr-4">{filteredGuests.sinMesa.map(guest => <GuestCard key={guest.id} guest={guest} />)}</div></ScrollArea></CardContent>
            </Card>
            <div className={cn("xl:col-span-9 bg-card flex flex-col", isFullScreen ? 'fixed inset-0 z-40 p-4' : '')}>
                <Card className="h-full flex flex-col flex-grow">
                    <CardHeader className="flex-row justify-between items-center p-3">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-md">Lienzo del Salón</CardTitle>
                         <Button variant="outline" size="sm" onClick={() => setIsFullScreen(!isFullScreen)}><Maximize className="w-4 h-4"/></Button>
                         <div className="flex items-center gap-1"><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setScale(s => s / 1.2)}><ZoomOut className="w-4 h-4"/></Button><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setScale(s => s * 1.2)}><ZoomIn className="w-4 h-4"/></Button></div>
                      </div>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="secondary" size="sm"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Elemento</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => addElement('Mesa Redonda')}><Circle className="w-4 h-4 mr-2"/>Mesa Redonda</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addElement('Mesa Rectangular')}><Square className="w-4 h-4 mr-2"/>Mesa Rectangular</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addElement('Pista de Baile', undefined, 'area')}><Disc className="w-4 h-4 mr-2"/>Pista de Baile</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addElement('Escenario', undefined, 'area')}><Clapperboard className="w-4 h-4 mr-2"/>Escenario</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addElement('Living', undefined, 'area')}><Sofa className="w-4 h-4 mr-2"/>Living</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addElement('Área de Fotos', undefined, 'area')}><CameraIcon className="w-4 h-4 mr-2"/>Área de Fotos</DropdownMenuItem>
                               <DropdownMenuItem onClick={() => setIsCustomElementModalOpen(true)}><Armchair className="w-4 h-4 mr-2"/>Otro...</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="flex-grow p-1 overflow-auto">
                    <div className="relative canvas-grid-background" style={{ width: `${(decoracion.salonWidth || 15) * pixelsPerMeter}px`, height: `${(decoracion.salonHeight || 15) * pixelsPerMeter}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                        {decoracion.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50"/>)}
                        {(decoracion.salonElements || []).sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)).map(el => {
                            const nodeRef = React.createRef<HTMLDivElement>();
                            const isRound = el.shape === 'circle';
                            const assignedGuests = (fiesta?.invitados || []).filter(inv => inv.tableNumber === el.name);
                            const assignedSeatsCount = assignedGuests.reduce((sum, g) => sum + (g.partySize || 1), 0);
                            const isArea = el.type === 'area';
                            return (
                            <Draggable key={el.id} nodeRef={nodeRef} bounds="parent" grid={[grid, grid]} position={{ x: el.x, y: el.y }} onStop={(e, data) => handleDragStop(e, data, el.id)}>
                                <TableDropZone element={el} onDrop={(guestId, tableName) => handleAssignGuestToTable(guestId, tableName)}>
                                <div ref={nodeRef} id={el.id} className="absolute cursor-grab active:cursor-grabbing" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`, zIndex: el.zIndex || (isArea ? 0 : 1) }}>
                                     {el.seats && Array.from({ length: el.seats }).map((_, i) => (
                                        <Seat key={i} index={i} total={el.seats!} isOccupied={i < assignedSeatsCount} isRound={isRound} width={el.width} height={el.height} />
                                      ))}
                                    <div className={cn('w-full h-full border flex flex-col p-1', selectedElementId === el.id ? 'border-primary shadow-lg z-10' : 'border-gray-500', isRound && 'rounded-full')}
                                        style={{ backgroundColor: el.backgroundColor || (isArea ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.7)') }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}>
                                        <p className={cn("text-xs font-bold text-center truncate", isArea ? 'text-blue-800' : 'text-base')}>{el.name}</p>
                                        <p className="text-[10px] text-center text-muted-foreground">{assignedSeatsCount}/{el.seats || 'N/A'}</p>
                                        <div className="text-[9px] space-y-0.5 overflow-y-auto flex-grow mt-1 text-center">
                                            {assignedGuests.map(g => (
                                                <div key={g.id} className="flex items-center justify-center gap-1 group relative">
                                                    <span className="truncate">{g.nombre} ({g.partySize})</span>
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
                    <CardFooter className="p-2 border-t">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="settings">
                          <AccordionTrigger className="text-xs px-2 py-1">Ajustes del Plano</AccordionTrigger>
                          <AccordionContent className="p-2 space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1"><Label htmlFor="salon-w" className="text-xs">Ancho (m)</Label><Input id="salon-w" type="number" value={decoracion.salonWidth || ''} onChange={e => setDecoracion({...decoracion, salonWidth: Number(e.target.value)})} className="h-8"/></div>
                                <div className="space-y-1"><Label htmlFor="salon-h" className="text-xs">Alto (m)</Label><Input id="salon-h" type="number" value={decoracion.salonHeight || ''} onChange={e => setDecoracion({...decoracion, salonHeight: Number(e.target.value)})} className="h-8"/></div>
                                <div className="space-y-1"><Label htmlFor="salon-ppm" className="text-xs">Escala (px/m)</Label><Input id="salon-ppm" type="number" value={decoracion.pixelsPerMeter || ''} onChange={e => setDecoracion({...decoracion, pixelsPerMeter: Number(e.target.value)})} className="h-8"/></div>
                            </div>
                            <div className="space-y-1"><Label htmlFor="bg-upload" className="text-xs">Plano de Fondo (JPG/PNG)</Label><Input id="bg-upload" type="file" onChange={handleBackgroundImageUpload} disabled={isUploading} className="text-xs h-9"/></div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardFooter>
                </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end pt-4 border-t">
        <div className="flex gap-2">
            <Button variant="secondary" onClick={handleLoadTemplate} disabled={isSaving || isTemplateActionLoading}>
                {isTemplateActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <FolderUp className="w-4 h-4 mr-2"/>} Cargar Plantilla
            </Button>
            <Button variant="secondary" onClick={() => setIsSaveTemplateModalOpen(true)} disabled={isSaving}>
                <FolderDown className="w-4 h-4 mr-2"/> Guardar como Plantilla
            </Button>
            <Button onClick={handleSaveAll} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>} Guardar Diseño
            </Button>
        </div>
      </div>
    </div>
  );
}


export default function SalonLayoutPage() {
    return (
        <DndProvider backend={HTML5Backend}>
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
                <SalonLayoutContent />
            </Suspense>
        </DndProvider>
    );
}
