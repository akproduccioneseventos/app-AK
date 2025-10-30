
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Users, LayoutDashboard, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, Invitado, LayoutElement } from '@/types/fiesta';
import { getFiestaById, updateInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NextImage from 'next/image';
import { cn } from '@/lib/utils';


const GUEST_ITEM_TYPE = 'guest';

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
    <div ref={drop} className={cn("absolute", isOver && "ring-2 ring-offset-2 ring-primary rounded-full")}>
        {children}
    </div>
  );
};

function AsignacionMesasContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      toast({ title: "Error", description: "ID de evento no encontrado." });
      return;
    }
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Evento no encontrado.");
      setFiesta(fiestaData);
      const tables = (fiestaData.decoracion?.salonElements || [])
        .filter(el => el.category?.toLowerCase().includes('mesa'))
        .map(el => el.name)
        .sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
      setTableNames(tables);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTableAssignment = async (guestId: string, newTableNumber?: string) => {
    if (!fiesta || !fiestaId) return;

    const invitadoOriginal = fiesta.invitados?.find(inv => inv.id === guestId);
    if (!invitadoOriginal) return;

    const invitadoActualizado: Invitado = { ...invitadoOriginal, tableNumber: newTableNumber === 'sin-mesa' ? undefined : newTableNumber };
    
    // Optimistic update
    setFiesta(prev => prev ? ({ ...prev, invitados: (prev.invitados || []).map(inv => inv.id === guestId ? invitadoActualizado : inv) }) : null);

    try {
      const result = await updateInvitadoFiestaActual(fiestaId, invitadoActualizado);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al asignar", description: e.message, variant: "destructive" });
      setFiesta(prev => prev ? ({ ...prev, invitados: (prev.invitados || []).map(inv => inv.id === guestId ? invitadoOriginal : inv) }) : null);
    }
  };

  const filteredGuests = useMemo(() => {
    if (!fiesta?.invitados) return { conMesa: [], sinMesa: [] };
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    const confirmedGuests = fiesta.invitados.filter(g => g.rsvp === 'Confirmado');

    const conMesa = confirmedGuests
      .filter(g => g.tableNumber && g.nombre.toLowerCase().includes(lowerCaseSearch))
      .sort((a,b) => (a.tableNumber || '').localeCompare(b.tableNumber || ''));
      
    const sinMesa = confirmedGuests
      .filter(g => !g.tableNumber && g.nombre.toLowerCase().includes(lowerCaseSearch))
      .sort((a,b) => a.nombre.localeCompare(b.nombre));

    return { conMesa, sinMesa };
  }, [fiesta?.invitados, searchTerm]);

  if (isLoading || !fiesta) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin"/></div>
  }

  const decoracion = fiesta.decoracion;
  const pixelsPerMeter = decoracion?.pixelsPerMeter || 40;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Asignación de Mesas</h1>
        </div>
        <Link href={`/portal?fiestaId=${fiestaId}`} passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Portal</Button></Link>
      </div>

       <Tabs defaultValue="lista">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lista">Asignación por Lista</TabsTrigger>
            <TabsTrigger value="visual">Asignación Visual en Salón</TabsTrigger>
        </TabsList>
        <TabsContent value="lista">
            <Card>
                <CardHeader>
                    <CardTitle>Asignar Invitados a Mesas</CardTitle>
                    <CardDescription>Selecciona una mesa para cada invitado confirmado.</CardDescription>
                     <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Buscar invitado por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10"/>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Invitado</TableHead><TableHead className="w-[200px]">Mesa Asignada</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredGuests.sinMesa.map(invitado => (
                               <TableRow key={invitado.id}><TableCell>{invitado.nombre}</TableCell><TableCell><Select value={invitado.tableNumber || 'sin-mesa'} onValueChange={(val) => handleTableAssignment(invitado.id, val)}><SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="sin-mesa">Sin Asignar</SelectItem>{tableNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></TableCell></TableRow>
                            ))}
                             {filteredGuests.conMesa.map(invitado => (
                               <TableRow key={invitado.id}><TableCell>{invitado.nombre}</TableCell><TableCell><Select value={invitado.tableNumber || 'sin-mesa'} onValueChange={(val) => handleTableAssignment(invitado.id, val)}><SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="sin-mesa">Sin Asignar</SelectItem>{tableNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="visual">
             <div className="grid grid-cols-12 gap-4 h-[calc(100vh-300px)]">
                 <Card className="col-span-3"><CardHeader><CardTitle>Invitados sin Mesa</CardTitle></CardHeader><CardContent className="space-y-2">
                    {filteredGuests.sinMesa.map(guest => <GuestCard key={guest.id} guest={guest} />)}
                </CardContent></Card>
                <div className="col-span-9 bg-card p-2 overflow-auto border rounded-md">
                     <div className="relative canvas-grid-background" style={{ width: `${(decoracion?.salonWidth || 15) * pixelsPerMeter}px`, height: `${(decoracion?.salonHeight || 15) * pixelsPerMeter}px` }}>
                        {decoracion?.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50"/>)}
                        {(decoracion?.salonElements || []).map(element => {
                             const assignedGuests = (fiesta?.invitados || []).filter(inv => inv.tableNumber === element.name);
                             return (
                                <TableDropZone key={element.id} element={element} onDrop={(guestId, tableName) => handleTableAssignment(guestId, tableName)}>
                                    <div style={{ left: `${element.x}px`, top: `${element.y}px`, width: `${element.width}px`, height: `${element.height}px` }} className="absolute">
                                      <div className={cn('w-full h-full border flex flex-col p-1', element.shape === 'circle' ? 'rounded-full' : 'rounded-sm', 'bg-white/70 border-gray-500')}>
                                        <p className="text-xs font-bold text-center truncate">{element.name}</p>
                                        <div className="text-[9px] space-y-0.5 overflow-y-auto">
                                            {assignedGuests.map(g => (
                                                <div key={g.id} className="flex items-center gap-1 group relative">
                                                    <span className="truncate">{g.nombre}</span>
                                                    <button onClick={() => handleTableAssignment(g.id, undefined)} className="hidden group-hover:block text-destructive">x</button>
                                                </div>
                                            ))}
                                        </div>
                                      </div>
                                    </div>
                                </TableDropZone>
                            );
                        })}
                     </div>
                </div>
             </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function PortalMesasPage() {
    return (
        <DndProvider backend={HTML5Backend}>
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
                <AsignacionMesasContent />
            </Suspense>
        </DndProvider>
    );
}

    