
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Square, Circle, Users, LayoutDashboard, Disc, Clapperboard, Sofa, Camera as CameraIcon, Map, PartyPopper, Ticket, Search, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, Invitado, DecoracionData, LayoutElementType } from '@/types/fiesta';
import { getFiestaById, updateInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import NextImage from 'next/image';
import { cn } from "@/lib/utils";
import Draggable from 'react-draggable';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const PIXELS_PER_METER_DEFAULT = 40;
const GUEST_ITEM_TYPE = 'guest';

// --- Sub-components for Drag and Drop ---
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
    <div ref={drag} className={cn("p-2 border rounded-md bg-background shadow-sm cursor-grab", isDragging && "opacity-50")}>
      <p className="font-medium text-sm truncate">{guest.nombre}</p>
      <p className="text-xs text-muted-foreground">{guest.partySize || 1} persona(s)</p>
    </div>
  );
};

const TableDropZone: React.FC<{
    element: LayoutElement;
    onDrop: (guestId: string, tableName: string) => void;
    children: React.ReactNode;
}> = ({ element, onDrop, children }) => {
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

// --- Main Content Component ---
function AsignacionMesasContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [decoracion, setDecoracion] = useState<DecoracionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      console.error("Error fetching data for table assignment:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleAssignGuestToTable = async (guestId: string, tableName: string | null) => {
    if (!fiesta) return;
    
    const guestToUpdate = fiesta.invitados?.find(inv => inv.id === guestId);
    if (!guestToUpdate) return;
    
    const updatedGuest: Invitado = { ...guestToUpdate, tableNumber: tableName === null ? undefined : tableName };

    // Optimistic UI update
    setFiesta(prevFiesta => {
        if (!prevFiesta) return null;
        return {
            ...prevFiesta,
            invitados: (prevFiesta.invitados || []).map(inv => inv.id === guestId ? updatedGuest : inv),
        };
    });

    try {
      const result = await updateInvitadoFiestaActual(fiesta.id, updatedGuest);
      if (!result.success) {
        throw new Error(result.error || "No se pudo guardar la asignación.");
      }
      toast({ title: "Asignación Guardada", description: `${updatedGuest.nombre} -> ${tableName || 'Sin mesa'}`});
    } catch (e: any) {
       toast({ title: "Error", description: `No se pudo guardar la asignación: ${e.message}`, variant: "destructive"});
       loadData(); // Revert on error
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
    return <div className="flex flex-col items-center justify-center text-center p-8"><Loader2 className="w-12 h-12 animate-spin text-primary mb-4" /><p className="text-lg text-muted-foreground">Cargando diseñador de mesas...</p></div>;
  }

  if (error) {
    return <Card className="w-full max-w-md shadow-lg"><CardHeader className="text-center bg-destructive/10"><AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-3" /><CardTitle className="text-xl font-semibold text-destructive">Error</CardTitle></CardHeader><CardContent className="text-center space-y-4 py-6"><p className="text-muted-foreground">{error}</p></CardContent></Card>;
  }
  
  if (!decoracion) return null;
  const pixelsPerMeter = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;

  return (
    <>
      <Card className="max-w-6xl w-full mx-auto shadow-xl">
          <CardHeader className="text-center">
              <PartyPopper className="w-10 h-10 mx-auto text-primary" />
              <CardTitle className="font-headline text-3xl">Organiza tus Mesas</CardTitle>
              <CardDescription>Arrastra los invitados a las mesas para asignar sus lugares.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="visual">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="visual">Diseño Visual</TabsTrigger>
                    <TabsTrigger value="list">Lista Manual</TabsTrigger>
                </TabsList>
                <TabsContent value="visual">
                   <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-450px)] pt-4">
                     <Card className="xl:col-span-3 flex flex-col">
                        <CardHeader className="p-3"><CardTitle className="text-md">Invitados sin Mesa ({filteredGuests.sinMesa.length})</CardTitle></CardHeader>
                        <CardContent className="flex-grow min-h-0 p-3"><ScrollArea className="h-full"><div className="space-y-2 pr-4">{filteredGuests.sinMesa.map(guest => <GuestCard key={guest.id} guest={guest} />)}</div></ScrollArea></CardContent>
                    </Card>
                     <div className="xl:col-span-9 bg-card border rounded-lg p-2 h-full overflow-auto">
                        <div className="relative canvas-grid-background" style={{ width: `${(decoracion.salonWidth || 15) * pixelsPerMeter}px`, height: `${(decoracion.salonHeight || 15) * pixelsPerMeter}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                           {decoracion.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50"/>)}
                            {(decoracion.salonElements || []).map(el => {
                                const assignedGuests = (fiesta?.invitados || []).filter(inv => inv.tableNumber === el.name);
                                const assignedSeatsCount = assignedGuests.reduce((sum, g) => sum + (g.partySize || 1), 0);
                                const isRound = el.shape === 'circle';

                                return (
                                    <Draggable key={el.id} position={{ x: el.x, y: el.y }} disabled>
                                        <TableDropZone element={el} onDrop={(guestId) => handleAssignGuestToTable(guestId, el.name)}>
                                            <div id={el.id} className="absolute" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`, zIndex: el.zIndex || (el.type === 'area' ? 0 : 1) }}>
                                                <div className={cn('w-full h-full border flex flex-col p-1 border-gray-500', isRound && 'rounded-full')} style={{ backgroundColor: el.backgroundColor || 'rgba(255, 255, 255, 0.7)' }}>
                                                    <p className="text-xs font-bold text-center truncate">{el.name}</p>
                                                    <p className="text-[10px] text-center text-muted-foreground">{assignedSeatsCount}/{el.seats || 'N/A'}</p>
                                                    <div className="text-[9px] space-y-0.5 overflow-y-auto flex-grow mt-1 text-center">
                                                      {assignedGuests.map(g => (
                                                        <div key={g.id} className="flex items-center justify-center gap-1 group relative">
                                                          <span className="truncate">{g.nombre} ({g.partySize})</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableDropZone>
                                    </Draggable>
                                )
                            })}
                        </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="list">
                    <div className="pt-4">
                        <div className="relative mb-4"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar invitado..." value={guestSearchTerm} onChange={(e) => setGuestSearchTerm(e.target.value)} className="w-full max-w-sm pl-8"/></div>
                        <ScrollArea className="h-[50vh] border rounded-md">
                            <Table>
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
                                            <TableCell><Select value={guest.tableNumber || 'sin-mesa'} onValueChange={(val) => val === 'sin-mesa' ? handleAssignGuestToTable(guest.id, null) : handleAssignGuestToTable(guest.id, val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(decoracion.salonElements || []).filter(el => el.category?.includes("Mesa")).map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}<Separator/><SelectItem value="sin-mesa" className="text-destructive">Quitar de mesa</SelectItem></SelectContent></Select></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </TabsContent>
            </Tabs>
          </CardContent>
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
