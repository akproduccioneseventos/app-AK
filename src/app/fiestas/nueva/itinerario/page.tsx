
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, Clock, GripVertical, Utensils, GlassWater, Music, CakeSlice, Camera, Diamond, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ProgramaEventoItem } from '@/types/fiesta';
import { getFiestaActual, updateProgramaFiestaActual } from '@/app/actions/fiesta-actual';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const iconMap: Record<string, React.ElementType> = {
  Utensils, GlassWater, Music, CakeSlice, Camera, Diamond, PartyPopper, Clock,
};

const ALL_ICONS = [
  { value: 'Clock', label: 'Reloj' },
  { value: 'Utensils', label: 'Cena' },
  { value: 'GlassWater', label: 'Bebidas' },
  { value: 'Music', label: 'Música/Baile' },
  { value: 'CakeSlice', label: 'Torta' },
  { value: 'Camera', label: 'Fotos' },
  { value: 'Diamond', label: 'Ceremonia' },
  { value: 'PartyPopper', label: 'Fiesta' },
];

function SortableItem({ item, onEdit, onDelete }: { item: ProgramaEventoItem, onEdit: (item: ProgramaEventoItem) => void, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = item.icono && iconMap[item.icono] ? iconMap[item.icono] : Clock;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm">
      <div {...listeners} {...attributes} className="cursor-grab p-1 text-muted-foreground"><GripVertical className="w-5 h-5" /></div>
      <div className="p-2 bg-primary/10 rounded-md"><Icon className="w-5 h-5 text-primary" /></div>
      <div className="flex-grow">
        <p className="font-semibold">{item.hora} - {item.titulo}</p>
        <p className="text-sm text-muted-foreground">{item.descripcion}</p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

export default function ItinerarioEventoPage() {
  const { toast } = useToast();
  const [programa, setPrograma] = useState<ProgramaEventoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ProgramaEventoItem> | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setPrograma(fiestaData.programa || []);
    } catch (err: any) {
      setError("No se pudo cargar el itinerario.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (item?: ProgramaEventoItem) => {
    setCurrentItem(item || { hora: '20:00', titulo: '', descripcion: '', icono: 'Clock' });
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.titulo) return;

    const newItem: ProgramaEventoItem = {
      id: currentItem.id || `prog_${Date.now()}`,
      ...currentItem,
    } as ProgramaEventoItem;

    let updatedPrograma;
    if (currentItem.id) {
      updatedPrograma = programa.map(p => p.id === newItem.id ? newItem : p);
    } else {
      updatedPrograma = [...programa, newItem].sort((a,b) => a.hora.localeCompare(b.hora));
    }
    setPrograma(updatedPrograma);
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setPrograma(prev => prev.filter(p => p.id !== id));
  };
  
  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setPrograma((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSaveItinerario = async () => {
    setIsSaving(true);
    try {
      const result = await updateProgramaFiestaActual(programa);
      if (result.success) {
        toast({ title: "Itinerario Guardado", description: "El cronograma del evento ha sido actualizado." });
        if (result.updatedData) setPrograma(result.updatedData);
      } else {
        throw new Error(result.error || "Error desconocido al guardar.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Añadir'} Momento</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label htmlFor="item-hora">Hora*</Label><Input id="item-hora" type="time" value={currentItem?.hora || ''} onChange={(e) => setCurrentItem(p => p ? {...p, hora: e.target.value} : null)} required /></div>
              <div className="space-y-1"><Label htmlFor="item-icono">Icono</Label>
                <Select value={currentItem?.icono || 'Clock'} onValueChange={(val) => setCurrentItem(p => p ? {...p, icono: val} : null)}>
                  <SelectTrigger id="item-icono"><SelectValue/></SelectTrigger>
                  <SelectContent>{ALL_ICONS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label htmlFor="item-titulo">Título*</Label><Input id="item-titulo" value={currentItem?.titulo || ''} onChange={(e) => setCurrentItem(p => p ? {...p, titulo: e.target.value} : null)} required /></div>
            <div className="space-y-1"><Label htmlFor="item-desc">Descripción (Opcional)</Label><Textarea id="item-desc" value={currentItem?.descripcion || ''} onChange={(e) => setCurrentItem(p => p ? {...p, descripcion: e.target.value} : null)} rows={3} /></div>
            <DialogFooter className="pt-3">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Itinerario del Evento</h1>
        </div>
        <Link href="/fiestas/nueva" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cronograma del Evento</CardTitle>
          <CardDescription>Organiza cada momento de la fiesta. Arrastra y suelta para reordenar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => openModal()}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Momento</Button>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={programa.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {programa.map(item => (
                  <SortableItem key={item.id} item={item} onEdit={openModal} onDelete={handleDeleteItem} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
           {programa.length === 0 && <p className="text-center text-muted-foreground p-6">Aún no has añadido ningún momento al itinerario.</p>}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={handleSaveItinerario} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
            Guardar Itinerario
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
