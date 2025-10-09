
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Music, Beer, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Image as ImageIcon } from 'lucide-react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, Invitado, DecoracionData } from '@/types/fiesta';
import { getFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { Separator } from '@/components/ui/separator';

const grid = 20;

export default function SalonLayoutPage() {
  const { toast } = useToast();
  const [decoracion, setDecoracion] = useState<DecoracionData | null>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingElement, setEditingElement] = useState<LayoutElement | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fiesta = await getFiestaActual();
      setDecoracion(fiesta.decoracion || { salonElements: [], salonWidth: 800, salonHeight: 600 });
      setInvitados(fiesta.invitados || []);
    } catch (e: any) {
      setError("No se pudo cargar la información del evento.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDragStop = (e: DraggableEvent, data: DraggableData, elementId: string) => {
    if (!decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el =>
      el.id === elementId ? { ...el, x: Math.round(data.x / grid) * grid, y: Math.round(data.y / grid) * grid } : el
    );
    setDecoracion({ ...decoracion, salonElements: newElements });
  };
  
  const addElement = (category: string) => {
    if (!decoracion) return;
    const newElement: LayoutElement = {
      id: `el_${Date.now()}`,
      name: `${category} ${ (decoracion.salonElements?.filter(e => e.category === category).length || 0) + 1}`,
      x: 20, y: 20,
      width: category.includes('Mesa') ? 100 : 120,
      height: category.includes('Mesa Redonda') ? 100 : (category.includes('Mesa Rectangular') ? 60 : 100),
      rotation: 0,
      quantity: 1,
      type: 'predefined',
      category: category,
      seats: category.includes('Mesa') ? 8 : undefined,
    };
    setDecoracion({ ...decoracion, salonElements: [...(decoracion.salonElements || []), newElement] });
  };

  const handleOpenEditModal = (element: LayoutElement) => {
    setEditingElement(element);
    setIsEditModalOpen(true);
  };

  const handleUpdateElement = () => {
    if (!editingElement || !decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el => el.id === editingElement.id ? editingElement : el);
    setDecoracion({ ...decoracion, salonElements: newElements });
    setIsEditModalOpen(false);
    setEditingElement(null);
  };
  
  const handleElementRotation = (elementId: string) => {
    if (!decoracion) return;
    const newElements = (decoracion.salonElements || []).map(el => {
      if (el.id === elementId) {
        return { ...el, rotation: (el.rotation + 45) % 360 };
      }
      return el;
    });
    setDecoracion({ ...decoracion, salonElements: newElements });
  };

  const handleDeleteElement = (elementId: string) => {
    if (!decoracion) return;
    setDecoracion({
      ...decoracion,
      salonElements: (decoracion.salonElements || []).filter(el => el.id !== elementId)
    });
  };
  
  const handleGuestDrop = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData('guestId');
    const table = decoracion?.salonElements?.find(el => el.id === tableId);
    const guestsAtTable = invitados.filter(i => i.tableNumber === table?.name).reduce((acc, g) => acc + (g.partySize || 1), 0);
    const guestBeingDragged = invitados.find(i => i.id === guestId);
    const guestPartySize = guestBeingDragged?.partySize || 1;

    if (table && table.seats !== undefined && (guestsAtTable + guestPartySize) > table.seats) {
      toast({ title: "Mesa Llena", description: `La mesa "${table.name}" no tiene suficientes asientos para este grupo.`, variant: "destructive" });
      return;
    }

    setInvitados(prev => prev.map(inv => inv.id === guestId ? { ...inv, tableNumber: table?.name || undefined } : inv));
  };

  const handleUnassignGuest = (guestId: string) => {
    setInvitados(prev => prev.map(inv => inv.id === guestId ? { ...inv, tableNumber: undefined } : inv));
  };
  
  const handleSave = async () => {
    if (!decoracion) return;
    setIsSaving(true);
    try {
        const result = await updateDecoracionFiestaActual(decoracion);
        if (result.success) {
            toast({ title: "¡Guardado!", description: "La distribución del salón ha sido guardada." });
            await loadData();
        } else {
            throw new Error(result.error || "No se pudo guardar la distribución.");
        }
    } catch(err: any) {
        toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
};

  const invitadosConfirmados = useMemo(() => invitados.filter(i => i.rsvp === 'Confirmado'), [invitados]);
  const invitadosSinMesa = useMemo(() => invitadosConfirmados.filter(i => !i.tableNumber), [invitadosConfirmados]);

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-destructive text-center p-4">{error}</div>;
  if (!decoracion) return null;

  return (
    <div className="space-y-6">
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Elemento: {editingElement?.name}</DialogTitle>
          </DialogHeader>
          {editingElement && (
            <div className="space-y-4">
              <div className="space-y-1"><Label htmlFor="el-name">Nombre</Label><Input id="el-name" value={editingElement.name} onChange={e => setEditingElement({...editingElement, name: e.target.value})}/></div>
              {editingElement.category?.includes('Mesa') && <div className="space-y-1"><Label htmlFor="el-seats">Asientos</Label><Input id="el-seats" type="number" value={editingElement.seats || 0} onChange={e => setEditingElement({...editingElement, seats: Number(e.target.value) || 0})}/></div>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateElement}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><LayoutDashboard className="w-8 h-8 text-primary"/>Diseño de Mesas y Salón</h1>
        <Link href="/fiestas/nueva/invitados" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver a Invitados</Button></Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Lienzo del Salón</CardTitle></CardHeader>
            <CardContent>
              <div className="relative border rounded-lg bg-muted/30 overflow-auto canvas-grid-background">
                <div style={{ width: `${decoracion.salonWidth || 800}px`, height: `${decoracion.salonHeight || 600}px`}} className="relative">
                  {decoracion.salonPlanBackgroundImageUrl && (
                      <NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50" />
                  )}
                  {(decoracion.salonElements || []).map(el => {
                    const guestsAtTable = invitados.filter(i => i.tableNumber === el.name);
                    const seatsTaken = guestsAtTable.reduce((acc, g) => acc + (g.partySize || 1), 0);
                    const isFull = el.seats !== undefined && seatsTaken >= el.seats;
                    const nodeRef = React.createRef<HTMLDivElement>();
                    return (
                      <Draggable
                        key={el.id}
                        nodeRef={nodeRef}
                        bounds="parent"
                        grid={[grid, grid]}
                        position={{ x: el.x, y: el.y }}
                        onStop={(e, data) => handleDragStop(e, data, el.id)}
                      >
                        <div 
                          ref={nodeRef}
                          id={el.id}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => handleGuestDrop(e, el.id)}
                          className={`absolute border-2 flex flex-col items-center justify-center p-1 cursor-grab active:cursor-grabbing ${el.category?.includes('Mesa Redonda') ? 'rounded-full' : 'rounded-md'} ${selectedElementId === el.id ? 'border-primary shadow-lg z-10' : 'border-gray-500 bg-white/80'}`}
                          style={{ width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`}}
                          onClick={() => setSelectedElementId(el.id)}
                        >
                          <p className="text-xs font-bold text-center truncate px-1">{el.name}</p>
                          {el.seats !== undefined && <p className={`text-[10px] ${isFull ? 'font-bold text-destructive' : 'text-muted-foreground'}`}>{seatsTaken} / {el.seats}</p>}
                          {guestsAtTable.length > 0 && (
                              <ul className="text-[8px] list-disc list-inside mt-1 overflow-y-auto max-h-12">
                                {guestsAtTable.map(g => <li key={g.id} className="truncate">{g.nombre} ({g.partySize || 1})</li>)}
                              </ul>
                          )}
                          {selectedElementId === el.id && (
                              <div className="absolute -top-7 -right-2 flex gap-0.5 z-20" style={{transform: `rotate(-${el.rotation}deg)`}}>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenEditModal(el)}><Edit className="w-3 h-3"/></Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleElementRotation(el.id)}><RotateCw className="w-3 h-3"/></Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteElement(el.id)}><Trash2 className="w-3 h-3"/></Button>
                              </div>
                          )}
                        </div>
                      </Draggable>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Controles</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => addElement('Mesa Redonda')}><Circle className="w-4 h-4 mr-2"/>Mesa Redonda</Button>
                <Button variant="outline" onClick={() => addElement('Mesa Rectangular')}><Square className="w-4 h-4 mr-2"/>Mesa Rectangular</Button>
                <Button variant="outline" onClick={() => addElement('Pista de Baile')}><Music className="w-4 h-4 mr-2"/>Pista</Button>
                <Button variant="outline" onClick={() => addElement('Barra')}><Beer className="w-4 h-4 mr-2"/>Barra</Button>
              </div>
               <Separator className="my-4"/>
               <div className="space-y-2">
                 <Label htmlFor="salon-width">Ancho del Salón (px)</Label>
                 <Input id="salon-width" type="number" value={decoracion.salonWidth || 800} onChange={e => setDecoracion(d => d ? {...d, salonWidth: Number(e.target.value)}: null)} />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="salon-height">Alto del Salón (px)</Label>
                 <Input id="salon-height" type="number" value={decoracion.salonHeight || 600} onChange={e => setDecoracion(d => d ? {...d, salonHeight: Number(e.target.value)}: null)} />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="salon-bg">URL Imagen de Fondo</Label>
                 <Input id="salon-bg" type="url" value={decoracion.salonPlanBackgroundImageUrl || ''} onChange={e => setDecoracion(d => d ? {...d, salonPlanBackgroundImageUrl: e.target.value}: null)} placeholder="https://ejemplo.com/plano.png"/>
               </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Invitados Confirmados</CardTitle></CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground mb-2">Arrastra un invitado a una mesa para asignarlo.</p>
               <ScrollArea className="h-96 border rounded-md p-2">
                <ul className="space-y-2">
                  {invitadosSinMesa.map(inv => (
                    <li 
                      key={inv.id} 
                      draggable 
                      onDragStart={e => e.dataTransfer.setData('guestId', inv.id)}
                      className="p-2 border rounded bg-background cursor-grab"
                    >
                      <p className="font-medium text-sm">{inv.nombre}</p>
                      <p className="text-xs text-muted-foreground">{inv.partySize || 1} persona(s)</p>
                    </li>
                  ))}
                  {invitadosSinMesa.length === 0 && <p className="text-sm text-center text-muted-foreground p-4">Todos los invitados confirmados tienen una mesa.</p>}
                </ul>
               </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
       <div className="flex justify-end mt-6">
            <Button size="lg" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2" />}
              Guardar Distribución
            </Button>
        </div>
    </div>
  );
}
