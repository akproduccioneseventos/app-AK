
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


function AsignacionMesasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [decoracion, setDecoracion] = useState<DecoracionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const [scale, setScale] = useState(1);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  
  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError("No se proporcionó ID de evento.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if(!fiestaData) throw new Error("Evento no encontrado.");
      setFiesta(fiestaData);
      setDecoracion(fiestaData.decoracion || { salonElements: [], pixelsPerMeter: PIXELS_PER_METER_DEFAULT, salonWidth: 15, salonHeight: 15 });
    } catch (err: any) {
      setError("Error al cargar la información del evento.");
      console.error("Error fetching data for table lookup:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveAll = async () => {
    if (!decoracion || !fiestaId) return;
    setIsSaving(true);
    try {
        await updateDecoracionFiestaActual(fiestaId, decoracion);
        toast({ title: "¡Guardado!", description: "El diseño del salón ha sido guardado." });
        await loadData();
    } catch(err: any) {
        toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
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


  if (isLoading || !fiesta) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando diseñador de mesas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center bg-destructive/10"><AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-3" /><CardTitle className="text-xl font-semibold text-destructive">Error</CardTitle></CardHeader>
        <CardContent className="text-center space-y-4 py-6"><p className="text-muted-foreground">{error}</p></CardContent>
      </Card>
    );
  }
  
  if (!decoracion) return null;
  const pixelsPerMeter = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;

  return (
    <>
      <Card className="max-w-6xl mx-auto shadow-xl">
          <CardHeader className="text-center">
              <PartyPopper className="w-10 h-10 mx-auto text-primary" />
              <CardTitle className="font-headline text-3xl">Organiza tus Mesas</CardTitle>
              <CardDescription>Arrastra los invitados a las mesas para asignar sus lugares.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-350px)] min-h-[500px]">
                  <Card className="xl:col-span-3 flex flex-col">
                      <CardHeader className="pb-3">
                          <CardTitle>Invitados sin Mesa ({filteredGuests.sinMesa.length})</CardTitle>
                          <div className="relative pt-2">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="Buscar..." value={guestSearchTerm} onChange={(e) => setGuestSearchTerm(e.target.value)} className="w-full pl-10"/>
                          </div>
                      </CardHeader>
                      <CardContent className="flex-grow min-h-0 p-3">
                          <ScrollArea className="h-full">
                              <div className="space-y-2 pr-4">
                                  {filteredGuests.sinMesa.map(guest => <GuestCard key={guest.id} guest={guest} />)}
                              </div>
                          </ScrollArea>
                      </CardContent>
                  </Card>
                  <div className="xl:col-span-9 bg-card flex flex-col">
                      <Card className="h-full flex flex-col flex-grow">
                          <CardHeader className="flex-row justify-between items-center p-3">
                              <CardTitle className="text-md">Lienzo del Salón</CardTitle>
                              <div className="flex items-center gap-1">
                                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setScale(s => s / 1.2)}><ZoomOut className="w-4 h-4"/></Button>
                                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setScale(s => s * 1.2)}><ZoomIn className="w-4 h-4"/></Button>
                              </div>
                          </CardHeader>
                          <CardContent className="flex-grow p-1 overflow-auto">
                          <div className="relative canvas-grid-background" style={{ width: `${(decoracion.salonWidth || 15) * pixelsPerMeter}px`, height: `${(decoracion.salonHeight || 15) * pixelsPerMeter}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                              {decoracion.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50"/>)}
                              {(decoracion.salonElements || []).map(el => {
                                  const assignedGuests = (fiesta?.invitados || []).filter(inv => inv.tableNumber === el.name);
                                  const assignedSeatsCount = assignedGuests.reduce((sum, g) => sum + (g.partySize || 1), 0);
                                  const isRound = el.shape === 'circle';

                                  return (
                                      <TableDropZone key={el.id} element={el} onDrop={handleAssignGuestToTable}>
                                      <div id={el.id} className="absolute" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)` }}>
                                          {el.seats && Array.from({ length: el.seats }).map((_, i) => (
                                              <Seat key={i} index={i} total={el.seats!} isOccupied={i < assignedSeatsCount} isRound={isRound} width={el.width} height={el.height} />
                                          ))}
                                          <div className={cn('w-full h-full border flex flex-col p-1', selectedElementId === el.id ? 'border-primary shadow-lg z-10' : 'border-gray-500', isRound && 'rounded-full')}
                                              style={{ backgroundColor: el.backgroundColor || 'rgba(255, 255, 255, 0.7)' }}
                                              onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}>
                                              <p className="text-xs font-bold text-center truncate">{el.name}</p>
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
                                      </div>
                                      </TableDropZone>
                                  )
                              })}
                              </div>
                          </CardContent>
                      </Card>
                  </div>
              </div>
          </CardContent>
          <CardFooter className="flex justify-end">
              <Button onClick={handleSaveAll} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                  Guardar Cambios
              </Button>
          </CardFooter>
      </Card>
    </>
  );
}


export default function MesaPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background flex flex-col items-center justify-center p-4">
            <Suspense fallback={
                 <div className="flex flex-col items-center justify-center text-center p-8">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-lg text-muted-foreground">Cargando...</p>
                </div>
            }>
                <DndProvider backend={HTML5Backend}>
                    <AsignacionMesasContent />
                </DndProvider>
            </Suspense>
        </div>
    );
}
