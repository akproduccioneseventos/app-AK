
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Disc, Clapperboard, Sofa, Camera as CameraIcon, Search, Printer, Settings2, FolderDown, FolderUp, Maximize, ZoomIn, ZoomOut, Upload, Map, ChevronsUp, ChevronsDown, X, Armchair, PartyPopper, Ticket, UserMinus, CookingPot, Beer, Layers } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const GUEST_ITEM_TYPE = 'guest';
const PIXELS_PER_METER_DEFAULT = 40;
const grid = 10;

interface GuestDragItem {
  id: string;
}

const GuestCard: React.FC<{ guest: Invitado }> = ({ guest }) => {
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
        "p-3 border rounded-xl bg-white shadow-sm cursor-grab hover:border-primary/50 transition-all",
        isDragging && "opacity-50"
      )}
    >
      <p className="font-bold text-sm text-slate-800 truncate">{guest.nombre}</p>
      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{guest.partySize || 1} persona(s)</p>
    </div>
  );
};

const Seat: React.FC<{
  isOccupied: boolean;
  isRound: boolean;
  width: number;
  height: number;
  index: number;
  total: number;
}> = ({ isOccupied, isRound, width, height, index, total }) => {
  let style: React.CSSProperties = {};
  if (isRound) {
    const angle = index * (360 / total);
    const radius = Math.min(width, height) / 2 + 12;
    style = {
      transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`,
      transformOrigin: 'center center',
      left: `calc(50% - 0.5rem)`,
      top: `calc(50% - 0.5rem)`,
    };
  } else {
    const perimeter = 2 * (width + height);
    if (total === 0) return null;
    const seatSpacing = perimeter / total;
    let currentPosition = index * seatSpacing;
    let x = 0, y = 0;
    if (currentPosition <= width) { x = currentPosition; y = -15; } 
    else if (currentPosition <= width + height) { x = width + 15; y = currentPosition - width; } 
    else if (currentPosition <= 2 * width + height) { x = width - (currentPosition - (width + height)); y = height + 15; } 
    else { x = -15; y = height - (currentPosition - (2 * width + height)); }
    style = { left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' };
  }
  return (
    <div
      className={cn("absolute w-4 h-4 rounded-full border-2 transition-colors duration-500", isOccupied ? "bg-primary border-white shadow-sm scale-110" : "border-slate-300 bg-white")}
      style={style}
    ></div>
  );
};

const DraggableElement: React.FC<{
    el: LayoutElement;
    isSelected: boolean;
    onSelect: () => void;
    onStop: (e: any, data: DraggableData) => void;
    onDrop: (guestId: string, tableName: string) => void;
    onUnassign: (guestId: string) => void;
    onEdit: () => void;
    onRotate: () => void;
    onDelete: () => void;
    onLayer: (direction: 'up' | 'down') => void;
    assignedGuests: Invitado[];
    assignedSeatsCount: number;
}> = ({ el, isSelected, onSelect, onStop, onDrop, onUnassign, onEdit, onRotate, onDelete, onLayer, assignedGuests, assignedSeatsCount }) => {
    const nodeRef = useRef(null);
    const isRound = el.shape === 'circle';
    const isArea = el.type === 'area';

    const [{ isOver }, drop] = useDrop(() => ({
        accept: GUEST_ITEM_TYPE,
        drop: (item: GuestDragItem) => onDrop(item.id, el.name),
        collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    }));

    const attachRef = (node: any) => {
        nodeRef.current = node;
        drop(node);
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds="parent"
            grid={[grid, grid]}
            position={{ x: el.x, y: el.y }}
            onStop={onStop}
        >
            <div
                ref={attachRef}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                className={cn(
                    "absolute cursor-grab active:cursor-grabbing",
                    isSelected ? "z-50" : "z-10",
                    isOver && "scale-105"
                )}
                style={{ width: el.width, height: el.height }}
            >
                <div className="w-full h-full relative" style={{ transform: `rotate(${el.rotation}deg)` }}>
                    {!isArea && Array.from({ length: el.seats || 0 }).map((_, i) => (
                        <Seat key={i} index={i} total={el.seats || 0} isOccupied={i < assignedSeatsCount} isRound={isRound} width={el.width} height={el.height} />
                    ))}
                    <div 
                        className={cn(
                            'w-full h-full border-2 flex flex-col p-2 overflow-hidden transition-all duration-300', 
                            isRound && 'rounded-full',
                            isSelected ? 'border-primary shadow-2xl' : 'border-slate-400 shadow-sm',
                            isOver && 'border-primary bg-primary/10 ring-4 ring-primary/20'
                        )}
                        style={{ backgroundColor: el.backgroundColor || (isArea ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.9)') }}
                    >
                        <div className="flex flex-col items-center justify-center h-full">
                            <p className={cn("text-[10px] font-black text-center truncate uppercase tracking-tighter", isArea ? 'text-blue-800' : 'text-slate-800')}>
                                {el.name}
                            </p>
                            {!isArea && (
                                <p className="text-[9px] text-center text-muted-foreground font-bold mt-0.5">
                                    {assignedSeatsCount}/{el.seats || '∞'}
                                </p>
                            )}
                            <div className="text-[8px] space-y-0.5 overflow-hidden mt-1 text-center font-bold text-slate-600">
                                {assignedGuests.slice(0, 3).map(g => (
                                    <div key={g.id} className="flex items-center justify-center gap-1 group/guest">
                                        <span className="truncate">{g.nombre}</span>
                                        <button onClick={(e) => { e.stopPropagation(); onUnassign(g.id); }} className="hidden group-hover/guest:block text-destructive"><UserMinus className="w-2.5 h-2.5"/></button>
                                    </div>
                                ))}
                                {assignedGuests.length > 3 && <p className="opacity-50">+ {assignedGuests.length - 3} más</p>}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Modern Toolbar */}
                {isSelected && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl p-1.5 rounded-2xl z-[100]" 
                        style={{ transform: `translateX(-50%) rotate(-${el.rotation}deg)` }}
                    >
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Editar medidas"><Settings2 className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); onRotate(); }} title="Rotar 45°"><RotateCw className="w-4 h-4"/></Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100" title="Capas"><Layers className="w-4 h-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="rounded-xl">
                                <DropdownMenuItem onClick={() => onLayer('up')}><ChevronsUp className="w-4 h-4 mr-2"/> Traer al Frente</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onLayer('down')}><ChevronsDown className="w-4 h-4 mr-2"/> Enviar al Fondo</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Separator orientation="vertical" className="h-6 mx-1"/>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Eliminar"><Trash2 className="w-4 h-4"/></Button>
                    </motion.div>
                )}
            </div>
        </Draggable>
    );
};

function SalonLayoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<SalonLayoutTemplate[]>([]);
  const [isTemplateActionLoading, setIsTemplateActionLoading] = useState(false);
  const [processingPointName, setProcessingPointName] = useState<string | null>(null);

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
      router.replace('/eventos');
    } else {
        loadData();
    }
  }, [fiestaId, loadData, router]);
  
  const handleDragStop = (e: any, data: DraggableData, elementId: string) => {
    if (!decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el =>
      el.id === elementId ? { ...el, x: Math.round(data.x / grid) * grid, y: Math.round(data.y / grid) * grid } : el
    );
    setDecoracion({ ...decoracion, salonElements: newElements });
  };
  
 const addElement = (category: string, customProps?: Partial<LayoutElement>, type: LayoutElementType = 'element') => {
    if (!decoracion) return;
    const ppm = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;
    let defaultProps: Partial<LayoutElement> = { width: 2 * ppm, height: 2 * ppm, seats: 8, shape: 'circle' };

    if (category === 'Mesa Rectangular') { defaultProps = { width: 3 * ppm, height: 1.5 * ppm, seats: 8, shape: 'rectangle' }; }
    else if (category === 'Pista de Baile') { defaultProps = { width: 6 * ppm, height: 5 * ppm, seats: undefined, backgroundColor: 'rgba(56, 189, 248, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Escenario') { defaultProps = { width: 5 * ppm, height: 3 * ppm, seats: undefined, backgroundColor: 'rgba(139, 92, 246, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Living') { defaultProps = { width: 4 * ppm, height: 4 * ppm, seats: undefined, backgroundColor: 'rgba(234, 179, 8, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Área de Fotos') { defaultProps = { width: 3 * ppm, height: 2.5 * ppm, seats: undefined, backgroundColor: 'rgba(236, 72, 153, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Barra') { defaultProps = { width: 4 * ppm, height: 1.5 * ppm, seats: undefined, backgroundColor: 'rgba(16, 185, 129, 0.2)', shape: 'rectangle' }; }

    const newElement: LayoutElement = {
      id: `el_${Date.now()}`, 
      name: customProps?.name || `${category} ${(decoracion.salonElements?.filter(e => e.category === category).length || 0) + 1}`,
      x: 40, y: 40, rotation: 0, 
      zIndex: type === 'area' ? 0 : (decoracion.salonElements?.length || 0) + 1,
      ...defaultProps, 
      ...customProps, 
      category, 
      type: type,
    };
    setDecoracion(prev => prev ? ({ ...prev, salonElements: [...(prev.salonElements || []), newElement] }) : null);
  };
  
  const handleUpdateElement = () => {
    if (!editingElement || !decoracion) return;
    setDecoracion({ ...decoracion, salonElements: (decoracion.salonElements || []).map(el => el.id === editingElement.id ? editingElement : el ) });
    setIsEditModalOpen(false);
    setEditingElement(null);
  };
  
  const handleElementRotation = (elementId: string) => {
    if (!decoracion) return;
    setDecoracion({ ...decoracion, salonElements: (decoracion.salonElements || []).map(el => el.id === elementId ? { ...el, rotation: (el.rotation || 0) + 45 % 360 } : el ) });
  };

  const handleElementLayering = (elementId: string, direction: 'up' | 'down') => {
    if (!decoracion) return;
    const currentElements = decoracion.salonElements || [];
    const maxZ = Math.max(...currentElements.map(e => e.zIndex || 0), 0);
    const minZ = Math.min(...currentElements.map(e => e.zIndex || 0), 0);

    setDecoracion({
        ...decoracion,
        salonElements: currentElements.map(el => el.id === elementId ? { ...el, zIndex: direction === 'up' ? maxZ + 1 : minZ - 1 } : el)
    });
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
        toast({ title: "¡Diseño Guardado!", description: "La distribución del salón ha sido actualizada." });
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

  const handleDeleteTemplate = async (templateId: string) => {
    setProcessingPointName(templateId);
    try {
      const result = await deleteSalonLayoutTemplate(templateId);
      if (result.success) {
        toast({ title: "Plantilla eliminada" });
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        setTemplates(updatedTemplates);
      } else throw new Error(result.error);
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudo eliminar la plantilla.", variant: "destructive" });
    } finally {
      setProcessingPointName(null);
    }
  };
  
  const handleAssignGuestToTable = async (guestId: string, tableName: string | null) => {
    const guestToUpdate = fiesta?.invitados?.find(inv => inv.id === guestId);
    if (!guestToUpdate || !fiestaId) return;
    setFiesta(prevFiesta => prevFiesta ? ({ ...prevFiesta, invitados: (prevFiesta.invitados || []).map(inv => inv.id === guestId ? { ...inv, tableNumber: tableName === null ? undefined : tableName } : inv) }) : null);
    try {
        const result = await updateInvitadoFiestaActual(fiestaId, { ...guestToUpdate, tableNumber: tableName === null ? undefined : tableName });
        if (!result.success) throw new Error(result.error);
    } catch (e: any) {
       toast({ title: "Error", description: `No se pudo guardar la asignación: ${e.message}`, variant: "destructive"});
       loadData(false);
    }
  };

  const handleBackgroundImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId || !decoracion) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiestaId, file);
      if(result.success && result.url) {
        setDecoracion({ ...decoracion, salonPlanBackgroundImageUrl: result.url });
        toast({ title: "Plano cargado correctamente" });
      } else throw new Error(result.error);
    } catch (e: any) {
      toast({ title: "Error al subir", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredGuests = useMemo(() => {
    if (!fiesta?.invitados) return { conMesa: [], sinMesa: [] };
    const lowerCaseSearch = guestSearchTerm.toLowerCase();
    const guestsToConsider = fiesta.invitados;
    return {
        conMesa: guestsToConsider.filter(g => g.tableNumber && g.nombre.toLowerCase().includes(lowerCaseSearch)).sort((a,b) => (a.tableNumber || '').localeCompare(b.tableNumber || '')),
        sinMesa: guestsToConsider.filter(g => !g.tableNumber && g.nombre.toLowerCase().includes(lowerCaseSearch)).sort((a,b) => a.nombre.localeCompare(b.nombre))
    };
  }, [fiesta?.invitados, guestSearchTerm]);

  if (isLoading || !fiestaId) return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>
  if (error || !decoracion || !fiesta) return <div className="text-destructive text-center p-4">{error}</div>
  
  const pixelsPerMeter = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;

  return (
    <div className="space-y-6">
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-3xl border-none">
          <DialogHeader><DialogTitle className="font-headline text-2xl">Ajustar Medidas</DialogTitle></DialogHeader>
          {editingElement && (
            <div className="space-y-6 py-4">
              <div className="space-y-2"><Label htmlFor="el-name" className="text-xs uppercase font-black tracking-widest text-slate-400">Nombre del Elemento</Label><Input id="el-name" value={editingElement.name} onChange={e => setEditingElement(prev => prev ? {...prev, name: e.target.value} : null)} className="rounded-xl h-12 bg-slate-50 border-none"/></div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs uppercase font-black tracking-widest text-slate-400">Ancho (m)</Label><Input type="number" step="0.1" value={(editingElement.width / pixelsPerMeter).toFixed(1)} onChange={e => setEditingElement(prev => prev ? {...prev, width: Number(e.target.value) * pixelsPerMeter} : null)} className="rounded-xl h-12 bg-slate-50 border-none"/></div>
                  <div className="space-y-2"><Label className="text-xs uppercase font-black tracking-widest text-slate-400">Alto (m)</Label><Input type="number" step="0.1" value={(editingElement.height / pixelsPerMeter).toFixed(1)} onChange={e => setEditingElement(prev => prev ? {...prev, height: Number(e.target.value) * pixelsPerMeter} : null)} className="rounded-xl h-12 bg-slate-50 border-none"/></div>
              </div>
              {editingElement.category?.includes('Mesa') && (<div className="space-y-2"><Label className="text-xs uppercase font-black tracking-widest text-slate-400">Cantidad de Asientos</Label><Input type="number" value={editingElement.seats || 0} onChange={e => setEditingElement(prev => prev ? {...prev, seats: Number(e.target.value) || 0} : null)} className="rounded-xl h-12 bg-slate-50 border-none"/></div>)}
               <div className="space-y-2"><Label className="text-xs uppercase font-black tracking-widest text-slate-400">Color Visual</Label><div className="flex gap-3"><Input type="color" value={editingElement.backgroundColor || '#ffffff'} onChange={e => setEditingElement(prev => prev ? {...prev, backgroundColor: e.target.value} : null)} className="w-12 h-12 p-1 rounded-xl"/><Input value={editingElement.backgroundColor || '#ffffff'} onChange={e => setEditingElement(prev => prev ? {...prev, backgroundColor: e.target.value} : null)} className="rounded-xl h-12 bg-slate-50 border-none"/></div></div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl h-12 flex-1">Cancelar</Button>
            <Button onClick={handleUpdateElement} className="rounded-xl h-12 flex-1 shadow-lg shadow-primary/20">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoadTemplateModalOpen} onOpenChange={setIsLoadTemplateModalOpen}>
        <DialogContent className="rounded-3xl border-none">
          <DialogHeader><DialogTitle className="font-headline text-2xl">Cargar Plantilla</DialogTitle></DialogHeader>
          {isTemplateActionLoading ? <div className="p-8 text-center"><Loader2 className="w-12 h-12 animate-spin text-primary mx-auto"/></div> : 
            templates.length === 0 ? <p className="text-center text-slate-400 py-12">No hay plantillas guardadas.</p> :
            <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-3">
                    {templates.map(t => (
                        <div key={t.id} className="p-4 border rounded-2xl flex items-center justify-between group hover:border-primary/50 transition-all">
                            <div>
                                <p className="font-bold text-slate-800">{t.name}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{t.layoutData.salonElements?.length || 0} elementos</p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => { setDecoracion(t.layoutData); setIsLoadTemplateModalOpen(false); toast({title:"Plantilla cargada"}); }} size="sm" className="rounded-xl h-9 px-4 font-bold">Cargar</Button>
                                <Button onClick={() => handleDeleteTemplate(t.id)} variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-destructive hover:bg-red-50" disabled={processingPointName === t.id}>
                                    {processingPointName === t.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
          }
        </DialogContent>
      </Dialog>
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white">
                <LayoutDashboard className="w-6 h-6"/>
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 font-headline uppercase">Diseño del Salón</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Planifica el espacio y asigna mesas</p>
            </div>
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={handleLoadTemplate} className="rounded-xl border-slate-200"><FolderUp className="w-4 h-4 mr-2"/>Cargar Plantilla</Button>
            <Link href={`/fiestas/nueva/decoracion/pdf?fiestaId=${fiestaId}&layout=true`} passHref className="flex-1 md:flex-none">
                <Button variant="outline" className="w-full rounded-xl border-slate-200"><Printer className="w-4 h-4 mr-2"/>Imprimir Plano</Button>
            </Link>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref className="flex-1 md:flex-none">
                <Button variant="outline" className="w-full rounded-xl border-slate-200"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
            </Link>
         </div>
      </div>

       <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-2xl h-14 border border-slate-200">
            <TabsTrigger value="visual" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:shadow-lg">Diseño Visual</TabsTrigger>
            <TabsTrigger value="list" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:shadow-lg">Gestión de Lista</TabsTrigger>
        </TabsList>
        <TabsContent value="visual">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-400px)] pt-4">
            <Card className="xl:col-span-3 flex flex-col border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-md">
                <CardHeader className="p-6 bg-slate-50 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Invitados Sin Mesa</CardTitle>
                    <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none">{filteredGuests.sinMesa.length}</Badge>
                  </div>
                  <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Buscar por nombre..." value={guestSearchTerm} onChange={(e) => setGuestSearchTerm(e.target.value)} className="w-full pl-10 h-10 text-xs rounded-xl bg-white border-slate-200"/></div>
                </CardHeader>
                <CardContent className="flex-grow min-h-0 p-4"><ScrollArea className="h-full"><div className="space-y-2 pr-4">{filteredGuests.sinMesa.map(guest => <GuestCard key={guest.id} guest={guest} />)}</div></ScrollArea></CardContent>
            </Card>
            <div className={cn("xl:col-span-9 flex flex-col transition-all duration-500", isFullScreen ? 'fixed inset-0 z-[100] p-6 bg-slate-900/95 backdrop-blur-3xl' : '')}>
                <Card className="h-full flex flex-col flex-grow border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
                    <CardHeader className="flex-row justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                         <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="rounded-xl h-10 w-10 hover:bg-white shadow-sm" title="Pantalla Completa"><Maximize className="w-5 h-5 text-slate-600"/></Button>
                         <Separator orientation="vertical" className="h-6"/>
                         <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setScale(s => Math.max(0.2, s / 1.2))}><ZoomOut className="w-4 h-4 text-slate-400"/></Button>
                            <span className="text-[10px] font-black w-10 text-center text-slate-400">{Math.round(scale * 100)}%</span>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setScale(s => Math.min(3, s * 1.2))}><ZoomIn className="w-4 h-4 text-slate-400"/></Button>
                         </div>
                      </div>
                      <div className="flex gap-2">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="default" className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Elemento</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                                  <DropdownMenuGroup>
                                      <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Mesa Redonda')}><Circle className="w-4 h-4 mr-2 text-primary"/> Mesa Redonda</DropdownMenuItem>
                                      <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Mesa Rectangular')}><Square className="w-4 h-4 mr-2 text-primary"/> Mesa Rectangular</DropdownMenuItem>
                                      <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Living')}><Sofa className="w-4 h-4 mr-2 text-primary"/> Living / Relax</DropdownMenuItem>
                                  </DropdownMenuGroup>
                                  <DropdownMenuSeparator/>
                                  <DropdownMenuGroup>
                                      <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Pista de Baile', undefined, 'area')}><Disc className="w-4 h-4 mr-2 text-indigo-500"/> Pista de Baile</DropdownMenuItem>
                                      <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Escenario', undefined, 'area')}><Clapperboard className="w-4 h-4 mr-2 text-indigo-500"/> Escenario</DropdownMenuItem>
                                      <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Barra', undefined, 'area')}><Beer className="w-4 h-4 mr-2 text-emerald-500"/> Barra de Tragos</DropdownMenuItem>
                                  </DropdownMenuGroup>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 overflow-auto relative bg-slate-50/30" onMouseDown={() => setSelectedElementId(null)}>
                        <div className="relative canvas-grid-background transition-transform duration-300 ease-out" style={{ width: `${(decoracion.salonWidth || 15) * pixelsPerMeter}px`, height: `${(decoracion.salonHeight || 15) * pixelsPerMeter}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                            {decoracion.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano de Fondo" layout="fill" objectFit="contain" className="opacity-40 pointer-events-none"/>)}
                            {(decoracion.salonElements || []).sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)).map(el => {
                                const assignedGuests = (fiesta?.invitados || []).filter(inv => inv.tableNumber === el.name);
                                const assignedSeatsCount = assignedGuests.reduce((sum, g) => sum + (g.partySize || 1), 0);
                                return (
                                    <DraggableElement 
                                        key={el.id} 
                                        el={el} 
                                        isSelected={selectedElementId === el.id}
                                        onSelect={() => setSelectedElementId(el.id)}
                                        onStop={(e, data) => handleDragStop(e, data, el.id)}
                                        onDrop={handleAssignGuestToTable}
                                        onUnassign={guestId => handleAssignGuestToTable(guestId, null)}
                                        onEdit={() => { setEditingElement(el); setIsEditModalOpen(true); }}
                                        onRotate={() => handleElementRotation(el.id)}
                                        onDelete={() => handleDeleteElement(el.id)}
                                        onLayer={(dir) => handleElementLayering(el.id, dir)}
                                        assignedGuests={assignedGuests}
                                        assignedSeatsCount={assignedSeatsCount}
                                    />
                                );
                            })}
                        </div>
                    </CardContent>
                    <CardFooter className="p-3 bg-white border-t border-slate-100">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="settings" className="border-none">
                          <AccordionTrigger className="text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:no-underline text-slate-400">Configuración del Plano</AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Ancho (m)</Label><Input type="number" value={decoracion.salonWidth || ''} onChange={e => setDecoracion({...decoracion, salonWidth: Number(e.target.value)})} className="h-10 rounded-xl bg-slate-50 border-none"/></div>
                                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Alto (m)</Label><Input type="number" value={decoracion.salonHeight || ''} onChange={e => setDecoracion({...decoracion, salonHeight: Number(e.target.value)})} className="h-10 rounded-xl bg-slate-50 border-none"/></div>
                                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Escala (px/m)</Label><Input type="number" value={decoracion.pixelsPerMeter || ''} onChange={e => setDecoracion({...decoracion, pixelsPerMeter: Number(e.target.value)})} className="h-10 rounded-xl bg-slate-50 border-none"/></div>
                                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Imagen de Plano</Label>
                                    <div className="flex gap-2">
                                        <Input type="file" onChange={handleBackgroundImageUpload} disabled={isUploading} className="hidden" id="bg-upload-input" />
                                        <Button asChild variant="outline" className="w-full h-10 rounded-xl border-dashed border-slate-300">
                                            <label htmlFor="bg-upload-input" className="cursor-pointer">
                                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4 mr-2"/>}
                                                {decoracion.salonPlanBackgroundImageUrl ? 'Cambiar Imagen' : 'Subir Plano'}
                                            </label>
                                        </Button>
                                        {decoracion.salonPlanBackgroundImageUrl && <Button variant="ghost" size="icon" onClick={() => setDecoracion({...decoracion, salonPlanBackgroundImageUrl: undefined})} className="text-destructive h-10 w-10 rounded-xl"><Trash2 className="w-4 h-4"/></Button>}
                                    </div>
                                </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardFooter>
                </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="list" className="pt-4">
             <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between p-6 bg-slate-50 border-b border-slate-100">
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Listado Maestro de Asignación</CardTitle>
                        <CardDescription className="text-xs">Gestiona las mesas de forma masiva</CardDescription>
                    </div>
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input placeholder="Buscar invitado..." value={guestSearchTerm} onChange={(e) => setGuestSearchTerm(e.target.value)} className="w-full pl-10 h-10 text-xs rounded-xl bg-white border-slate-200"/>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest pl-8">Invitado</TableHead>
                                <TableHead className="text-center font-bold text-slate-400 uppercase text-[10px] tracking-widest">Capacidad</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Mesa Asignada</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredGuests.sinMesa.map(guest => (
                                <TableRow key={guest.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                                    <TableCell className="font-medium text-sm pl-8 text-slate-700">{guest.nombre}</TableCell>
                                    <TableCell className="text-center text-sm font-bold text-slate-400">{guest.partySize}</TableCell>
                                    <TableCell>
                                        <Select value={guest.tableNumber || ''} onValueChange={(val) => handleAssignGuestToTable(guest.id, val)}>
                                            <SelectTrigger className="rounded-xl h-10 border-slate-200 bg-white">
                                                <SelectValue placeholder="Elegir mesa..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {(decoracion.salonElements || []).filter(el => el.category?.includes("Mesa")).map(t => (
                                                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredGuests.conMesa.map(guest => (
                                <TableRow key={guest.id} className="bg-emerald-50/30 border-b border-emerald-100 hover:bg-emerald-50/50">
                                    <TableCell className="font-bold text-sm pl-8 text-emerald-700">{guest.nombre}</TableCell>
                                    <TableCell className="text-center text-sm font-black text-emerald-600">{guest.partySize}</TableCell>
                                    <TableCell>
                                        <Select value={guest.tableNumber || 'sin-mesa'} onValueChange={(val) => val === 'sin-mesa' ? handleAssignGuestToTable(guest.id, null) : handleAssignGuestToTable(guest.id, val)}>
                                            <SelectTrigger className="rounded-xl h-10 border-emerald-200 bg-white shadow-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {(decoracion.salonElements || []).filter(el => el.category?.includes("Mesa")).map(t => (
                                                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                                                ))}
                                                <DropdownMenuSeparator className="bg-slate-100"/>
                                                <SelectItem value="sin-mesa" className="text-destructive font-bold uppercase text-[10px] tracking-widest">ELIMINAR ASIGNACIÓN</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button onClick={handleSaveAll} disabled={isSaving} size="lg" className="rounded-2xl px-10 h-14 font-black text-base shadow-2xl shadow-primary/30">
            {isSaving ? <Loader2 className="w-5 h-5 mr-3 animate-spin"/> : <Save className="w-5 h-5 mr-3"/>} GUARDAR DISTRIBUCIÓN
        </Button>
      </div>
    </div>
  );
}

export default function SalonLayoutPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}>
            <DndProvider backend={HTML5Backend}>
                <SalonLayoutContent />
            </DndProvider>
        </Suspense>
    );
}
