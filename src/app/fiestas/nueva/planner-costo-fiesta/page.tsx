
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Disc, Clapperboard, Sofa, Camera as CameraIcon, Search, Printer, Settings2, FolderDown, FolderUp, Maximize, ZoomIn, ZoomOut, Upload, Map, ChevronsUp, ChevronsDown, X, Armchair, PartyPopper, Ticket, UserMinus, CookingPot, Beer } from 'lucide-react';
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
      ref={drag as unknown as React.Ref<HTMLDivElement>}
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
      className={cn("absolute w-4 h-4 rounded-full border-2", isOccupied ? "bg-primary border-primary-foreground" : "border-primary bg-background")}
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
    assignedGuests: Invitado[];
    assignedSeatsCount: number;
}> = ({ el, isSelected, onSelect, onStop, onDrop, onUnassign, onEdit, onRotate, onDelete, assignedGuests, assignedSeatsCount }) => {
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
                    "absolute cursor-grab active:cursor-grabbing transition-all",
                    isSelected ? "z-30 ring-2 ring-primary ring-offset-2" : "z-10",
                    isOver && "bg-primary/20 scale-105 ring-4 ring-primary"
                )}
                style={{ width: el.width, height: el.height }}
            >
                <div className="w-full h-full relative" style={{ transform: `rotate(${el.rotation}deg)` }}>
                    {Array.from({ length: el.seats || 0 }).map((_, i) => (
                        <Seat key={i} index={i} total={el.seats || 0} isOccupied={i < assignedSeatsCount} isRound={isRound} width={el.width} height={el.height} />
                    ))}
                    <div 
                        className={cn('w-full h-full border flex flex-col p-1 overflow-hidden', isRound && 'rounded-full')}
                        style={{ backgroundColor: el.backgroundColor || (isArea ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.7)') }}
                    >
                        <p className={cn("text-[10px] font-black text-center truncate uppercase tracking-tighter mt-1", isArea ? 'text-blue-800' : 'text-slate-800')}>
                            {el.name}
                        </p>
                        <p className="text-[9px] text-center text-muted-foreground font-bold">{assignedSeatsCount}/{el.seats || '∞'}</p>
                        <div className="text-[8px] space-y-0.5 overflow-hidden flex-grow mt-1 text-center font-medium">
                            {assignedGuests.slice(0, 4).map(g => (
                                <div key={g.id} className="flex items-center justify-center gap-1 group/guest">
                                    <span className="truncate">{g.nombre}</span>
                                    <button onClick={(e) => { e.stopPropagation(); onUnassign(g.id); }} className="hidden group-hover/guest:block text-destructive"><UserMinus className="w-2.5 h-2.5"/></button>
                                </div>
                            ))}
                            {assignedGuests.length > 4 && <p className="opacity-50">+ {assignedGuests.length - 4} más</p>}
                        </div>
                    </div>
                </div>
                
                {/* Floating Toolbar */}
                {isSelected && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border shadow-xl p-1 rounded-full z-50 animate-in fade-in zoom-in-95" style={{ transform: `translateX(-50%) rotate(-${el.rotation}deg)` }}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); onEdit(); }}><Edit className="w-3.5 h-3.5"/></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); onRotate(); }}><RotateCw className="w-3.5 h-3.5"/></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="w-3.5 h-3.5"/></Button>
                    </div>
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

  const [scale, setScale] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');

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
    let defaultProps: Partial<LayoutElement> = { width: 100, height: 100, seats: 8, shape: 'circle' };
    if (category === 'Mesa Rectangular') { defaultProps = { width: 160, height: 80, seats: 8, shape: 'rectangle' }; }
    else if (category === 'Pista de Baile') { defaultProps = { width: 240, height: 200, seats: undefined, backgroundColor: 'rgba(56, 189, 248, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Escenario') { defaultProps = { width: 200, height: 100, seats: undefined, backgroundColor: 'rgba(139, 92, 246, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Living') { defaultProps = { width: 180, height: 180, seats: undefined, backgroundColor: 'rgba(234, 179, 8, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Área de Fotos') { defaultProps = { width: 160, height: 100, seats: undefined, backgroundColor: 'rgba(236, 72, 153, 0.2)', shape: 'rectangle' }; }

    const newElement: LayoutElement = {
      id: `el_${Date.now()}`, 
      name: customProps?.name || `${category} ${ (decoracion.salonElements?.filter(e => e.category === category).length || 0) + 1}`,
      x: 20, y: 20, rotation: 0, 
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

  const filteredGuests = useMemo(() => {
    if (!fiesta?.invitados) return { conMesa: [], sinMesa: [] };
    const lowerCaseSearch = guestSearchTerm.toLowerCase();
    const guestsToConsider = fiesta.invitados;
    return {
        conMesa: guestsToConsider.filter(g => g.tableNumber && g.nombre.toLowerCase().includes(lowerCaseSearch)).sort((a,b) => (a.tableNumber || '').localeCompare(b.tableNumber || '')),
        sinMesa: guestsToConsider.filter(g => !g.tableNumber && g.nombre.toLowerCase().includes(lowerCaseSearch)).sort((a,b) => a.nombre.localeCompare(b.nombre))
    };
  }, [fiesta?.invitados, guestSearchTerm]);

  if (isLoading || !fiestaId) return <div className="flex items-center justify-center p-8"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>
  if (error || !decoracion || !fiesta) return <div className="text-destructive text-center p-4">{error}</div>
  
  const pixelsPerMeter = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;

  return (
    <div className="space-y-6">
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Elemento: {editingElement?.name}</DialogTitle></DialogHeader>
          {editingElement && (
            <div className="space-y-4">
              <div className="space-y-1"><Label htmlFor="el-name">Nombre</Label><Input id="el-name" value={editingElement.name} onChange={e => setEditingElement(prev => prev ? {...prev, name: e.target.value} : null)}/></div>
              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label htmlFor="el-width">Ancho (m)</Label><Input id="el-width" type="number" value={(editingElement.width / pixelsPerMeter).toFixed(2)} onChange={e => setEditingElement(prev => prev ? {...prev, width: Number(e.target.value) * pixelsPerMeter} : null)}/></div>
                  <div className="space-y-1"><Label htmlFor="el-height">Alto (m)</Label><Input id="el-height" type="number" value={(editingElement.height / pixelsPerMeter).toFixed(2)} onChange={e => setEditingElement(prev => prev ? {...prev, height: Number(e.target.value) * pixelsPerMeter} : null)}/></div>
              </div>
              {editingElement.category?.includes('Mesa') && (<div className="space-y-1"><Label htmlFor="el-seats">Asientos</Label><Input id="el-seats" type="number" value={editingElement.seats || 0} onChange={e => setEditingElement(prev => prev ? {...prev, seats: Number(e.target.value) || 0} : null)}/></div>)}
               <div className="space-y-1"><Label htmlFor="el-color">Color de Fondo</Label><Input id="el-color" type="color" value={editingElement.backgroundColor || '#ffffff'} onChange={e => setEditingElement(prev => prev ? {...prev, backgroundColor: e.target.value} : null)}/></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button><Button onClick={handleUpdateElement}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
       
       <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2"><LayoutDashboard className="w-6 h-6 text-primary"/>Diseño del Salón</h1>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>

       <Tabs defaultValue="visual">
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="visual">Diseño Visual</TabsTrigger><TabsTrigger value="list">Asignación por Lista</TabsTrigger></TabsList>
        <TabsContent value="visual">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-450px)] pt-4">
            <Card className="xl:col-span-3 flex flex-col">
                <CardHeader className="p-3"><CardTitle className="text-md font-headline">Invitados sin Mesa ({filteredGuests.sinMesa.length})</CardTitle><div className="relative pt-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar..." value={guestSearchTerm} onChange={(e) => setGuestSearchTerm(e.target.value)} className="w-full pl-10 h-8 text-xs"/></div></CardHeader>
                <CardContent className="flex-grow min-h-0 p-3"><ScrollArea className="h-full"><div className="space-y-2 pr-4">{filteredGuests.sinMesa.map(guest => <GuestCard key={guest.id} guest={guest} />)}</div></ScrollArea></CardContent>
            </Card>
            <div className={cn("xl:col-span-9 bg-card flex flex-col", isFullScreen ? 'fixed inset-0 z-40 p-4' : '')}>
                <Card className="h-full flex flex-col flex-grow">
                    <CardHeader className="flex-row justify-between items-center p-3 border-b">
                      <div className="flex items-center gap-2 flex-wrap">
                         <Button variant="outline" size="sm" onClick={() => setIsFullScreen(!isFullScreen)}><Maximize className="w-4 h-4"/></Button>
                         <div className="flex items-center gap-1"><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setScale(s => s / 1.2)}><ZoomOut className="w-4 h-4"/></Button><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setScale(s => s * 1.2)}><ZoomIn className="w-4 h-4"/></Button></div>
                      </div>
                      <div className="flex gap-2">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="default" size="sm"><PlusCircle className="w-4 h-4 mr-2"/>Añadir</Button></DropdownMenuTrigger>
                              <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => addElement('Mesa Redonda')}><Circle className="w-4 h-4 mr-2"/>Mesa Redonda</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addElement('Mesa Rectangular')}><Square className="w-4 h-4 mr-2"/>Mesa Rectangular</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addElement('Living')}><Sofa className="w-4 h-4 mr-2"/>Living</DropdownMenuItem>
                                  <DropdownMenuSeparator/><DropdownMenuItem onClick={() => addElement('Pista de Baile', undefined, 'area')}><Disc className="w-4 h-4 mr-2"/>Pista de Baile</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => addElement('Escenario', undefined, 'area')}><Clapperboard className="w-4 h-4 mr-2"/>Escenario</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 overflow-auto relative">
                        <div className="relative canvas-grid-background" style={{ width: `${(decoracion.salonWidth || 15) * pixelsPerMeter}px`, height: `${(decoracion.salonHeight || 15) * pixelsPerMeter}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                            {decoracion.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50 pointer-events-none"/>)}
                            {(decoracion.salonElements || []).map(el => {
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
                                        assignedGuests={assignedGuests}
                                        assignedSeatsCount={assignedSeatsCount}
                                    />
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="list">
             <Card><CardContent className="pt-6"><Table><TableHeader><TableRow><TableHead>Invitado</TableHead><TableHead className="text-center">Personas</TableHead><TableHead>Mesa Asignada</TableHead></TableRow></TableHeader><TableBody>{filteredGuests.sinMesa.map(guest => (<TableRow key={guest.id}><TableCell className="font-medium text-xs">{guest.nombre}</TableCell><TableCell className="text-center text-xs">{guest.partySize}</TableCell><TableCell><Select value={guest.tableNumber || ''} onValueChange={(val) => handleAssignGuestToTable(guest.id, val)}><SelectTrigger><SelectValue placeholder="Asignar mesa..." /></SelectTrigger><SelectContent>{(decoracion.salonElements || []).filter(el => el.category?.includes("Mesa")).map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent></Select></TableCell></TableRow>))}{filteredGuests.conMesa.map(guest => (<TableRow key={guest.id} className="bg-green-50/50"><TableCell className="font-medium text-xs">{guest.nombre}</TableCell><TableCell className="text-center text-xs">{guest.partySize}</TableCell><TableCell><Select value={guest.tableNumber || 'sin-mesa'} onValueChange={(val) => val === 'sin-mesa' ? handleAssignGuestToTable(guest.id, null) : handleAssignGuestToTable(guest.id, val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(decoracion.salonElements || []).filter(el => el.category?.includes("Mesa")).map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}<Separator/><SelectItem value="sin-mesa" className="text-destructive">Quitar de mesa</SelectItem></SelectContent></Select></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end pt-4 border-t"><Button onClick={handleSaveAll} disabled={isSaving} size="lg">{isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>} Guardar Diseño</Button></div>
    </div>
  );
}

export default function PlannerCostoFiestaPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>}><DndProvider backend={HTML5Backend}><SalonLayoutContent /></DndProvider></Suspense>
    );
}
